/* -----------------------------------------------------------------------
   <standard-shader> — the Standard lockup over a mark-driven dither field.

   Port of the Framer StandardShader component to a plain custom element.
   Two deliberate reductions from the Framer original:

     - No property controls. Framer exposed every shader uniform as an
       editable dial; here the tuned values are frozen in CONFIG below, so
       the mark reads identically everywhere it appears.
     - One mark. The Framer version could swap between four exploratory
       directions (Common Bearing / Lean In / The Bar / The Merge). Common
       Bearing is the settled mark, so it's the only one that ships.

   The field is the mark itself: three scaled copies of the Common Bearing
   silhouette are sampled along a spiral, summed into a coverage value, and
   resolved to hard dots by an 8x8 Bayer threshold. A feathered circle is
   punched out of the middle so the lockup always sits on clean ground.

   Attributes:
     reversed     present = dark ground with light dots and light type
     wordmark     lockup text (default "Standard")
     icon-only    present = mark alone, no wordmark or description
     no-motion    present = render one static frame

   Renders in light DOM to match <brand-card>. Standard shares RoleModel's
   typography, so the lockup inherits --font-active rather than carrying a
   face of its own (the Framer original hard-coded Proxima Nova).
   ----------------------------------------------------------------------- */

const MARK = {
  body: `<defs><mask id="rallyMask"><rect width="1088" height="1088" fill="white"/><circle cx="544" cy="544" r="24" fill="black"/></mask></defs><path mask="url(#rallyMask)" fill="{{blue}}" d="M487.046 88.981c36.984-.745 76.864-.162 113.914.025l-.05 186.301c-.03 31.838-.32 63.887.32 95.716.54 4.252.11 8.764 3.23 11.982 13.12 13.535 29.22-9.334 38.38-18.479l43.48-43.452 139.14-139.201c26.98 26.753 53.82 53.649 80.51 80.685L766.53 401.972l-40.3 40.17c-6.36 6.351-24.53 21.689-25.44 31.05-.4 4.108 1.95 7.825 4.75 10.802 13.69 5.464 89.93 3.072 109.13 3.056l184.35.004.01 113.906-244.34.03-66.05-.11c-25.81-.06-51.22-3.85-71.15 15.55-20.31 19.77-16.72 45.8-16.62 71.42l.11 64.6.01 246.58-113.961-.02.063-185.56c.014-31.75.236-63.48-.257-95.27.492-8.7-2.962-17.28-13.117-17.39-8.967-.1-25.455 19.49-31.838 25.88l-41.553 41.55-137.755 137.96c-27.001-26.74-53.844-53.65-80.526-80.71 45.998-47.53 95.666-95.8 142.655-142.76l37.533-37.44c6.785-6.73 25.032-21.77 25.181-31.7.14-9.28-8.633-12.21-16.915-12.36-31.336-.54-62.783-.31-94.164-.29l-187.321-.02-.022-113.849 247.261-.03 65.869.063c10.092.018 30.593.51 39.728-.965 10.903-1.804 20.972-6.962 28.807-14.756 20.318-20.076 16.523-45.007 16.454-71.112l-.097-65.263.031-246.007Z"/>`,
  description: "One horizon. We navigate together.",
  label: "Common Bearing",
  viewBox: "0 0 1088 1088",
};

// The tuned banner values, in place of the Framer property controls. These
// are the shader's dials, not the Framer file's DEFAULT_PROPS — DEFAULT_PROPS
// is only where an unconfigured instance starts.
//
// Two are worth knowing when retuning: coverage is read straight off `shape`
// by `step(threshold, shape)`, so fieldStrength/baseDensity are the dials for
// how solid the arm tips land and how dense the bed behind them is. fieldSize
// is inverse — smaller enlarges the mark, because `muv = q*scale + .5`.
const CONFIG = {
  baseDensity: 0.2,
  breathing: 0.035,
  clearFeather: 0.36,
  clearSize: 0.23,
  dotSize: 2.5,
  fieldSize: 0.5,
  fieldStrength: 0.95,
  rotation: 0.15,
  speed: 0.05,
  spiralAmount: 0.5,
  spiralArms: 1,
  spiralOverlap: 2,
  spiralTightness: 23,
};

const COLORS = {
  background: "#FAFAFA",
  blue: "#3A70B3",
  dots: "#27444D",
  ink: "#131415",
  reverseBackground: "#27444D",
  reverseDots: "#EEF3F4",
  reverseInk: "#FFFFFF",
};

// Fallbacks are the CONFIG colors pre-divided by 255, used only when a color
// string fails to parse — the shader still draws rather than going black.
const BACKGROUND_FALLBACK = { dark: [0.153, 0.267, 0.302], light: [1, 1, 1] };
const DOTS_FALLBACK = {
  dark: [0.94, 0.96, 0.96],
  light: [0.153, 0.267, 0.302],
};

const MARK_TEXTURE_SIZE = 512;
const MAX_PIXEL_RATIO = 1.5;

const HEX_RE = /^#(?<hex>[\da-f]{3}|[\da-f]{6})$/iu;
const RGB_RE = /rgba?\(\s*(?<r>[\d.]+)[,\s]+(?<g>[\d.]+)[,\s]+(?<b>[\d.]+)/iu;

const VERTEX_SOURCE = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

const FRAGMENT_SOURCE = `
precision highp float;
uniform vec2 r;
uniform float d;
uniform float t;
uniform float fieldSize;
uniform float fieldStrength;
uniform float baseDensity;
uniform float spiralAmount;
uniform float spiralOverlap;
uniform float spiralArms;
uniform float spiralTightness;
uniform float rotation;
uniform float breathing;
uniform float clearSize;
uniform float clearFeather;
uniform sampler2D markTex;
uniform vec3 bg;
uniform vec3 dots;
varying vec2 v;
float bayer2(vec2 p){vec2 q=mod(p,2.);if(q.y<1.)return q.x<1.?0.:2.;return q.x<1.?3.:1.;}
float bayer4(vec2 p){return 4.*bayer2(mod(p,2.))+bayer2(floor(p/2.));}
float bayer8(vec2 p){return 4.*bayer4(mod(p,4.))+bayer2(floor(p/4.));}
float markAt(vec2 uv,float scale,float angle){
    vec2 q=uv-.5;q.x*=r.x/r.y;
    q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
    vec2 muv=q*scale+.5;
    if(muv.x<0.||muv.x>1.||muv.y<0.||muv.y>1.)return 0.;
    return texture2D(markTex,muv).a;
}
float markSpiral(vec2 uv,float scale,float angle,float phase){
    vec2 q=uv-.5;q.x*=r.x/r.y;
    float radius=length(q);
    float theta=atan(q.y,q.x)+radius*spiralTightness*(spiralArms/4.)+phase+angle;
    q=vec2(cos(theta),sin(theta))*radius*scale+.5;
    if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 0.;
    return texture2D(markTex,q).a;
}
void main(){
    float pxSize=d;
    vec2 px=floor(gl_FragCoord.xy/pxSize);
    float breathe=breathing*sin(t*2.4);
    float spin=t*rotation;
    float original=.42*markAt(v,(1.27+breathe)*fieldSize,spin)+.28*markAt(v,(1.01-breathe*.55)*fieldSize,spin)+.17*markAt(v,(.78+breathe*.3)*fieldSize,spin);
    float trailA=.42*markSpiral(v,(1.08+breathe)*fieldSize,spin,0.);
    float trailB=.28*markSpiral(v,(.94-breathe*.55)*fieldSize,spin,2.094);
    float trailC=.17*markSpiral(v,(.78+breathe*.3)*fieldSize,spin,4.189);
    float trail=(trailA+trailB+trailC)*mix(.42,.72,spiralOverlap);
    float shape=baseDensity+fieldStrength*(original+trail*spiralAmount*.48);
    vec2 center=v-.5;center.x*=r.x/r.y;
    float centerClear=1.-smoothstep(clearSize,clearSize+clearFeather,length(center));
    shape=clamp(shape*(1.-centerClear),0.,1.);
    float threshold=1.-bayer8(mod(px,8.))/64.;
    gl_FragColor=vec4(mix(bg,dots,step(threshold,shape)),1.);
}`;

const markDataUri = (blue, ink) => {
  const body = MARK.body
    .replaceAll("{{blue}}", blue)
    .replaceAll("{{ink}}", ink);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK.viewBox}">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const colorVector = (value, fallback) => {
  const hex = value.trim().match(HEX_RE);
  if (hex) {
    const { hex: raw } = hex.groups;
    const full = raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
    return [0, 2, 4].map(
      (offset) => Number.parseInt(full.slice(offset, offset + 2), 16) / 255
    );
  }
  const rgb = value.match(RGB_RE);
  if (rgb) {
    const { r, g, b } = rgb.groups;
    return [Number(r) / 255, Number(g) / 255, Number(b) / 255];
  }
  return fallback;
};

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export class StandardShader extends HTMLElement {
  static get observedAttributes() {
    return ["reversed", "wordmark", "icon-only", "no-motion"];
  }

  connectedCallback() {
    if (!this._built) {
      this._built = true;
      this._build();
    }
    this._syncLockup();
    this._startField();
  }

  disconnectedCallback() {
    this._stopField();
  }

  attributeChangedCallback() {
    if (!this._built) {
      return;
    }
    this._syncLockup();
    this._stopField();
    this._startField();
  }

  // ---- resolved presentation ------------------------------------------

  get reversed() {
    return this.hasAttribute("reversed");
  }
  get iconOnly() {
    return this.hasAttribute("icon-only");
  }
  get wordmark() {
    return this.getAttribute("wordmark") || "Standard";
  }
  get _ink() {
    return this.reversed ? COLORS.reverseInk : COLORS.ink;
  }
  get _background() {
    return this.reversed ? COLORS.reverseBackground : COLORS.background;
  }
  get _dots() {
    return this.reversed ? COLORS.reverseDots : COLORS.dots;
  }

  // ---- DOM ---------------------------------------------------------------

  _build() {
    this.classList.add("standard-shader");
    this.setAttribute("role", "img");

    this._canvas = document.createElement("canvas");
    this._canvas.className = "standard-shader__canvas";
    this._canvas.setAttribute("aria-hidden", "true");

    const lockup = document.createElement("div");
    lockup.className = "standard-shader__lockup";
    /* html */
    lockup.setHTMLUnsafe(`
      <div class="standard-shader__mark-row">
        <img class="standard-shader__mark" alt="" />
        <span class="standard-shader__wordmark"></span>
      </div>
      <p class="standard-shader__description"></p>
    `);

    this.append(this._canvas, lockup);
  }

  _syncLockup() {
    this.classList.toggle("standard-shader--reversed", this.reversed);
    this.classList.toggle("standard-shader--icon-only", this.iconOnly);
    this.setAttribute("aria-label", `${this.wordmark} — ${MARK.label}`);

    this._markUri = markDataUri(COLORS.blue, this._ink);
    this.querySelector(".standard-shader__mark").src = this._markUri;
    this.querySelector(".standard-shader__wordmark").textContent =
      this.wordmark;
    this.querySelector(".standard-shader__description").textContent =
      MARK.description;
  }

  // ---- WebGL field --------------------------------------------------------

  _startField() {
    const gl = this._canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
    });
    if (!gl) {
      return;
    }

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    if (!(vertex && fragment)) {
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name) => gl.getUniformLocation(program, name);
    const resolutionUniform = uniform("r");
    const densityUniform = uniform("d");
    const timeUniform = uniform("t");
    const tunedUniforms = Object.keys(CONFIG)
      .filter((key) => key !== "speed" && key !== "dotSize")
      .map((key) => [uniform(key), CONFIG[key]]);

    const tone = this.reversed ? "dark" : "light";
    gl.uniform3fv(
      uniform("bg"),
      colorVector(this._background, BACKGROUND_FALLBACK[tone])
    );
    gl.uniform3fv(
      uniform("dots"),
      colorVector(this._dots, DOTS_FALLBACK[tone])
    );

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.uniform1i(uniform("markTex"), 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const canvas = this._canvas;
    const start = performance.now();
    const shouldAnimate =
      !this.hasAttribute("no-motion") &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const draw = (now = start) => {
      resize();
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
      gl.uniform1f(
        densityUniform,
        CONFIG.dotSize * (canvas.width / Math.max(1, canvas.clientWidth))
      );
      gl.uniform1f(
        timeUniform,
        shouldAnimate ? ((now - start) / 1000) * CONFIG.speed : 0
      );
      for (const [location, value] of tunedUniforms) {
        gl.uniform1f(location, value);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (shouldAnimate) {
        this._frame = requestAnimationFrame(draw);
      }
    };

    const image = new Image();
    image.addEventListener("load", () => {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = MARK_TEXTURE_SIZE;
      textureCanvas.height = MARK_TEXTURE_SIZE;
      const context = textureCanvas.getContext("2d");
      if (!context) {
        return;
      }
      context.clearRect(0, 0, MARK_TEXTURE_SIZE, MARK_TEXTURE_SIZE);
      context.drawImage(image, 0, 0, MARK_TEXTURE_SIZE, MARK_TEXTURE_SIZE);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        textureCanvas
      );
      draw();
    });
    image.src = this._markUri;

    // A static field still has to repaint when the box changes size; an
    // animating one is already repainting every frame.
    this._observer = new ResizeObserver(() => {
      if (!shouldAnimate) {
        draw();
      }
    });
    this._observer.observe(canvas);
    draw();

    this._gl = { buffer, fragment, gl, program, texture, vertex };
  }

  _stopField() {
    cancelAnimationFrame(this._frame);
    this._observer?.disconnect();
    if (!this._gl) {
      return;
    }
    const { buffer, fragment, gl, program, texture, vertex } = this._gl;
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    this._gl = null;
  }
}

customElements.define("standard-shader", StandardShader);
