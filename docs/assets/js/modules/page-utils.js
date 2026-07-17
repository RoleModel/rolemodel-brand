// ---- Shared utilities for brand page rendering ----

import { BRANDS, CATEGORIES } from "./brand-data.js?v=0271783e";
import { PAGE_DATA } from "./page-data.js?v=0271783e";

// True when the page is loaded inside a <brand-card> iframe on the
// homepage — the card supplies navigation, so the page hides its own.
export const isEmbedded = () =>
  new URLSearchParams(window.location.search).get("embed") === "1";

// True when the page is one section of the single-page stacked layout
// (one-page.html) — the parent sizes this iframe to the content height,
// so the page reports its height and never scrolls internally.
export const isStacked = () =>
  new URLSearchParams(window.location.search).get("stack") === "1";

// Flag the document as early as possible so embed CSS applies before paint.
if (isEmbedded()) {
  document.documentElement.classList.add("is-embedded");
}
if (isStacked()) {
  document.documentElement.classList.add("is-stacked");
}

// ---- Stack mode: report content height to the parent page ----
// one-page.html listens for these messages and sets the iframe height, so
// the section participates in the parent's normal document flow.
const startHeightReporting = (categorySlug) => {
  // body.scrollHeight, not documentElement's: entrance transforms and
  // absolutely-positioned decorations can permanently inflate the html
  // element's scroll bounds past the real content (overflow is hidden in
  // stack mode, so that phantom space would render as dead whitespace).
  const post = () => {
    const height = Math.ceil(document.body.scrollHeight);
    window.parent.postMessage(
      { height, slug: categorySlug, type: "rm-section-height" },
      "*"
    );
  };
  const observer = new ResizeObserver(post);
  observer.observe(document.documentElement);
  observer.observe(document.body);
  // Fonts, images, and settling entrance animations change height without
  // always resizing the observed border boxes — belt-and-braces re-posts.
  window.addEventListener("load", post);
  document.fonts?.addEventListener("loadingdone", post);
  for (const ms of [600, 1600, 3200]) {
    setTimeout(post, ms);
  }
  post();
};

// Read ?brand= from URL, fallback to stored value or 'rolemodel'
export const getActiveBrandSlug = () => {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("brand");
  if (fromUrl && BRANDS[fromUrl]) {
    return fromUrl;
  }
  return localStorage.getItem("brandGuide.activeBrand") || "rolemodel";
};

// Resolve brand slug to data objects (brand-data.js + page-data.js)
export const resolveActiveBrand = () => {
  const slug = getActiveBrandSlug();
  const brand = BRANDS[slug] || {};
  const pageData = PAGE_DATA[slug] || {};
  return { brand, pageData, slug };
};

// ---- Color math ----
export const hexToRgb = (hex) => {
  const h = hex.replace("#", "").slice(0, 6);
  if (h.length !== 6) {
    return { b: 0, g: 0, r: 0 };
  }
  return {
    b: Number.parseInt(h.slice(4, 6), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    r: Number.parseInt(h.slice(0, 2), 16),
  };
};

const toHex2 = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

export const rgbToHex = (r, g, b) => `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;

// Convert one sRGB channel (0–255) to its linear-light value for luminance.
const lin = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export const contrastRatio = (l1, l2) => {
  const hi = Math.max(l1, l2),
    lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
};

export const readableTextColor = (bgHex) => {
  const bgL = relativeLuminance(bgHex);
  const inkC = contrastRatio(bgL, relativeLuminance("#04242B"));
  const paperC = contrastRatio(bgL, relativeLuminance("#FFFFFF"));
  const best = inkC >= paperC ? "#04242B" : "#FFFFFF";
  if (Math.max(inkC, paperC) >= 4.5) {
    return best;
  }
  return contrastRatio(bgL, 0) >= contrastRatio(bgL, 1) ? "#000000" : "#FFFFFF";
};

export const hexToHsl = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const bb = b / 255,
    gg = g / 255,
    rr = r / 255;
  const max = Math.max(rr, gg, bb),
    min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) {
      h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    } else if (max === gg) {
      h = ((bb - rr) / d + 2) / 6;
    } else {
      h = ((rr - gg) / d + 4) / 6;
    }
  }
  return { h: h * 360, l: l * 100, s: s * 100 };
};

// Piecewise hue-to-channel helper used by hslToHex.
const hue2rgb = (p, q, t) => {
  let tt = t;
  if (tt < 0) {
    tt += 1;
  }
  if (tt > 1) {
    tt -= 1;
  }
  if (tt < 1 / 6) {
    return p + (q - p) * 6 * tt;
  }
  if (tt < 1 / 2) {
    return q;
  }
  if (tt < 2 / 3) {
    return p + (q - p) * (2 / 3 - tt) * 6;
  }
  return p;
};

export const hslToHex = (h, s, l) => {
  const ss = Math.max(0, Math.min(1, s / 100));
  const ll = Math.max(0, Math.min(1, l / 100));
  let b, g, r;
  if (ss === 0) {
    r = ll;
    g = ll;
    b = ll;
  } else {
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const hh = (((h % 360) + 360) % 360) / 360;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }
  return rgbToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  );
};

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const generateColorScale = (baseHex) => {
  const { h, s, l } = hexToHsl(baseHex);
  const lightL = Math.min(99, l + (100 - l) * 0.7);
  const lightS = s * 0.5;
  const result = [];
  for (let i = 0; i < 7; i += 1) {
    const t = i / 7;
    result.push(
      hslToHex(
        h,
        clamp(lightS + (s - lightS) * t, 0, 100),
        clamp(lightL + (l - lightL) * t, 0, 100)
      )
    );
  }
  result.push(hslToHex(h, s, l));
  const darkerL = clamp(l - Math.max(10, l * 0.22), 5, 95);
  result.push(hslToHex(h, clamp(s * 1.08, 0, 100), darkerL));
  return result;
};

// ---- Copy to clipboard ----
export const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard API can reject (no permission/insecure context); fall through
    // to the legacy execCommand path below.
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
    document.body.append(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  } catch {
    return false;
  }
};

// ---- Show/hide copy toast ----
let toastTimer = null;
export const showToast = (message) => {
  let toast = document.querySelector("#copy-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "copy-toast";
    toast.className = "copy-toast";
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("copy-toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => toast.classList.remove("copy-toast--visible"),
    1800
  );
};

// ---- Scroll-in reveal ----
export const initReveal = () => {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const delay = e.target.dataset.delay
            ? Number(e.target.dataset.delay)
            : 0;
          setTimeout(() => e.target.classList.add("reveal--visible"), delay);
          observer.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  for (const el of items) {
    observer.observe(el);
  }
};

// ---- Stagger reveal delay helper ----
export const staggerReveal = (elements, baseDelay = 0, step = 60) => {
  for (const [i, el] of elements.entries()) {
    el.dataset.delay = baseDelay + i * step;
  }
};

// ---- Build full page nav HTML ----
export const buildNavHTML = (slug, brandName) => {
  if (isEmbedded()) {
    return "";
  }

  const brandPills = Object.entries(BRANDS)
    .map(
      ([s, b]) =>
        /* html */
        `
    <button class="page-nav__pill${s === slug ? " page-nav__pill--active" : ""}" data-brand="${s}">${b.name.split(" ")[0]}</button>
  `
    )
    .join("");

  /* html */
  return `
    <nav class="page-nav" id="page-nav">
      <a href="../index.html" class="page-nav__back" aria-label="Back to Brand Guidelines">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Brand Guidelines
      </a>
      <div class="page-nav__divider" aria-hidden="true"></div>
      <span class="page-nav__brand">${brandName}</span>
      <div class="page-nav__switcher" role="navigation" aria-label="Switch brand">
        ${brandPills}
      </div>
    </nav>
  `;
};

// ---- Wire brand switcher navigation (event delegation) ----
export const wireNavSwitcher = (currentSlug, currentCategory) => {
  const nav = document.querySelector("#page-nav");
  if (!nav) {
    return;
  }
  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".page-nav__pill");
    if (!btn) {
      return;
    }
    const newSlug = btn.dataset.brand;
    if (newSlug === currentSlug) {
      return;
    }
    localStorage.setItem("brandGuide.activeBrand", newSlug);
    window.location.href = `${currentCategory}.html?brand=${newSlug}`;
  });
};

// ---- Category metadata (section number label + name + tagline) ----
export const categoryInfo = (categorySlug, fallbackNum = "01") => {
  const index = CATEGORIES.findIndex((c) => c.slug === categorySlug);
  const category = CATEGORIES[index] || {};
  const numLabel =
    index === -1 ? fallbackNum : String(index + 1).padStart(2, "0");
  return { category, numLabel };
};

// ---- Reveal the page once its module has built the injected DOM ----
// The pages hide themselves (html.is-building, set in the page <head>) so the
// JS-injected header/content can't shift layout after first paint. initPage
// runs at the top of every page module, so scheduling the reveal on the next
// animation frame fires it after the module's synchronous setHTMLUnsafe calls
// complete — collapsing many post-paint reflows into one shift-free paint.
const revealWhenBuilt = () => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove("is-building");
  });
};

// ---- Shared page scaffolding: nav + accent + document title ----
export const initPage = (categorySlug) => {
  const { slug, brand, pageData } = resolveActiveBrand();
  const accentHex = brand.primary || "#3A70B3";

  document.documentElement.style.setProperty("--page-accent", accentHex);
  document.documentElement.style.setProperty(
    "--font-active",
    brand.font || "'DM Sans', sans-serif"
  );

  const navRoot = document.querySelector("#nav-root");
  if (navRoot) {
    navRoot.setHTMLUnsafe(buildNavHTML(slug, brand.name || "Brand"));
    wireNavSwitcher(slug, categorySlug);
  }

  if (isStacked()) {
    startHeightReporting(categorySlug);
  }

  revealWhenBuilt();

  return { accentHex, brand, pageData, slug };
};
