/* -----------------------------------------------------------------------
   Scroll-driven bento intro (Dropbox-style assembly).

   The homepage loads as a near-empty hero (faint grid backdrop + a big
   brand-colored heading + brand mark + a scroll cue). A tall spacer below a
   pinned bento supplies scroll distance; this module maps scroll progress to
   a global --enter (0 → 1) on <html>, and intro.css flies every <brand-card>
   in from a per-card off-screen vector into its slot, staggered.

   It's a one-time gate: once the scroll completes the scaffolding (hero +
   spacer + sticky pin + per-card vars) is torn down and the scroll reset to
   the top, leaving exactly the normal interactive portal. Open mode, view
   transitions and deep links are therefore never wrapped by the intro.

   Callers skip it entirely (never call setupIntro) on deep-link opens and
   under prefers-reduced-motion — see main.js.
   ----------------------------------------------------------------------- */

import { clamp } from "./page-utils.js";

const ENTER_PROP = "--enter";
const ACCENT_PROP = "--intro-accent";
const CARD_VARS = ["--enter-x", "--enter-y", "--enter-start", "--enter-end"];

// Finalize once we've effectively hit the bottom of the runway.
const FINALIZE_AT = 0.999;
// Progress by which the last card should be home (leaves a short dwell).
const SETTLE_BY = 0.82;
// Each card's own entry duration, in global-progress units (windows overlap).
const CARD_SPAN = 0.5;

// Distinct off-screen entry vectors, cycled per card so the bento assembles
// from every edge rather than fading in uniformly. Viewport-relative so cards
// truly start beyond the frame regardless of their size.
// Units are required on BOTH axes: a unitless "0" would make the composed
// translate3d() invalid and drop the whole transform.
const ENTRY_VECTORS = [
  { x: "0vw", y: "-115vh" }, // top
  { x: "115vw", y: "0vh" }, // right
  { x: "0vw", y: "115vh" }, // bottom
  { x: "-115vw", y: "0vh" }, // left
  { x: "95vw", y: "-95vh" }, // top-right
  { x: "-95vw", y: "95vh" }, // bottom-left
  { x: "95vw", y: "95vh" }, // bottom-right
  { x: "-95vw", y: "-95vh" }, // top-left
];

const CUE_ICON = /* html */ `
  <svg class="portal-intro__cue-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 8l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M5 14l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
  </svg>`;

// RoleModel-voice hero copy. Lives inline here for now — the only natural
// content-system home (UI_STRINGS in site-content.js) is a GENERATED file, so
// it can't be hand-edited. Move it into the content pipeline (docs/content/**)
// when convenient. Line breaks are layout only; the text content is exact.
const HERO_HEADING = [
  "At RoleModel, our brand guidelines",
  "help us craft an identity",
  "as intentional as the software we build.",
].join(" ");

const heroMarkup = (brand) => /* html */ `
  <div class="portal-intro__grid"></div>
  <div class="portal-intro__inner">
    <h1 class="portal-intro__heading">${HERO_HEADING}</h1>
    <span class="portal-intro__mark">
      <img class="portal-intro__mark-img" src="${brand.icon}" alt="" />
    </span>
    <span class="portal-intro__cue" aria-hidden="true">${CUE_ICON}</span>
  </div>`;

/**
 * Wire up and run the scroll-driven intro. Self-manages listeners and tears
 * everything down on completion. Assumes cards are already built into `grid`.
 * @param {object} opts
 * @param {HTMLElement} opts.grid  the .portal-grid element
 * @param {HTMLElement[]} opts.cards  ordered <brand-card> list to stagger
 * @param {{name:string, icon:string, primary?:string}} opts.brand  active brand
 */
export const setupIntro = ({ grid, cards, brand }) => {
  const root = document.documentElement;

  // Ensure the hero is what loads first, even when the browser tries to
  // restore a prior scroll position on refresh.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  root.style.setProperty(ENTER_PROP, "0");
  root.style.setProperty(ACCENT_PROP, brand.primary || "var(--page-accent)");

  // Assign each card a vector + a staggered progress window. The windows are
  // spread so the last card lands by SETTLE_BY, with overlap for a flowing
  // (not strictly one-at-a-time) assembly.
  const spread = cards.length > 1 ? SETTLE_BY - CARD_SPAN : 0;
  for (const [i, card] of cards.entries()) {
    const vector = ENTRY_VECTORS[i % ENTRY_VECTORS.length];
    const start = cards.length > 1 ? (spread * i) / (cards.length - 1) : 0;
    card.style.setProperty("--enter-x", vector.x);
    card.style.setProperty("--enter-y", vector.y);
    card.style.setProperty("--enter-start", start.toFixed(3));
    card.style.setProperty(
      "--enter-end",
      Math.min(start + CARD_SPAN, 1).toFixed(3)
    );
  }

  const hero = document.createElement("div");
  hero.className = "portal-intro";
  hero.setAttribute("aria-hidden", "true");
  hero.setHTMLUnsafe(heroMarkup(brand));

  const spacer = document.createElement("div");
  spacer.className = "portal-intro-spacer";
  spacer.setAttribute("aria-hidden", "true");

  // Hero behind the pinned grid; spacer after it is the scroll runway.
  grid.before(hero);
  grid.after(spacer);
  root.classList.add("is-introing");

  let done = false;
  let ticking = false;

  const finalize = () => {
    if (done) {
      return;
    }
    done = true;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);

    root.classList.remove("is-introing");
    root.style.removeProperty(ENTER_PROP);
    for (const card of cards) {
      for (const prop of CARD_VARS) {
        card.style.removeProperty(prop);
      }
    }
    hero.remove();
    spacer.remove();
    // Grid is no longer pinned; land at the top as the normal portal.
    window.scrollTo(0, 0);
  };

  const update = () => {
    ticking = false;
    if (done) {
      return;
    }
    const max = root.scrollHeight - window.innerHeight;
    const raw = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    root.style.setProperty(ENTER_PROP, raw.toFixed(4));
    if (raw >= FINALIZE_AT) {
      finalize();
    }
  };

  // rAF-throttled: one style write per frame no matter how many scroll events.
  const onScroll = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  // Prime --enter for the initial (top) position.
  requestAnimationFrame(update);
};
