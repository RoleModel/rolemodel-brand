/* -----------------------------------------------------------------------
   <halftone-image> — a photograph resolved to brand-colored dots.

   Thin wrapper over the shared renderer in modules/halftone.js, which owns
   the shader and the defaults. The export tool (tools/halftone.html) draws
   through the same renderer, so a tile on the Imagery page and a downloaded
   file get an identical treatment instead of two copies that drift.

   Renders an <img> underneath the canvas. If WebGL is unavailable, or the
   image can't be used as a texture (a cross-origin source with no CORS
   headers), the canvas never paints and the plain photograph shows through
   — this degrades to an ordinary image rather than an empty box.

   Attributes (all optional but src; defaults in HALFTONE_DEFAULTS):
     src      image URL
     alt      accessible name; omit for decorative use
     ink      dot color
     paper    ground color
     dot      dot size in CSS px
     black    input level mapped to zero ink — keep near 0 so highlights
              still carry dots; raising it clips them to blank paper
     white    input level mapped to full ink — lower for more contrast
     gamma    curve applied after the levels remap; <1 darkens midtones
   ----------------------------------------------------------------------- */

import {
  HALFTONE_DEFAULTS,
  HalftoneRenderer,
} from "../modules/halftone.js?v=b8a53096";

const MAX_PIXEL_RATIO = 1.5;

export class HalftoneImage extends HTMLElement {
  connectedCallback() {
    if (this._built) {
      return;
    }
    this._built = true;
    this._build();

    // A page of these means a JPEG decode and a GL context each if they all
    // start at once, so hold off until the tile is near the viewport.
    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._observer.disconnect();
            this._render();
          }
        }
      },
      { rootMargin: "200px" }
    );
    this._observer.observe(this);
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._resize?.disconnect();
    this._renderer?.dispose();
  }

  _build() {
    this.classList.add("halftone-image");

    this._img = document.createElement("img");
    this._img.className = "halftone-image__source";
    this._img.alt = this.getAttribute("alt") ?? "";
    this._img.loading = "lazy";
    this._img.decoding = "async";
    this._img.crossOrigin = "anonymous";
    this._img.src = this.getAttribute("src");

    this._canvas = document.createElement("canvas");
    this._canvas.className = "halftone-image__canvas";
    this._canvas.setAttribute("aria-hidden", "true");

    this.append(this._img, this._canvas);
  }

  _render() {
    const paint = () => this._paint();
    if (this._img.complete && this._img.naturalWidth > 0) {
      paint();
      return;
    }
    this._img.addEventListener("load", paint, { once: true });
  }

  // The renderer takes dot size in canvas pixels; the attribute is CSS px,
  // so it scales by however many canvas pixels the box is being drawn at.
  _options(canvasScale) {
    const number = (attr, fallback) =>
      Number(this.getAttribute(attr) ?? fallback);
    return {
      black: number("black", HALFTONE_DEFAULTS.black),
      dot: number("dot", HALFTONE_DEFAULTS.dot) * canvasScale,
      gamma: number("gamma", HALFTONE_DEFAULTS.gamma),
      ink: this.getAttribute("ink") ?? HALFTONE_DEFAULTS.ink,
      paper: this.getAttribute("paper") ?? HALFTONE_DEFAULTS.paper,
      white: number("white", HALFTONE_DEFAULTS.white),
    };
  }

  _paint() {
    const canvas = this._canvas;
    const renderer = new HalftoneRenderer(canvas);
    if (!(renderer.ok && renderer.setImage(this._img))) {
      renderer.dispose();
      return;
    }
    this._renderer = renderer;

    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      renderer.draw(
        this._options(canvas.width / Math.max(1, canvas.clientWidth))
      );
    };

    draw();
    this.classList.add("halftone-image--painted");

    this._resize = new ResizeObserver(draw);
    this._resize.observe(canvas);
  }
}

customElements.define("halftone-image", HalftoneImage);
