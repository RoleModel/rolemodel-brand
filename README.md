# RoleModel Brand

![RoleModel Brand](ReadMeImage.png)

Canonical, versioned home for RoleModel Software's brand assets. This repo is the source of truth that feeds every distribution surface: the public brand page ([rolemodelsoftware.com/brand/rolemodel](https://rolemodelsoftware.com/brand/rolemodel)), design tools, documents, and AI agents.

The written brand context (voice, RoleModel Way references) lives in `standard/context/brand/`. This repo holds the _files and values_: logos, color, typography, icons, and machine-readable tokens.

## Why a repo

Rule and file should never separate. Brand changes here are pull requests: reviewable, versioned, and traceable. Downloads on the website should point at files we own (this repo), not third-party CDNs or Drive share links.

## Structure

```text
rolemodel-brand/
  README.md
  CHANGELOG.md          # what changed, Mastercard-style "recent updates"
  tokens/
    brand.json          # machine-readable source of truth (colors, type, spacing)
  logos/
    rolemodel/          # RMS logo suite: color/white SVG + @2x/@3x PNG, icon, R mark
    academy/            # Craftsmanship Academy logos + icon
    lightningcad/       # LightningCAD logos (black/white variants)
    designers/          # DPQ + Designer product marks (Dock, Deck, Railing, Flow, Building)
    almanac/            # Almanac logo (color/white SVG + @2x PNG)
    compass/            # Compass logo (color/white SVG + PNG)
    standard/           # Standard logo (color/white SVG + @2x PNG)
  css/                  # theme CSS (academy-theme.css)
  color/
    Colors.ase, RoleModelBrandColors.ase, ColorGridSmall@4x.png
  typography/
    DM_Sans/            # variable + static TTFs, OFL license
    Geist_Mono/         # variable + static TTFs, OFL license
  icons/
    black/              # curated icon set (290 SVGs)
    process-svg-colors.js
  graphics/
    highlighters/       # brand highlighter/underline vectors
    approach/           # approach graphic exports (SVG + @2x PNG)
  imagery/
    og/                 # OG / social images
    site/               # site imagery (core values, approach, milestones)
  dist/                 # generated bundles, e.g. rolemodel-brand-assets.zip
```

Design source files (.afdesign, .afphoto, .psd, .ai, print projects) stay in Drive; this repo versions exports only.

### File naming

Every asset filename is lowercase and hyphen-separated:

```text
<product>-<role>[-variant][@Nx].<ext>
```

- `role` is `logo` or `icon`
- `variant` distinguishes cuts of the same role — `-white` (for dark backgrounds), `-black`, `-color-on-dark` (color mark with white type)
- `@2x` / `@3x` / `@4x` mark pixel density and are the only non-hyphen characters allowed; SVGs never carry one
- the icon set under `icons/black/` follows the same lowercase-hyphen rule

So: `rolemodel-logo-white@2x.png`, `dock-designer-app-logo-black.svg`, `academy-icon.svg`. No spaces, capitals, underscores, or export suffixes like `-1` / `_2` — if two files would collide, name the difference.

Note: the Drive folder spells it "LightingCAD" — normalized to `lightningcad` here.

`docs/` is a separate, self-contained static site (the brand guidelines portal, served via GitHub Pages) — its content workflow is documented below.

## Editing the brand guidelines site (`docs/`)

Copy (taglines, voice quotes, principle text) and structural config (grid spans, colors, font paths) both live under `docs/content/` — markdown for copy, JSON for structural "dials." A GitHub Actions workflow (`.github/workflows/build-content.yml`) regenerates `docs/assets/js/modules/{brand-data,page-data,site-content}.js` from `docs/content/**` automatically on every push to `main` and commits the result back — editing a file under `docs/content/` and pushing is enough; nothing needs to be run locally.

For local previewing before you push: `npm run content:build` (one-off) or `npm run content:watch` (rebuilds on save). `npm run content:test` runs the generator's own regression tests. See `docs/scripts/build-content.mjs` for the generator itself — it's the only thing that should ever write to `docs/assets/js/modules/{brand-data,page-data,site-content}.js`; those files are generated and get overwritten on the next build.

Note: `tokens/brand.json` (above) is a separate, legacy artifact from when the brand page was Framer-CMS-driven — nothing in `docs/` reads it.

## Exporting logos to a consumer

`npm run logos:export` copies the curated logo set — each brand's wordmark, white wordmark, and icon, plus every sub-brand's marks — into a consumer and writes a `README.md` index alongside them so an agent can pick the right file without listing the directory. It defaults to the `rolemodel-brand` skill in the sibling `standard` repo; pass `--dest <dir>` for anywhere else.

The set is derived from `docs/content/config/brands/*.json`, the same config that drives the guidelines site, so a brand or sub-brand added there is exported automatically and nothing can be exported that the site doesn't know about. The family note in `docs/content/prose/brands/*.md` carries through to the generated index.

`npm run logos:check` verifies a destination is current without writing — it exits non-zero listing missing, extra, and differing files.

Exported files are generated. Fix a mark here, re-run the export; never edit the copy in the consumer.

## Consumers

- **Website brand page** — download links point at raw files here (or a CDN in front of this repo)
- **Developers** — tokens publishable as `@rolemodel/brand` alongside Optics
- **AI tools** — `tokens/brand.json` + this README give agents correct values without scraping the rendered page (raw HTML of the Framer page returns placeholder values to non-JS consumers)

## Contribution

- Asset additions and corrections: commit to `main`
- Changes to brand _values_ (colors, type scale, logo revisions): pull request + entry in `CHANGELOG.md`

## Status

- [x] Repo structure + tokens seeded from the live brand page
- [ ] Logos imported from Drive (currently served from Brandfetch CDN — replace)
- [ ] .ASE imported from Drive (currently a Drive share link on the site)
- [ ] Website download links repointed to self-hosted files
- [ ] Icon sets curated and exported
- [ ] `dist/` asset zip + "Download all" link on brand page
- [ ] Publish tokens as npm package (decide with Optics team)
