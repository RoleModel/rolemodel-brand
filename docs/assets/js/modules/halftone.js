/* -----------------------------------------------------------------------
   Halftone renderer — the shared treatment.

   A photograph's luminance is remapped through a levels pair and a gamma
   curve, then quantized to exactly two brand colors by an 8x8 Bayer
   threshold. Dark areas of the image turn on more dots.

   This module owns the GLSL and the defaults so the two consumers can't
   drift apart: <halftone-image> (components/halftone-image.js) paints tiles
   on the Imagery page, and the export tool (tools/halftone.html) renders the
   same treatment at full resolution for download.

   Sizing note: `dot` is in *canvas* pixels, not CSS pixels. A caller drawing
   to a devicePixelRatio-scaled canvas multiplies by that ratio; a caller
   exporting at full resolution passes it through. Keeping the conversion out
   here is what lets the tool preview at export resolution and get an export
   that matches the preview exactly.
   ----------------------------------------------------------------------- */

export const HALFTONE_DEFAULTS = {
  black: 0.02,
  dot: 2,
  gamma: 0.9,
  ink: "#26454D",
  paper: "#FAFAFA",
  white: 0.58,
};

const HEX_RE = /^#(?<hex>[\da-f]{3}|[\da-f]{6})$/iu;

const VERTEX_SOURCE = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

const FRAGMENT_SOURCE = `
precision highp float;
uniform vec2 r;
uniform float d;
uniform float imgAspect;
uniform float gamma;
uniform float black;
uniform float white;
uniform sampler2D photoTex;
uniform vec3 paper;
uniform vec3 ink;
varying vec2 v;
float bayer2(vec2 p){vec2 q=mod(p,2.);if(q.y<1.)return q.x<1.?0.:2.;return q.x<1.?3.:1.;}
float bayer4(vec2 p){return 4.*bayer2(mod(p,2.))+bayer2(floor(p/2.));}
float bayer8(vec2 p){return 4.*bayer4(mod(p,4.))+bayer2(floor(p/4.));}
// Cover-fit: scale the sampled range down on the axis that overflows, so the
// photo fills the box and the excess is cropped rather than squashed.
vec2 coverUV(vec2 uv){
    float canvasAspect = r.x / r.y;
    vec2 s = canvasAspect > imgAspect
        ? vec2(1., imgAspect / canvasAspect)
        : vec2(canvasAspect / imgAspect, 1.);
    return (uv - .5) * s + .5;
}
void main(){
    vec2 px = floor(gl_FragCoord.xy / d);
    vec3 photo = texture2D(photoTex, coverUV(v)).rgb;
    float luma = dot(photo, vec3(.299, .587, .114));
    // Levels first, then gamma: stretch the range the photo actually uses
    // across 0..1 so highlights keep dots and shadows reach full ink.
    float level = clamp((1. - luma - black) / max(.001, white - black), 0., 1.);
    float coverage = pow(level, gamma);
    float threshold = 1. - bayer8(mod(px, 8.)) / 64.;
    gl_FragColor = vec4(mix(paper, ink, step(threshold, coverage)), 1.);
}`;

export const colorVector = (value, fallback) => {
  const hex = String(value).trim().match(HEX_RE);
  if (!hex) {
    return fallback;
  }
  const { hex: rawHex } = hex.groups;
  const full =
    rawHex.length === 3 ? [...rawHex].map((c) => c + c).join("") : rawHex;
  return [0, 2, 4].map(
    (offset) => Number.parseInt(full.slice(offset, offset + 2), 16) / 255
  );
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

/* One GL context per renderer. Browsers cap the number of live WebGL
   contexts (commonly ~16), so a batch job should build a single renderer and
   reuse it across images rather than one per file. */
export class HalftoneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ok = false;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) {
      return;
    }

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    if (!(vertex && fragment)) {
      return;
    }
    const program = gl.createProgram();
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

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i(gl.getUniformLocation(program, "photoTex"), 0);

    this.gl = gl;
    this.program = program;
    this.buffer = buffer;
    this.texture = texture;
    this.vertex = vertex;
    this.fragment = fragment;
    this.ok = true;
  }

  /* Returns false when the image can't be used as a texture — a cross-origin
     source without CORS headers. Callers fall back to showing the original. */
  setImage(image) {
    if (!this.ok) {
      return false;
    }
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
    } catch {
      return false;
    }
    this.aspect = image.naturalWidth
      ? image.naturalWidth / image.naturalHeight
      : image.width / image.height;
    return true;
  }

  draw(options = {}) {
    if (!this.ok) {
      return;
    }
    const { gl, program, canvas } = this;
    const opts = { ...HALFTONE_DEFAULTS, ...options };
    const uniform = (name) => gl.getUniformLocation(program, name);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniform("r"), canvas.width, canvas.height);
    gl.uniform1f(uniform("d"), Math.max(1, opts.dot));
    gl.uniform1f(uniform("imgAspect"), opts.aspect ?? this.aspect ?? 1);
    gl.uniform1f(uniform("gamma"), opts.gamma);
    gl.uniform1f(uniform("black"), opts.black);
    gl.uniform1f(uniform("white"), opts.white);
    gl.uniform3fv(uniform("paper"), colorVector(opts.paper, [1, 1, 1]));
    gl.uniform3fv(uniform("ink"), colorVector(opts.ink, [0.153, 0.267, 0.302]));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    if (!this.ok) {
      return;
    }
    const { gl } = this;
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    gl.deleteShader(this.vertex);
    gl.deleteShader(this.fragment);
    this.ok = false;
  }
}
