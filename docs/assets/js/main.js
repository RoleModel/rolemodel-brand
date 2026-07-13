/* -----------------------------------------------------------------------
   Homepage orchestrator.

   Assembles <brand-card> web components into the bento grid and animates
   between two layouts with the View Transitions API (no GSAP Flip):

     grid mode — classic bento of brand + category cards
     open mode — the SAME grid reflows: every card shrinks into a row of
                 nav pills across the top and one content panel (iframe)
                 fills the rest of the viewport.

   There is no separate rail element — the cards never leave .portal-grid,
   they just change state/order, and the grid's open-mode CSS lays them out
   as [ active brand ] [ category pills… ] on row 1 with the panel below.
   The other brands are hidden until you click the active brand pill, which
   reveals them (click again to collapse). Clicking the open category's own
   pill closes the section and the full grid returns.

   Every card keeps a stable view-transition-name, so the browser morphs
   each one from its grid tile to its nav pill (and back) automatically.
   ----------------------------------------------------------------------- */

import { BRANDS, BRAND_ORDER, CATEGORIES } from "./modules/brand-data.js";
import { initIconAnimations } from "./modules/icon-animations.js";
import { renderIcon } from "./modules/icons.js";
import { ENTRY_VECTORS, setupIntro } from "./modules/intro.js";
import "./components/brand-card.js";

const STORAGE_KEY = "brandGuide.activeBrand";

const EXIT_STAGGER_MS = 28;

const getActiveBrandSlug = () =>
  localStorage.getItem(STORAGE_KEY) || "rolemodel";
const setActiveBrandSlug = (slug) => localStorage.setItem(STORAGE_KEY, slug);

const DEFAULT_BRAND = "rolemodel";

// The active brand on load is authoritative and always reset here: a ?brand=
// from the host (Framer) wins, otherwise we force rolemodel. This deliberately
// OVERWRITES whatever a previous session left in localStorage, so the embed can
// never open on a stale brand (e.g. a visitor's last-clicked LightningCAD). In-
// session switching still writes localStorage and drives the live UI — only the
// initial load is forced.
const seedActiveBrand = () => {
  const fromUrl = new URLSearchParams(window.location.search).get("brand");
  const target = fromUrl && BRANDS[fromUrl] ? fromUrl : DEFAULT_BRAND;
  setActiveBrandSlug(target);
};

const prefersReducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Valid CSS ident for view-transition-name (slugs may contain hyphens).
const vtName = (kind, slug) => `vt_${kind}_${slug.replaceAll("-", "_")}`;

const iconMarkupFor = (categorySlug, activeBrand) => {
  if (categorySlug === "logo") {
    /* html */
    return `<span class="brand-card__logo"><img class="brand-card__logo-img" src="${activeBrand.icon}" alt="${activeBrand.name} icon" style="width:100%;height:100%;object-fit:contain;" /></span>`;
  }
  if (categorySlug === "typography") {
    /* html */
    return `<span class="brand-card__glyph" style="font-family:${activeBrand.font};">Aa</span>`;
  }
  return renderIcon(categorySlug);
};

const pageUrlFor = (categorySlug, brandSlug) =>
  `./pages/${categorySlug}.html?brand=${brandSlug}&embed=1`;

class BrandPortal {
  constructor(grid) {
    this.grid = grid;
    // open category slug, or null in grid mode
    this.openSlug = null;
    // "kind:slug" -> <brand-card>
    this.cards = new Map();
    this.brandOrder = BRAND_ORDER;

    seedActiveBrand();
    this.build();
    this.wireEvents();
    this.restoreFromHash();
    this.playIntro();
  }

  // ---- First-load intro ---------------------------------------------------
  // Scroll-driven "assembly": the page opens on a hero and the bento cards fly
  // in from off-screen as you scroll, settling into their slots (see
  // modules/intro.js + css/intro.css). Skipped — grid assembled and instantly
  // interactive, no scroll gate — when a section is deep-linked open on load
  // and under prefers-reduced-motion.
  playIntro() {
    if (this.openSlug || prefersReducedMotion()) {
      return;
    }
    setupIntro({
      brand: BRANDS[getActiveBrandSlug()],
      cards: this.allCards(),
      grid: this.grid,
    });
  }

  brandCards() {
    return this.brandOrder.map((s) => this.cards.get(`brand:${s}`));
  }
  categoryCards() {
    return CATEGORIES.map((c) => this.cards.get(`category:${c.slug}`));
  }
  allCards() {
    return [...this.brandCards(), ...this.categoryCards()];
  }

  // ---- assembly ---------------------------------------------------------

  build() {
    const activeSlug = getActiveBrandSlug();
    const active = BRANDS[activeSlug];
    document.documentElement.style.setProperty("--font-active", active.font);

    for (const [index, slug] of this.brandOrder.entries()) {
      const brand = BRANDS[slug];
      const card = document.createElement("brand-card");
      card.setAttribute("kind", "brand");
      card.setAttribute("slug", slug);
      card.setAttribute("label", brand.name);
      card.setAttribute("bg", brand.heroColor);
      card.setAttribute("icon-src", brand.icon);
      card.setAttribute("span", "2");
      card.dataset.index = index;
      card.style.viewTransitionName = vtName("brand", slug);
      card.classList.toggle("brand-card--active", slug === activeSlug);
      this.cards.set(`brand:${slug}`, card);
      this.grid.append(card);
    }

    for (const [index, category] of CATEGORIES.entries()) {
      const bg = active.palette[index % active.palette.length];
      const card = document.createElement("brand-card");
      card.setAttribute("kind", "category");
      card.setAttribute("slug", category.slug);
      card.setAttribute("label", category.name);
      card.setAttribute("bg", bg);
      card.setAttribute("span", String(category.span));
      card.dataset.index = this.brandOrder.length + index;
      card.style.viewTransitionName = vtName("category", category.slug);
      this.cards.set(`category:${category.slug}`, card);
      this.grid.append(card);

      const { iconHost } = card;
      if (iconHost) {
        iconHost.setHTMLUnsafe(iconMarkupFor(category.slug, active));
        initIconAnimations(iconHost, category.slug);
      }
    }

    for (const [i, card] of this.allCards().entries()) {
      const v = ENTRY_VECTORS[i % ENTRY_VECTORS.length];
      card.style.setProperty("--exit-x", v.x);
      card.style.setProperty("--exit-y", v.y);
      card.style.setProperty("--exit-delay", `${i * EXIT_STAGGER_MS}ms`);
    }

    // The ONE place page content ever renders — a single shared panel.
    // It's a direct child of the grid, like the cards.
    this.panel = document.createElement("div");
    this.panel.className = "portal-panel";
    this.panel.style.viewTransitionName = "vt_panel";
    this.frame = document.createElement("iframe");
    this.frame.className = "portal-panel__frame";
    this.frame.setAttribute("title", "Guideline section");
    this.frame.setAttribute("loading", "eager");
    this.frame.setAttribute("referrerpolicy", "no-referrer");
    this.closeBtn = document.createElement("button");
    this.closeBtn.type = "button";
    this.closeBtn.className = "portal-panel__close";
    this.closeBtn.setAttribute("aria-label", "Close and return to grid");
    /* html */
    this.closeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>`;
    this.closeBtn.addEventListener("click", () => this.closeSection());
    this.panel.append(this.frame, this.closeBtn);
    this.grid.append(this.panel);
  }

  wireEvents() {
    this.grid.addEventListener("card-select", (e) => {
      const { slug, kind } = e.detail;
      if (kind === "brand") {
        this.onBrandSelect(slug);
      } else {
        this.onCategorySelect(slug);
      }
    });

    window.addEventListener("hashchange", () => this.restoreFromHash());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.openSlug) {
        this.closeSection();
      }
    });
  }

  // ---- interactions -----------------------------------------------------

  onCategorySelect(slug) {
    if (this.openSlug === slug) {
      this.closeSection();
    } else if (this.openSlug) {
      this.swapSection(slug);
    } else {
      this.openSection(slug);
    }
  }

  onBrandSelect(slug) {
    if (slug !== getActiveBrandSlug()) {
      this.applyBrand(slug);
    }
  }

  // ---- open / close / swap ----------------------------------------------

  // Opening flies every bento card off-screen along its own vector (set in
  // build()) while a full-screen content panel fades in — pure CSS transforms
  // driven by .portal-grid--section-open, no View Transitions API.
  openSection(slug, animate = true) {
    const card = this.cards.get(`category:${slug}`);
    if (!card) {
      return;
    }

    this.openSlug = slug;
    this.frame.src = pageUrlFor(slug, getActiveBrandSlug());

    if (animate) {
      this.grid.classList.add("portal-grid--section-open");
    } else {
      this.grid.classList.add(
        "portal-grid--no-anim",
        "portal-grid--section-open"
      );
      requestAnimationFrame(() => {
        this.grid.classList.remove("portal-grid--no-anim");
      });
    }

    BrandPortal.setHash(slug);
  }

  swapSection(slug) {
    const next = this.cards.get(`category:${slug}`);
    if (!next) {
      return;
    }
    this.openSlug = slug;
    this.frame.src = pageUrlFor(slug, getActiveBrandSlug());
    BrandPortal.setHash(slug);
  }

  closeSection() {
    this.openSlug = null;
    this.grid.classList.remove("portal-grid--section-open");
    // Blank the iframe only after the fade-out finishes, so it doesn't flash.
    setTimeout(() => {
      if (!this.openSlug) {
        this.frame.src = "about:blank";
      }
    }, 650);
    BrandPortal.setHash(null);
  }

  // ---- brand switching ---------------------------------------------------

  applyBrand(slug) {
    setActiveBrandSlug(slug);
    const brand = BRANDS[slug];
    document.documentElement.style.setProperty("--font-active", brand.font);

    for (const c of this.brandCards()) {
      c.classList.toggle("brand-card--active", c.slug === slug);
    }

    for (const [index, category] of CATEGORIES.entries()) {
      const card = this.cards.get(`category:${category.slug}`);
      if (!card) {
        continue;
      }
      const bg = brand.palette[index % brand.palette.length];
      card.setAttribute("bg", bg);

      if (category.slug === "logo") {
        BrandPortal.swapLogoIcon(card, brand);
      }
      if (category.slug === "typography") {
        const glyph = card.iconHost?.querySelector(".brand-card__glyph");
        if (glyph) {
          glyph.style.fontFamily = brand.font;
        }
      }
    }

    if (this.openSlug) {
      this.frame.src = pageUrlFor(this.openSlug, slug);
    }
  }

  static swapLogoIcon(card, brand) {
    const img = card.iconHost?.querySelector("img");
    if (!img) {
      return;
    }
    img.src = brand.icon;
    img.alt = `${brand.name} icon`;
  }

  // ---- deep-linking ------------------------------------------------------

  static setHash(slug) {
    const url = slug ? `#${slug}` : window.location.pathname;
    history.replaceState(null, "", url);
  }

  restoreFromHash() {
    const slug = window.location.hash.replace("#", "");
    const isCategory = CATEGORIES.some((c) => c.slug === slug);
    if (isCategory && slug !== this.openSlug) {
      this.openSection(slug, this.openSlug !== null);
    } else if (!isCategory && this.openSlug) {
      this.closeSection();
    }
  }
}

const grid = document.querySelector(".portal-grid");
if (grid) {
  grid.portal = new BrandPortal(grid);
}
