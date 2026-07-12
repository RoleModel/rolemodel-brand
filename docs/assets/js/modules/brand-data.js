// GENERATED FILE — do not edit directly.
// Source: docs/content/** — edit there, then push. CI regenerates this file.

export const BRAND_ASSET_BASE =
  "https://raw.githubusercontent.com/RoleModel/rolemodel-brand/main";

// Display order for the brand tiles / nav. Kept explicit so the BRANDS object
// can stay alphabetized (lint) without affecting the order the UI renders in.
export const BRAND_ORDER = ["rolemodel", "academy", "lightningcad"];

export const BRANDS = {
  academy: {
    font: "'Space Grotesk', sans-serif",
    heroColor: "#293747",
    icon: `${BRAND_ASSET_BASE}/logos/academy/AcademyIcon.svg`,
    logo: `${BRAND_ASSET_BASE}/logos/academy/Academy.svg`,
    logoWhite: `${BRAND_ASSET_BASE}/logos/academy/AcademyLogoWhite.svg`,
    name: "Craftsmanship Academy",
    palette: [
      "#293747",
      "#f2f2f2",
      "#00b871",
      "#f2f2f2",
      "#3e61b5",
      "#43bba4",
      "#f2f2f2",
      "#293747",
    ],
    primary: "#00b871",
    tagline: "",
    zip: "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/academy-logos.zip",
  },
  lightningcad: {
    font: "'DM Sans', sans-serif",
    heroColor: "#2a83f7",
    icon: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCAD-Icon.svg`,
    logo: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCad.svg`,
    logoWhite: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCadWhite.svg`,
    name: "LightningCAD",
    palette: [
      "#2a83f7",
      "#66a5f9",
      "#032a5e",
      "#2a83f7",
      "#66a5f9",
      "#032a5e",
      "#2a83f7",
      "#66a5f9",
    ],
    primary: "#2a83f7",
    subBrands: [
      {
        color: "#07BBC2",
        logo: `${BRAND_ASSET_BASE}/logos/designers/AirfieldDesigner.svg`,
        name: "Airfield Designer",
      },
      {
        color: "#ADBF08",
        logo: `${BRAND_ASSET_BASE}/logos/designers/BuildingDesigner.svg`,
        name: "Building Designer",
      },
      {
        color: "#FFAC08",
        logo: `${BRAND_ASSET_BASE}/logos/designers/DeckDesigner.svg`,
        name: "Deck Designer",
      },
      {
        color: "#0E8A6B",
        logo: `${BRAND_ASSET_BASE}/logos/designers/DockDesigner.svg`,
        name: "Dock Designer",
      },
      {
        color: "#2A83F7",
        logo: `${BRAND_ASSET_BASE}/logos/designers/DPQ.svg`,
        name: "DPQ",
      },
      {
        color: "#0BCAF0",
        logo: `${BRAND_ASSET_BASE}/logos/designers/FlowDesigner.svg`,
        name: "Flow Designer",
      },
      {
        color: "#8D3DE3",
        logo: `${BRAND_ASSET_BASE}/logos/designers/RailingDesigner.svg`,
        name: "Railing Designer",
      },
    ],
    tagline: "",
    zip: "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/lightningcad-logos.zip",
  },
  rolemodel: {
    font: "'DM Sans', sans-serif",
    heroColor: "#193c64",
    icon: `${BRAND_ASSET_BASE}/logos/rolemodel/icon.svg`,
    logo: `${BRAND_ASSET_BASE}/logos/rolemodel/logo.svg`,
    logoWhite: `${BRAND_ASSET_BASE}/logos/rolemodel/RMS-logo-White.svg`,
    name: "RoleModel Software",
    palette: [
      "#2a84f8",
      "#a998c9",
      "#fcf496",
      "#ffcd74",
      "#87d4e9",
      "#04242b",
      "#193c64",
      "#3a1f47",
    ],
    primary: "#2a84f8",
    tagline: "Software that Fits",
    zip: "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/rolemodel-brand-all.zip",
  },
};

// Spans sum to 6 per row across 3 rows (6-col grid) — sized so no two
// adjacent rows read as uniform, matching an actual bento composition
// instead of a repeating checkerboard.
export const CATEGORIES = [
  {
    name: "Logo",
    slug: "logo",
    span: 2,
    tagline: "Our wordmark and icon are the clearest signal of who we are.",
  },
  {
    name: "Color",
    slug: "color",
    span: 1,
    tagline: "Our palette carries our energy and warmth.",
  },
  {
    name: "Voice",
    slug: "voice",
    span: 1,
    tagline: "Humble confidence, grounded in partnership.",
  },
  {
    name: "Imagery",
    slug: "imagery",
    span: 1,
    tagline: "Photography should feel human and unscripted.",
  },
  {
    name: "Typography",
    slug: "typography",
    span: 1,
    tagline: "Confident and approachable, with clear hierarchy.",
  },
  {
    name: "Icons",
    slug: "icons",
    span: 2,
    tagline: "Icons help us recognize complex ideas instantly.",
  },
  {
    name: "Motion",
    slug: "motion",
    span: 2,
    tagline: "Fast, precise, never decorative for its own sake.",
  },
  {
    name: "Visual Style",
    slug: "visual-style",
    span: 2,
    tagline: "Crafted and considered — consistent geometry and restraint.",
  },
];
