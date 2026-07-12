# Brand Portal — Framer Build Spec

Feeds RMS-72. Source of truth for assets: this repo (github.com/RoleModel/rolemodel-brand, release zips under Releases).

## 1. CMS structure

**Collection: `Brands`**

| Field | Type | Notes |
| --- | --- | --- |
| Name | text | RoleModel Software, LightningCAD, Craftsmanship Academy, Designer Products |
| Slug | slug | rolemodel, lightningcad, academy, designers |
| Tagline | text | one-line brand descriptor |
| Logo (light bg) | image | primary SVG render |
| Logo (dark bg) | image | white variant |
| Brand icon | image |  |
| Palette | reference → Colors | multi |
| Zip URL | link | release zip for this brand |
| Sort order | number |  |

**Collection: `Colors`**

| Field | Type               | Notes                |
| ----- | ------------------ | -------------------- |
| Name  | text               | RM Blue, etc.        |
| Hex   | text               |                      |
| CMYK  | text               | from .ASE            |
| Group | option             | core / accent / dark |
| Brand | reference → Brands |                      |

One template page `brand/[slug]` renders every brand consistently (Google sub-portal pattern). `/brand` becomes the index: brand cards linking to each sub-page.

## 2. Page template sections (layout improvements)

1. **Hero** — brand name, tagline, "Download all" button (zip), "What changed" line pulled from CHANGELOG (Mastercard pattern)
2. **Logos** — preview cards on paired light/dark tiles; per-card buttons: SVG · PNG · min-size/clear-space rules inline. Fix: self-hosted files only (no Brandfetch, no Drive)
3. **Color** — swatch grid from CMS; click-to-copy hex; chip text must pass AA on every swatch (dark chips on light swatches — fixes current failure on Light Purple, Medium Green, Orange, Bright Yellow, Dark Green)
4. **Typography** — specimens with scale table (already good on current page; keep)
5. **Voice** — rewritten, see §3
6. **Imagery / Icons / Graphics** — curated grids with zip downloads
7. Fix on current page: section numbering (Voice + Imagery both "04", jump to "07"), remove leaked "Slot 9 / Canvas Items" placeholder

## 3. Voice section rewrite (sourced from standard/context/brand)

Replace the current five ad-hoc concepts (Intentional / Professional / Approachable / Instructive / Engaging) with the four canonical voice concepts. Keep the existing three-trait-rows + example layout.

### Humble Confidence

Strong opinions, held loosely. Grounded in values and earned experience, not authority.

|            |                                                  |
| ---------- | ------------------------------------------------ |
| Directness | Say the point early, without hedging             |
| Honesty    | Name uncertainty plainly, then assert the method |
| Contrast   | Define what we're not before what we are         |

> "It's impossible to know exactly how a custom software project will go — but by choosing a shared point on the horizon, we can navigate together."

### Trusted Partnership

Partners, not customers. Shared ownership of outcomes.

|          |                                            |
| -------- | ------------------------------------------ |
| Language | "Together," "navigate," "thought partners" |
| Posture  | Clients are integral members of the team   |
| Standard | We treat your money as if it were our own  |

> "Together we build the tailored solution your company needs."

### Instructive Clarity

Teach before prescribing. Why always comes before how.

|  |  |
| --- | --- |
| Openers | Start with the reframing question |
| Metaphor | Concrete images that resolve to practice — skateboard to bicycle to car |
| Constructs | Named ideas that carry weight: Expertise Amplification, Iterative Value, Process Scaling |

> "The best software projects don't start with code — they start with understanding your business."

### Practical Value

No concept left floating. Everything lands on a business outcome.

|          |                                                      |
| -------- | ---------------------------------------------------- |
| Anchor   | Every claim ties to ROI or competitive advantage     |
| Values   | Shown through daily behavior, not mission statements |
| Delivery | Start small, deliver early, build on wins            |

> "Real value, not assumptions."

## 4. OG templates relocation

Move OG image templates out of the `/brand` directory in Framer — they're production tooling, not portal content. Suggested home: a `Templates` or `Internal` folder at project root (or the existing site-assets area). Portal keeps only the _downloadable_ OG examples if any.

## 5. Distribution decision (open)

Private repo release URLs are not hotlinkable. Either upload zips to Framer assets (framerusercontent CDN) or make the repo public and use `releases/latest/download/<zip>` permalinks. Decide with Tim.

## 6. Paste-ready Framer agent prompt

---

Create a brand portal structure in this project:

1. Add a CMS collection "Brands" with fields: Name (text), Slug (slug), Tagline (text), Logo Light (image), Logo Dark (image), Brand Icon (image), Zip URL (link), Sort Order (number). Add entries: RoleModel Software, LightningCAD, Craftsmanship Academy, Designer Products.
2. Add a CMS collection "Colors" with fields: Name (text), Hex (text), CMYK (text), Group (option: core/accent/dark), Brand (reference to Brands).
3. Create a CMS template page at brand/[slug] with sections: Hero (brand name, tagline, Download All button bound to Zip URL), Logos (cards showing Logo Light on a white tile and Logo Dark on a dark tile, with SVG and PNG download buttons), Color (swatch grid from Colors filtered by brand, hex chip text in a dark pill for contrast), Typography (type specimens), Voice, Imagery.
4. Rebuild /brand as an index page of brand cards linking to each template page.
5. Match the existing site look: DM Sans, existing color tokens, generous spacing, sentence-case headings, scroll-in reveals consistent with current pages.

---
