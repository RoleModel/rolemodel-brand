/* -----------------------------------------------------------------------
   Halftone export tool — batch image processing, entirely in the browser.

   Everything is local: an uploaded file becomes a same-origin blob URL, so
   the canvas is never tainted and `toBlob` is allowed. No upload, no server,
   nothing leaves the machine. That is also why this works on GitHub Pages,
   which serves static files only.

   Preview fidelity: each canvas is sized to the *export* resolution and
   scaled down by CSS for display. Dot size is therefore in output pixels,
   and what is on screen is what lands in the file. Sizing the canvas to the
   display box instead would make the exported dots finer than the preview.
   ----------------------------------------------------------------------- */

/* oxlint-disable promise/avoid-new --
   Two browser APIs this file depends on are callback-only with no promise
   form — canvas.toBlob and setTimeout — so wrapping them is the only option.
   Scoped to this file rather than the ruleset. */

import {
  HALFTONE_DEFAULTS,
  HalftoneRenderer,
} from "../modules/halftone.js?v=b8a53096";

const MAX_EDGE_LIMIT = 8192;
const JPEG_QUALITY = 0.92;
const DOWNLOAD_GAP_MS = 350;

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const CONTROLS = [
  { key: "dot", label: "Dot size", max: 12, min: 1, step: 0.5, unit: "px" },
  { key: "black", label: "Black point", max: 0.4, min: 0, step: 0.01 },
  { key: "white", label: "White point", max: 1, min: 0.2, step: 0.01 },
  { key: "gamma", label: "Gamma", max: 2, min: 0.3, step: 0.05 },
];

const state = {
  ...HALFTONE_DEFAULTS,
  format: "png",
  items: [],
  maxEdge: 2048,
};

// One renderer for the whole session. Browsers cap live WebGL contexts at
// around 16, so a batch of 20 images must reuse a single context rather than
// creating one per file.
let renderer = null;
let scratch = null;

const el = (id) => document.querySelector(`#${id}`);

const ensureRenderer = () => {
  if (!scratch) {
    scratch = document.createElement("canvas");
    renderer = new HalftoneRenderer(scratch);
  }
  return renderer?.ok ? renderer : null;
};

// Render at the requested longest edge regardless of the source size,
// upscaling when asked. That is normally wrong for photographs, but the
// output here is a dot field evaluated per output pixel: a large render from
// a small source still produces a crisp dither, because the photo's detail
// is being discarded and replaced by dots either way. Print wants the big
// one. Aspect ratio is preserved.
const outputSize = (image, maxEdge) => {
  const { naturalWidth: w, naturalHeight: h } = image;
  const scale = maxEdge / Math.max(w, h);
  return {
    height: Math.max(1, Math.round(h * scale)),
    width: Math.max(1, Math.round(w * scale)),
  };
};

const renderItem = (item) => {
  const active = ensureRenderer();
  if (!(active && item.image.naturalWidth)) {
    return;
  }
  const { width, height } = outputSize(item.image, state.maxEdge);
  scratch.width = width;
  scratch.height = height;

  active.setImage(item.image);
  active.draw({
    black: state.black,
    dot: state.dot,
    gamma: state.gamma,
    ink: state.ink,
    paper: state.paper,
    white: state.white,
  });

  // Copy out of the shared GL canvas into this item's own 2D canvas, so all
  // previews can coexist and each can be exported independently.
  item.canvas.width = width;
  item.canvas.height = height;
  item.canvas.getContext("2d").drawImage(scratch, 0, 0);
  item.card.querySelector(".ht-card__meta").textContent =
    `${item.name} — ${width}x${height}`;
};

const renderAll = () => {
  for (const item of state.items) {
    renderItem(item);
  }
};

const exportName = (name) =>
  `${name.replace(/\.[^.]+$/u, "")}-halftone.${state.format}`;

// canvas.toBlob is callback-based with no promise form, so bridging it is
// the only option here.
const toBlob = (canvas) =>
  new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      state.format === "jpg" ? "image/jpeg" : "image/png",
      JPEG_QUALITY
    );
  });

const download = async (item) => {
  const blob = await toBlob(item.canvas);
  if (!blob) {
    item.card.querySelector(".ht-card__meta").textContent =
      `${item.name} — export failed at ${item.canvas.width}x${item.canvas.height}. Try a smaller size.`;
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportName(item.name);
  link.click();
  URL.revokeObjectURL(url);
};

const downloadAll = async () => {
  const button = el("download-all");
  button.disabled = true;
  // Sequential with a gap: browsers throttle or silently drop a burst of
  // simultaneous downloads, and zipping would need a library we can't load.
  for (const [index, item] of state.items.entries()) {
    button.textContent = `Downloading ${index + 1} of ${state.items.length}...`;
    // Sequential on purpose — Promise.all here would fire every download at
    // once, which browsers throttle or silently drop.
    // oxlint-disable-next-line no-await-in-loop
    await download(item);
    // oxlint-disable-next-line no-await-in-loop
    await sleep(DOWNLOAD_GAP_MS);
  }
  button.disabled = false;
  button.textContent = `Download all (${state.items.length})`;
};

const addFiles = async (files) => {
  const images = [...files].filter((file) => file.type.startsWith("image/"));
  for (const file of images) {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    // Decoded one at a time so naturalWidth is known before the first draw.
    // oxlint-disable-next-line no-await-in-loop
    await image.decode().catch(() => null);
    if (!image.naturalWidth) {
      URL.revokeObjectURL(url);
      continue;
    }

    const card = document.createElement("figure");
    card.className = "ht-card";
    /* html */
    card.setHTMLUnsafe(`
      <canvas class="ht-card__canvas"></canvas>
      <figcaption class="ht-card__meta"></figcaption>
      <div class="ht-card__actions">
        <button type="button" class="download-button ht-card__save">Download</button>
        <button type="button" class="ht-card__remove" aria-label="Remove">Remove</button>
      </div>
    `);

    const item = {
      canvas: card.querySelector(".ht-card__canvas"),
      card,
      image,
      name: file.name,
      url,
    };
    card
      .querySelector(".ht-card__save")
      .addEventListener("click", () => download(item));
    card.querySelector(".ht-card__remove").addEventListener("click", () => {
      URL.revokeObjectURL(item.url);
      state.items = state.items.filter((entry) => entry !== item);
      card.remove();
      syncCount();
    });

    state.items.push(item);
    el("gallery").append(card);
    renderItem(item);
  }
  syncCount();
};

const syncCount = () => {
  const count = state.items.length;
  el("empty").hidden = count > 0;
  el("bulk").hidden = count === 0;
  el("download-all").textContent = `Download all (${count})`;
};

const buildControls = () => {
  const host = el("controls");
  host.setHTMLUnsafe(
    CONTROLS.map(
      (c) =>
        /* html */
        `
    <label class="ht-control">
      <span class="ht-control__label">${c.label}</span>
      <input type="range" id="ctl-${c.key}" min="${c.min}" max="${c.max}"
             step="${c.step}" value="${state[c.key]}" />
      <output id="out-${c.key}">${state[c.key]}${c.unit ?? ""}</output>
    </label>`
    ).join("")
  );
};

// The range inputs are rebuilt by buildControls(), so their listeners have to
// be attached fresh each time rather than once at startup.
const wireControlInputs = () => {
  for (const c of CONTROLS) {
    el(`ctl-${c.key}`).addEventListener("input", (event) => {
      state[c.key] = Number(event.target.value);
      el(`out-${c.key}`).textContent = `${state[c.key]}${c.unit ?? ""}`;
      renderAll();
    });
  }
};

const wire = () => {
  buildControls();
  wireControlInputs();

  for (const key of ["ink", "paper"]) {
    el(`ctl-${key}`).value = state[key];
    el(`ctl-${key}`).addEventListener("input", (event) => {
      state[key] = event.target.value;
      renderAll();
    });
  }

  el("ctl-size").addEventListener("change", (event) => {
    state.maxEdge = Math.min(MAX_EDGE_LIMIT, Number(event.target.value));
    renderAll();
  });
  el("ctl-format").addEventListener("change", (event) => {
    state.format = event.target.value;
  });

  el("reset").addEventListener("click", () => {
    Object.assign(state, HALFTONE_DEFAULTS);
    buildControls();
    el("ctl-ink").value = state.ink;
    el("ctl-paper").value = state.paper;
    wireControlInputs();
    renderAll();
  });

  el("file").addEventListener("change", (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  });

  const drop = el("drop");
  for (const type of ["dragenter", "dragover"]) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      drop.classList.add("ht-drop--over");
    });
  }
  for (const type of ["dragleave", "drop"]) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      drop.classList.remove("ht-drop--over");
    });
  }
  drop.addEventListener("drop", (event) => {
    addFiles(event.dataTransfer.files);
  });

  el("download-all").addEventListener("click", downloadAll);
  syncCount();
};

wire();

if (!ensureRenderer()) {
  el("nowebgl").hidden = false;
}
