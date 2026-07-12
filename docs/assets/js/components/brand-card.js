/* -----------------------------------------------------------------------
   <brand-card> — a two-state card web component.

   States (reflected as .brand-card--{state} modifiers, styled in
   css/brand-card.css):
     grid — normal bento tile on the homepage (icon, title)
     mini — compact pill in the nav rail while a section is open

   A card never owns page content or moves in/out of a "drawer" — the
   homepage orchestrator (main.js) owns a single shared content panel and
   just toggles a `.brand-card--current` class on whichever mini pill
   matches the open section. That keeps every pill permanently visible and
   in one place, so "click it again to close" always works.

   Attributes (the "variables" each card accepts):
     kind         brand | category
     slug         brand or category slug
     label        display title
     bg           background color (drives --card-bg; text color is derived
                  in CSS via contrast-color(), so no text-color is passed in)
     span         grid column span in grid state
     icon-src     brand mark image URL (brand cards)

   The card renders in light DOM on purpose: the shared BEM stylesheet and
   the GSAP icon timelines (icon-animations.js) need direct access to the
   elements. Orchestration (Flip shuffle, routing) lives in main.js — the
   component only owns its own two-state markup.
   ----------------------------------------------------------------------- */

const CARD_STATES = ["grid", "mini"];

export class BrandCard extends HTMLElement {
  static get observedAttributes() {
    return ["bg", "label", "icon-src", "state", "span", "kind"];
  }

  connectedCallback() {
    if (this._built) {
      this._sync();
      return;
    }
    this._built = true;
    if (!this.hasAttribute("state")) {
      this.setAttribute("state", "grid");
    }
    this._build();
    this._sync();
  }

  attributeChangedCallback() {
    if (this._built) {
      this._sync();
    }
  }

  // ---- public API ------------------------------------------------------

  get slug() {
    return this.getAttribute("slug");
  }
  get kind() {
    return this.getAttribute("kind") || "category";
  }
  get state() {
    return this.getAttribute("state") || "grid";
  }

  setState(next) {
    if (next === this.state) {
      return;
    }
    this.setAttribute("state", next);
  }

  /* Host element for the animated category icon — main.js fills this via
     icons.js/icon-animations.js so the GSAP timelines are wired exactly once. */
  get iconHost() {
    return this.querySelector(".brand-card__icon");
  }

  // ---- internals ---------------------------------------------------------

  _build() {
    const label = this.getAttribute("label") || "";

    const face = document.createElement("button");
    face.type = "button";
    face.className = "brand-card__face";
    face.setAttribute("aria-label", label);
    face.setHTMLUnsafe(
      this.kind === "brand"
        ? BrandCard._brandFaceMarkup()
        : BrandCard._categoryFaceMarkup()
    );

    const mini = document.createElement("button");
    mini.type = "button";
    mini.className = "brand-card__mini";
    /* html */
    mini.setHTMLUnsafe(`
      <span class="brand-card__mini-mark" aria-hidden="true"><img class="brand-card__mini-img" alt="" /></span>
      <span class="brand-card__mini-label"></span>
    `);

    this.append(face, mini);

    face.addEventListener("click", () => this._fireSelect("face"));
    mini.addEventListener("click", () => this._fireSelect("mini"));
  }

  static _brandFaceMarkup() {
    /* html */
    return `
      <span class="brand-card__mark"><img class="brand-card__mark-img" alt="" /></span>
      <h3 class="brand-card__title"></h3>
    `;
  }

  static _categoryFaceMarkup() {
    /* html */
    return `
      <div class="brand-card__icon"></div>
      <h3 class="brand-card__title"></h3>
    `;
  }

  _fireSelect(source) {
    this.dispatchEvent(
      new CustomEvent("card-select", {
        bubbles: true,
        detail: { kind: this.kind, slug: this.slug, source, state: this.state },
      })
    );
  }

  _sync() {
    const label = this.getAttribute("label") || "";
    const bg = this.getAttribute("bg");
    const iconSrc = this.getAttribute("icon-src");
    const span = this.getAttribute("span");

    // Block class + kind/state/span modifiers (BEM; see brand-card.css)
    this.classList.add("brand-card");
    this.classList.toggle("brand-card--brand", this.kind === "brand");
    for (const s of CARD_STATES) {
      this.classList.toggle(`brand-card--${s}`, s === this.state);
    }
    for (let i = 1; i <= 4; i += 1) {
      this.classList.toggle(`brand-card--span-${i}`, span === String(i));
    }

    // Background drives --card-bg; brand-card.css derives a readable text
    // color from it with contrast-color(), so contrast always passes.
    if (bg) {
      this.style.setProperty("--card-bg", bg);
    }

    const title = this.querySelector(".brand-card__title");
    if (title) {
      title.textContent = label;
    }

    const miniLabel = this.querySelector(".brand-card__mini-label");
    if (miniLabel) {
      miniLabel.textContent = label;
    }

    const imgs = this.querySelectorAll(
      ".brand-card__mark-img, .brand-card__mini-img"
    );
    for (const img of imgs) {
      if (iconSrc) {
        img.src = iconSrc;
        img.style.display = "";
      } else {
        img.style.display = "none";
      }
    }

    const face = this.querySelector(".brand-card__face");
    if (face) {
      face.setAttribute("aria-label", label);
    }
    const mini = this.querySelector(".brand-card__mini");
    if (mini) {
      const isCurrent = this.classList.contains("brand-card--current");
      mini.setAttribute(
        "aria-label",
        isCurrent ? `Close ${label}` : `Open ${label}`
      );
    }
  }
}

customElements.define("brand-card", BrandCard);
