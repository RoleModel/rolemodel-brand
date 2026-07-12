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
import { staggerReveal } from "./modules/page-utils.js";
import "./components/brand-card.js";

const INTRO_STAGGER_STEP_MS = 45;

const STORAGE_KEY = "brandGuide.activeBrand";

const getActiveBrandSlug = () =>
  localStorage.getItem(STORAGE_KEY) || "rolemodel";
const setActiveBrandSlug = (slug) => localStorage.setItem(STORAGE_KEY, slug);

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
    // are the non-active brand pills revealed?
    this.brandsExpanded = false;
    // "kind:slug" -> <brand-card>
    this.cards = new Map();
    this.brandOrder = BRAND_ORDER;

    this.build();
    this.wireEvents();
    this.restoreFromHash();
    this.playIntro();
  }

  // ---- First-load intro ---------------------------------------------------
  // The bento settles into place: each card scales down from slightly oversized
  // to its final size, staggered across the grid (same staggerReveal() helper
  // the other pages use for their scroll-in reveals). Skipped when a section
  // is deep-linked open, and under reduced-motion.
  playIntro() {
    if (this.openSlug || prefersReducedMotion()) {
      return;
    }
    const cards = this.allCards();
    staggerReveal(cards, 0, INTRO_STAGGER_STEP_MS);
    for (const card of cards) {
      card.style.setProperty("--intro-delay", `${card.dataset.delay}ms`);
    }

    // Drop the class once every card's own card-intro animation has
    // finished, instead of guessing the total duration from a timer.
    let finished = 0;
    const onAnimationEnd = (e) => {
      if (e.animationName !== "card-intro") {
        return;
      }
      finished += 1;
      if (finished >= cards.length) {
        this.grid.removeEventListener("animationend", onAnimationEnd);
        this.grid.classList.remove("portal-grid--intro");
      }
    };
    this.grid.addEventListener("animationend", onAnimationEnd);
    this.grid.classList.add("portal-grid--intro");
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

    // The ONE place page content ever renders — a single shared panel.
    // It's a direct child of the grid, like the cards.
    this.panel = document.createElement("div");
    this.panel.className = "portal-panel";
    this.panel.hidden = true;
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

  // ---- View Transitions wrapper -----------------------------------------

  static transition(mutate) {
    if (!document.startViewTransition || prefersReducedMotion()) {
      mutate();
      return;
    }
    document.startViewTransition(() => mutate());
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
    // Grid mode: a brand tile just swaps colors/content in place — no card
    // moves or resizes, so this skips the View Transition wrapper entirely.
    // Wrapping a same-layout change in startViewTransition() still makes the
    // browser snapshot and crossfade every named card whose content differs
    // (a full-card fade), which is worse than the plain CSS
    // background-color/color transition already on .brand-card.
    if (!this.openSlug) {
      if (slug !== getActiveBrandSlug()) {
        this.applyBrand(slug);
      }
      return;
    }
    // Open mode: the active brand pill toggles the other brands; a revealed
    // brand pill switches to it (and collapses the group).
    if (slug === getActiveBrandSlug()) {
      this.toggleBrands(!this.brandsExpanded);
    } else {
      BrandPortal.transition(() => {
        this.applyBrand(slug);
        this.brandsExpanded = false;
        this.grid.classList.remove("portal-grid--brands-open");
        this.applyOpenLayout();
      });
    }
  }

  // ---- open / close / swap ----------------------------------------------

  // Exactly one of {a category's card, the panel} owns that category's
  // view-transition-name at a time. Handing it to the panel when a section
  // opens lets the browser morph the clicked tile's box straight into the
  // panel's box — the card visibly grows to contain its content, instead of
  // the tile and the panel animating as two unrelated elements.
  assignPanelIdentity(slug) {
    const card = this.cards.get(`category:${slug}`);
    this.panel.style.viewTransitionName = card.style.viewTransitionName;
    card.style.viewTransitionName = "";
  }

  assignCardIdentity(slug) {
    this.cards.get(`category:${slug}`).style.viewTransitionName = vtName(
      "category",
      slug
    );
  }

  openSection(slug, animate = true) {
    const card = this.cards.get(`category:${slug}`);
    if (!card) {
      return;
    }

    const mutate = () => {
      this.openSlug = slug;
      this.brandsExpanded = false;
      this.assignPanelIdentity(slug);
      this.grid.classList.add("portal-grid--open");
      this.grid.classList.remove("portal-grid--brands-open");
      this.panel.hidden = false;
      this.frame.src = pageUrlFor(slug, getActiveBrandSlug());
      this.applyOpenLayout();
    };

    if (animate) {
      BrandPortal.transition(mutate);
    } else {
      mutate();
    }
    BrandPortal.setHash(slug);
  }

  swapSection(slug) {
    const next = this.cards.get(`category:${slug}`);
    if (!next) {
      return;
    }
    BrandPortal.transition(() => {
      this.assignCardIdentity(this.openSlug);
      this.openSlug = slug;
      this.assignPanelIdentity(slug);
      this.frame.src = pageUrlFor(slug, getActiveBrandSlug());
      this.markCurrent();
    });
    BrandPortal.setHash(slug);
  }

  closeSection() {
    const mutate = () => {
      this.assignCardIdentity(this.openSlug);
      this.grid.classList.remove(
        "portal-grid--open",
        "portal-grid--brands-open"
      );
      this.brandsExpanded = false;
      this.openSlug = null;
      for (const c of this.allCards()) {
        c.setState("grid");
        c.classList.remove(
          "brand-card--current",
          "brand-card--brand-alt",
          "brand-card--nav-active"
        );
      }
      this.panel.hidden = true;
      this.frame.src = "about:blank";
    };
    BrandPortal.transition(mutate);
    BrandPortal.setHash(null);
  }

  toggleBrands(open) {
    BrandPortal.transition(() => {
      this.brandsExpanded = open;
      this.grid.classList.toggle("portal-grid--brands-open", open);
    });
  }

  // ---- open-mode layout (cards stay in the grid; classes drive layout) ---

  /* In open mode each card becomes a mini pill and gets an ordering class:
     active brand first, other brands next (hidden until expanded), then the
     category pills. No DOM moves — CSS order + the grid's open-mode rules
     do the arranging, so the whole grid morphs as one. */
  applyOpenLayout() {
    const activeSlug = getActiveBrandSlug();

    for (const c of this.brandCards()) {
      c.setState("mini");
      const isActive = c.slug === activeSlug;
      c.classList.toggle("brand-card--nav-active", isActive);
      c.classList.toggle("brand-card--brand-alt", !isActive);
    }

    for (const c of this.categoryCards()) {
      c.setState("mini");
    }

    this.markCurrent();
  }

  markCurrent() {
    for (const c of this.categoryCards()) {
      c.classList.toggle("brand-card--current", c.slug === this.openSlug);
    }
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
