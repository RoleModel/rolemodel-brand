/* -----------------------------------------------------------------------
   One-page orchestrator.

   Renders every guideline section on a single scrolling document:

     sticky header — title, persistent brand switcher, section nav
     landing bento — the SAME <brand-card> grid as the portal homepage;
                     brand cards switch the active brand in place, and
                     category cards anchor-scroll to their section
     sections      — one stacked iframe per category page, auto-sized via
                     "rm-section-height" postMessage (see page-utils.js)

   Navigation is pure anchor scrolling (#slug); a scrollspy keeps the nav
   highlighted. Switching brand reloads each section iframe in place with
   the new ?brand= param — scroll position and active section are kept
   because the iframes hold their last height until the new one arrives.
   ----------------------------------------------------------------------- */

import { BRAND_ORDER, BRANDS, CATEGORIES } from "./modules/brand-data.js";
import { initIconAnimations } from "./modules/icon-animations.js";
import { renderIcon } from "./modules/icons.js";
import { setupIntro } from "./modules/intro.js";
import { readableTextColor } from "./modules/page-utils.js";
import "./components/brand-card.js";

const STORAGE_KEY = "brandGuide.activeBrand";
const DEFAULT_BRAND = "rolemodel";

// Short labels so all eight sections fit the header nav on one row.
const NAV_LABELS = {
  "visual-style": "Visual Style",
  voice: "Voice",
};

const navLabel = (category) => NAV_LABELS[category.slug] || category.name;

// ?brand= from the host wins; otherwise force the default, matching the
// portal's behavior so the embed never opens on a stale brand.
const seedBrand = () => {
  const fromUrl = new URLSearchParams(window.location.search).get("brand");
  const slug = fromUrl && BRANDS[fromUrl] ? fromUrl : DEFAULT_BRAND;
  localStorage.setItem(STORAGE_KEY, slug);
  return slug;
};

const pageUrlFor = (categorySlug, brandSlug) =>
  `./pages/${categorySlug}.html?brand=${brandSlug}&embed=1&stack=1`;

// Same category icon treatment as the portal homepage (main.js).
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

class OnePage {
  constructor(root) {
    this.root = root;
    this.activeBrand = seedBrand();
    this.cards = new Map();
    this.frames = new Map();
    this.navLinks = new Map();

    this.build();
    this.buildGrid();
    this.wireHeightMessages();
    this.wireScrollspy();
    this.wireBackToTop();
    this.paintBrand();
    this.playIntro();
    OnePage.restoreFromHash();
  }

  // ---- First-load intro -----------------------------------------------------
  // Same scroll-driven bento assembly as the portal (modules/intro.js +
  // css/intro.css). Skipped when a section is deep-linked (the reader asked
  // for content, not theater) and under prefers-reduced-motion. The sticky
  // header hides while .is-introing is set and slides in when it clears
  // (see one-page.css).
  playIntro() {
    const hash = window.location.hash.replace("#", "");
    const deepLinked = CATEGORIES.some((c) => c.slug === hash);
    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (deepLinked || reducedMotion) {
      return;
    }
    setupIntro({
      brand: BRANDS[this.activeBrand],
      cards: [...this.cards.values()],
      grid: this.root.querySelector("#op-grid"),
    });
  }

  build() {
    const switcherPills = BRAND_ORDER.map(
      (slug) => `
        <button
          class="op-switcher__pill${slug === this.activeBrand ? " op-switcher__pill--active" : ""}"
          data-brand="${slug}"
          type="button"
        >${BRANDS[slug].name}</button>`
    ).join("");

    const navLinks = CATEGORIES.map(
      (c) => `
        <a class="op-nav__link" href="#${c.slug}" data-section="${c.slug}">${navLabel(c)}</a>`
    ).join("");

    const sections = CATEGORIES.map(
      (c) => `
        <section class="op-section" id="${c.slug}" aria-label="${c.name} guidelines">
          <iframe
            class="op-section__frame"
            data-slug="${c.slug}"
            loading="lazy"
            referrerpolicy="no-referrer"
            scrolling="no"
            src="${pageUrlFor(c.slug, this.activeBrand)}"
            title="${c.name} guidelines"
          ></iframe>
        </section>`
    ).join("");

    this.root.setHTMLUnsafe(`
      <header class="op-header">
        <span class="op-header__title">Brand Guidelines</span>
        <div class="op-switcher" role="navigation" aria-label="Switch brand">
          ${switcherPills}
        </div>
        <nav class="op-nav" aria-label="Sections">${navLinks}</nav>
      </header>

      <div class="portal-grid op-grid" id="op-grid"></div>

      ${sections}

      <button class="op-top" id="op-top" type="button" aria-label="Back to top">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 9L7 4L12 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `);

    for (const frame of this.root.querySelectorAll(".op-section__frame")) {
      this.frames.set(frame.dataset.slug, frame);
    }
    for (const link of this.root.querySelectorAll(".op-nav__link")) {
      this.navLinks.set(link.dataset.section, link);
    }

    this.root.querySelector(".op-switcher").addEventListener("click", (e) => {
      const pill = e.target.closest(".op-switcher__pill");
      if (pill && pill.dataset.brand !== this.activeBrand) {
        this.applyBrand(pill.dataset.brand);
      }
    });
  }

  // ---- landing bento — the existing <brand-card> grid ----------------------

  buildGrid() {
    const grid = this.root.querySelector("#op-grid");
    const active = BRANDS[this.activeBrand];

    for (const slug of BRAND_ORDER) {
      const brand = BRANDS[slug];
      const card = document.createElement("brand-card");
      card.setAttribute("kind", "brand");
      card.setAttribute("slug", slug);
      card.setAttribute("label", brand.name);
      card.setAttribute("bg", brand.heroColor);
      card.setAttribute("icon-src", brand.icon);
      card.setAttribute("span", "2");
      card.classList.toggle("brand-card--active", slug === this.activeBrand);
      this.cards.set(`brand:${slug}`, card);
      grid.append(card);
    }

    for (const [index, category] of CATEGORIES.entries()) {
      const bg = active.palette[index % active.palette.length];
      const card = document.createElement("brand-card");
      card.setAttribute("kind", "category");
      card.setAttribute("slug", category.slug);
      card.setAttribute("label", category.name);
      card.setAttribute("bg", bg);
      card.setAttribute("span", String(category.span));
      this.cards.set(`category:${category.slug}`, card);
      grid.append(card);

      const { iconHost } = card;
      if (iconHost) {
        iconHost.setHTMLUnsafe(iconMarkupFor(category.slug, active));
        initIconAnimations(iconHost, category.slug);
      }
    }

    grid.addEventListener("card-select", (e) => {
      const { slug, kind } = e.detail;
      if (kind === "brand") {
        if (slug !== this.activeBrand) {
          this.applyBrand(slug);
        }
        return;
      }
      document.querySelector(`#${slug}`)?.scrollIntoView();
      this.setActiveSection(slug);
    });
  }

  // ---- brand switching ------------------------------------------------------

  applyBrand(slug) {
    this.activeBrand = slug;
    localStorage.setItem(STORAGE_KEY, slug);

    const url = new URL(window.location.href);
    url.searchParams.set("brand", slug);
    history.replaceState(null, "", url);

    // Reload sections in place — each iframe keeps its last height until the
    // new page reports in, so the document doesn't collapse mid-switch.
    for (const [sectionSlug, frame] of this.frames) {
      frame.src = pageUrlFor(sectionSlug, slug);
    }

    this.paintBrand();
  }

  // Sync header, bento cards, and document chrome to the active brand —
  // the card recolor mirrors the portal's applyBrand (main.js).
  paintBrand() {
    const brand = BRANDS[this.activeBrand];
    document.documentElement.style.setProperty("--font-active", brand.font);
    // Active switcher pill wears the brand primary (see one-page.css);
    // derive its text color so contrast holds for every brand.
    document.documentElement.style.setProperty("--page-accent", brand.primary);
    document.documentElement.style.setProperty(
      "--page-accent-ink",
      readableTextColor(brand.primary)
    );
    document.title = `${brand.name} — Brand Guidelines`;

    for (const pill of this.root.querySelectorAll(".op-switcher__pill")) {
      pill.classList.toggle(
        "op-switcher__pill--active",
        pill.dataset.brand === this.activeBrand
      );
    }

    for (const slug of BRAND_ORDER) {
      const card = this.cards.get(`brand:${slug}`);
      card?.classList.toggle("brand-card--active", slug === this.activeBrand);
    }

    for (const [index, category] of CATEGORIES.entries()) {
      const card = this.cards.get(`category:${category.slug}`);
      if (!card) {
        continue;
      }
      card.setAttribute("bg", brand.palette[index % brand.palette.length]);

      if (category.slug === "logo") {
        const img = card.iconHost?.querySelector("img");
        if (img) {
          img.src = brand.icon;
          img.alt = `${brand.name} icon`;
        }
      }
      if (category.slug === "typography") {
        const glyph = card.iconHost?.querySelector(".brand-card__glyph");
        if (glyph) {
          glyph.style.fontFamily = brand.font;
        }
      }
    }
  }

  // ---- section height sync ----------------------------------------------------

  wireHeightMessages() {
    window.addEventListener("message", (e) => {
      const { data } = e;
      if (!data || data.type !== "rm-section-height") {
        return;
      }
      const frame = this.frames.get(data.slug);
      if (frame && e.source === frame.contentWindow && data.height > 0) {
        frame.style.height = `${data.height}px`;
      }
    });
  }

  // ---- scrollspy ----------------------------------------------------------------

  wireScrollspy() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.setActiveSection(entry.target.id);
          }
        }
      },
      // A thin horizontal band ~1/3 down the viewport: whichever section
      // crosses it is "current".
      { rootMargin: "-30% 0px -65% 0px" }
    );
    for (const section of this.root.querySelectorAll(".op-section")) {
      observer.observe(section);
    }
  }

  setActiveSection(slug) {
    for (const [linkSlug, link] of this.navLinks) {
      link.classList.toggle("op-nav__link--active", linkSlug === slug);
    }
    const active = this.navLinks.get(slug);
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // Sections settle their heights on load, firing the observer while the
    // reader is still on the bento — don't rewrite the URL until they have
    // actually scrolled into the document.
    if (slug && window.scrollY > 200) {
      history.replaceState(null, "", `#${slug}`);
    }
  }

  // ---- back to top ------------------------------------------------------------

  wireBackToTop() {
    const btn = this.root.querySelector("#op-top");
    btn.addEventListener("click", () => {
      window.scrollTo({ behavior: "smooth", top: 0 });
      this.setActiveSection(null);
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    });
    window.addEventListener(
      "scroll",
      () => {
        btn.classList.toggle(
          "op-top--visible",
          window.scrollY > window.innerHeight * 0.8
        );
      },
      { passive: true }
    );
  }

  // ---- deep-linking -----------------------------------------------------------

  static restoreFromHash() {
    const slug = window.location.hash.replace("#", "");
    if (!CATEGORIES.some((c) => c.slug === slug)) {
      return;
    }
    // Sections above the target are still settling to their real heights on
    // load, so re-anchor once after the first round of height reports.
    requestAnimationFrame(() => {
      document.querySelector(`#${slug}`)?.scrollIntoView();
      setTimeout(() => {
        document.querySelector(`#${slug}`)?.scrollIntoView();
      }, 700);
    });
  }
}

const root = document.querySelector("#one-page-root");
if (root) {
  root.onePage = new OnePage(root);
}
