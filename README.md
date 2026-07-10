# RoleModel Brand

Canonical, versioned home for RoleModel Software's brand assets. This repo is the source of truth that feeds every distribution surface: the public brand page ([rolemodelsoftware.com/brand/rolemodel](https://rolemodelsoftware.com/brand/rolemodel)), design tools, documents, and AI agents.

The written brand context (voice, RoleModel Way references) lives in `standard/context/brand/`. This repo holds the *files and values*: logos, color, typography, icons, and machine-readable tokens.

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
    svg/                # primary logo, lockups, brand icon — light + dark
    png/                # raster exports @1x/@2x
  color/
    rolemodel.ase       # Adobe swatch exchange (print/CMYK)
    rolemodel.gpl       # optional: GIMP/Inkscape palette
  typography/
    # font licenses + links; do not commit licensed font binaries
  icons/
    # curated RoleModel icon exports (sources: Pastel Glyph, HugeIcons)
  imagery/
    # brand photography guidance + curated selects (or pointers if too large)
  dist/
    # generated bundles, e.g. rolemodel-brand-assets.zip
```

## Consumers

- **Website brand page** — download links point at raw files here (or a CDN in front of this repo)
- **Developers** — tokens publishable as `@rolemodel/brand` alongside Optics
- **AI tools** — `tokens/brand.json` + this README give agents correct values without scraping the rendered page (raw HTML of the Framer page returns placeholder values to non-JS consumers)

## Contribution

- Asset additions and corrections: commit to `main`
- Changes to brand *values* (colors, type scale, logo revisions): pull request + entry in `CHANGELOG.md`

## Status

- [x] Repo structure + tokens seeded from the live brand page
- [ ] Logos imported from Drive (currently served from Brandfetch CDN — replace)
- [ ] .ASE imported from Drive (currently a Drive share link on the site)
- [ ] Website download links repointed to self-hosted files
- [ ] Icon sets curated and exported
- [ ] `dist/` asset zip + "Download all" link on brand page
- [ ] Publish tokens as npm package (decide with Optics team)
