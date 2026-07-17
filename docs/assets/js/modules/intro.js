/* -----------------------------------------------------------------------
   Scroll-driven bento intro (Dropbox-style assembly).

   The homepage loads as a near-empty hero (faint grid backdrop + a big
   brand-colored heading + brand mark + a scroll cue). A tall spacer below a
   pinned bento supplies scroll distance; this module maps scroll progress to
   a global --enter (0 → 1) on <html>, and intro.css flies every <brand-card>
   in from a per-card off-screen vector into its slot, staggered.

   The runway stays in the document so the sequence is reversible. Scrolling
   down assembles the cards; scrolling back up drives the same progress value
   toward zero and restores the headline while the cards leave in reverse.

   Callers skip it entirely (never call setupIntro) on deep-link opens and
   under prefers-reduced-motion — see main.js.
   ----------------------------------------------------------------------- */

import { clamp } from "./page-utils.js?v=0271783e";
import { INTRO_HEADING } from "./site-content.js?v=0271783e";

const ENTER_PROP = "--enter";
const ACCENT_PROP = "--intro-accent";
// Treat the last fraction as settled so the completed grid becomes interactive
// and the one-page document can continue into its guideline sections.
const SETTLED_AT = 0.999;
// Progress by which the last card should be home (leaves a short dwell).
const SETTLE_BY = 0.82;
// Each card's own entry duration, in global-progress units (windows overlap).
const CARD_SPAN = 0.5;

// Distinct off-screen entry vectors, cycled per card so the bento assembles
// from every edge rather than fading in uniformly. Viewport-relative so cards
// truly start beyond the frame regardless of their size.
// Units are required on BOTH axes: a unitless "0" would make the composed
// translate3d() invalid and drop the whole transform.
export const ENTRY_VECTORS = [
  // top
  { x: "0vw", y: "-115vh" },
  // right
  { x: "115vw", y: "0vh" },
  // bottom
  { x: "0vw", y: "115vh" },
  // left
  { x: "-115vw", y: "0vh" },
  // top-right
  { x: "95vw", y: "-95vh" },
  // bottom-left
  { x: "-95vw", y: "95vh" },
  // bottom-right
  { x: "95vw", y: "95vh" },
  // top-left
  { x: "-95vw", y: "-95vh" },
];

/* html */
const CUE_ICON = `
  <svg class="portal-intro__cue-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 8l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M5 14l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
  </svg>`;

/* html */
const heroMarkup = (brand) => `
  <div class="portal-intro__grid"></div>
  <div class="portal-intro__inner">
    <h1 class="portal-intro__heading">${INTRO_HEADING}</h1>
    <span class="portal-intro__mark">
      <img class="portal-intro__mark-img" src="${brand.icon}" alt="" />
    </span>
    <span class="portal-intro__cue" aria-hidden="true">${CUE_ICON}</span>
  </div>`;

/**
 * Wire up the reversible scroll-driven intro. Assumes cards are already built
 * into `grid`.
 * @param {object} opts  Intro configuration.
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

  const stage = document.createElement("div");
  stage.className = "portal-intro-stage";

  // Keep the sticky grid and its runway in one containing block. The stage
  // naturally carries the assembled grid out of view at its lower edge and
  // brings it back on upward scroll, avoiding a static/sticky mode flash.
  grid.before(hero);
  grid.before(stage);
  stage.append(grid, spacer);
  root.classList.add("is-introing");

  let ticking = false;

  const update = () => {
    ticking = false;
    // Progress is measured against the intro's own runway (everything up to
    // the spacer's bottom edge), NOT the full document height — on the
    // single-page layout thousands of pixels of sections live below the
    // spacer. On the plain portal the spacer is the last element, so this
    // is equivalent to the old scrollHeight math.
    const runwayBottom = window.scrollY + spacer.getBoundingClientRect().bottom;
    const max = runwayBottom - window.innerHeight;
    const raw = max > 0 ? clamp(window.scrollY / max, 0, 1) : 1;
    root.style.setProperty(ENTER_PROP, raw.toFixed(4));
    root.classList.toggle("is-intro-interactive", raw >= SETTLE_BY);
    root.classList.toggle("is-intro-settled", raw >= SETTLED_AT);
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
