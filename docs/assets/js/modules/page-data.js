// Extended brand data for individual pages.
// Augments brand-data.js (BRANDS + CATEGORIES) with named colors, CMYK,
// typography scale, voice concepts, logo file paths, etc.

import { BRAND_ASSET_BASE } from "./brand-data.js";

// Framer CMS image CDN (populated from the Brands collection; the portal spec
// sanctions framerusercontent as the hotlinkable distribution surface).
const _framerImg = (file, size) =>
  `https://framerusercontent.com/images/${file}${size ? `?scale-down-to=${size}` : ""}`;

// ---- Imagery grids (source: Framer CMS "Grid image" entries on
//      /brand/rolemodel and /brand/academy) ----
const ROLEMODEL_IMAGERY = [
  "SP3ekiKEAIeCRNlounJDgnIVo6A.jpg",
  "r9rk4GNEoxzWq6Yar5LcgfItfM.jpg",
  "4xMCoSTISeeivPFqvNz2OQolXIg.jpg",
  "OpAzLF77c4GVQiDhPOxI3h4DQR4.jpg",
  "9gX9sfBK6SDUfYtKRFsOWH3Ps7M.jpg",
  "uJtZe6XGMLMKfXic46lx4L79o.jpg",
  "eEwVoGGBWjKUr5ioADS51QpT4.jpg",
  "KxAyMj6qGZzI4US3bgZEf4xmyM.jpg",
  "TKb9aNWWjqUHWA0Z70N0pr8VXI.jpg",
  "msMz4LpVawbyaMVKVddxXCTtC10.jpg",
  "4CwnVwU8yJCPnmrlgkeHSNjfVtE.jpg",
  "YzyBQH7yL9o4dsOIAnZxqMIewX4.jpg",
  "t82COAQziwottdArJt6RqQo.jpg",
  "gaGkThpjmaBhUf0FIMtahUWVPj8.jpg",
  "YDHeJat9CwvVVSxzu16yX1XhSTI.jpg",
  "Bq3RGphbTrykV2yyR5jb5bL5w.jpg",
  "CSRfCToqWoEzT1G6RDWlZQBujdk.jpg",
  "8iSDPW1fGUyGQZTfV7zOmZ3GVg.jpg",
  "kYNPV7Ph4VdLFbdnxjS3QRFHOM8.jpg",
  "FIdyHJhvtQrcqTHJERXk6xWsftk.jpg",
  "hgiNhKMpy61bN6n7tsZjWUuJ0.jpg",
  "sDs9osCQn9Y0ZASDfl0UYd9jH0.jpg",
  "RsGV7fCaCyPeTwlbsYPKw4VpXdc.jpg",
  "4MPRK6rIAbXyEexuZbTxqtfhn4.jpg",
  "fXb0rZn4HOG9Yh3oGYvYfMv1UU.jpg",
  "3qFOjRqmsjxykB3es7HdJEWnNJg.jpg",
];

// Academy renders live in the repo (imagery/site/, mirrored into
// docs/assets/imagery/academy/ so GitHub Pages serves them). Filenames match
// the committed files exactly (including the two "Acadmey" typos).
const ACADEMY_IMAGERY_FILES = [
  "Academy-Logo-Clay.png",
  "Acadmey-Keyboard.png",
  "Academy-Rocket.webp",
  "Academy-Browser.png",
  "Acadmey-Cursor.png",
  "Academy-Phone.png",
  "Academy-Slide.png",
  "Academy-Cursor-2.png",
];

const _imageEntries = (files) =>
  files.map((file) => ({
    full: _framerImg(file, 2048),
    src: _framerImg(file, 1024),
  }));

const _repoImageEntries = (files) =>
  files.map((file) => {
    const url = `../assets/imagery/academy/${encodeURIComponent(file)}`;
    return { full: url, src: url };
  });

export const PAGE_DATA = {
  academy: {
    aseUrl: "../downloads/academy-colors.ase",
    colors: [
      {
        cmyk: "C29 M3 Y0 K78",
        group: "core",
        hex: "#293747",
        name: "Academy Dark",
        span: { c: 2, r: 2 },
      },
      {
        cmyk: "C100 M0 Y39 K28",
        group: "core",
        hex: "#00B871",
        name: "Primary Green",
        span: { c: 3, r: 1 },
      },
      {
        cmyk: "C66 M46 Y0 K29",
        group: "accent",
        hex: "#3E61B5",
        name: "Blue",
        span: { c: 2, r: 1 },
      },
      {
        cmyk: "C64 M0 Y13 K27",
        group: "accent",
        hex: "#43BBA4",
        name: "Teal",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C0 M0 Y0 K5",
        group: "neutral",
        hex: "#F2F2F2",
        name: "Light Gray",
        span: { c: 2, r: 1 },
      },
    ],
    fonts: [
      {
        googleUrl: "https://fonts.google.com/specimen/Space+Grotesk",
        name: "Space Grotesk",
        note: "Used for all text in Academy brand contexts.",
        role: "Display & UI",
        weights: [300, 400, 500, 600, 700],
      },
      {
        googleUrl: "https://fonts.google.com/specimen/Geist+Mono",
        name: "Geist Mono",
        note: "Always uppercase in UI. Used for labels, metadata, and code.",
        role: "Mono Caps / Code",
        weights: [400, 600, 700],
      },
    ],
    gridCols: 6,
    imagery: _repoImageEntries(ACADEMY_IMAGERY_FILES),
    imageryIntro:
      "Academy imagery is built on handcrafted 3D clay-style renders—tactile, playful, and unmistakably made by hand. Every icon and scene reinforces the craftsmanship metaphor at the heart of the Academy.",
    logoRules: [
      {
        desc: "Never display the icon smaller than 50 px.",
        label: "Min size",
        value: "50 px",
      },
      {
        desc: "Minimum clear space on all sides equals 40% of the icon height.",
        label: "Clear space",
        value: "40%",
      },
      {
        desc: "Use color logo on light; white logo on dark.",
        label: "Backgrounds",
        value: "Light · Dark",
      },
    ],
    logos: [
      {
        bg: "#F2F2F2",
        label: "Academy logo — light backgrounds",
        pngHref: `${BRAND_ASSET_BASE}/logos/academy/Academy@2x.png`,
        src: `${BRAND_ASSET_BASE}/logos/academy/Academy.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/academy/Academy.svg`,
      },
      {
        bg: "#293747",
        label: "Academy logo — dark backgrounds",
        pngHref: `${BRAND_ASSET_BASE}/logos/academy/AcademyLogoWhite@2x.png`,
        src: `${BRAND_ASSET_BASE}/logos/academy/AcademyLogoWhite.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/academy/AcademyLogoWhite.svg`,
      },
      {
        bg: "#F2F2F2",
        label: "Academy icon",
        pngHref: `${BRAND_ASSET_BASE}/logos/academy/AcademyIcon@4x.png`,
        src: `${BRAND_ASSET_BASE}/logos/academy/AcademyIcon.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/academy/AcademyIcon.svg`,
      },
    ],
    zipUrl:
      "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/academy-logos.zip",
  },

  lightningcad: {
    aseUrl: "../downloads/lightningcad-colors.ase",
    colors: [
      {
        cmyk: "C83 M49 Y0 K3",
        group: "core",
        hex: "#2A83F7",
        name: "CAD Blue",
        span: { c: 4, r: 2 },
      },
      {
        cmyk: "C59 M33 Y0 K2",
        group: "core",
        hex: "#66A5F9",
        name: "CAD Light Blue",
        span: { c: 2, r: 1 },
      },
      {
        cmyk: "C97 M55 Y0 K63",
        group: "dark",
        hex: "#032A5E",
        name: "CAD Navy",
        span: { c: 2, r: 1 },
      },
    ],
    fonts: [
      {
        googleUrl: "https://fonts.google.com/specimen/DM+Sans",
        name: "DM Sans",
        note: "Same font family as RoleModel Software.",
        role: "Display & UI",
        weights: [400, 500, 600, 700],
      },
      {
        googleUrl: "https://fonts.google.com/specimen/Geist+Mono",
        name: "Geist Mono",
        note: "Always uppercase in UI. Used for labels, metadata, and code.",
        role: "Mono Caps / Code",
        weights: [400, 600, 700],
      },
    ],
    gridCols: 6,
    // LightningCAD has no dedicated CMS image set yet; it shares the
    // RoleModel photography until one is populated in Framer.
    imagery: _imageEntries(ROLEMODEL_IMAGERY),
    imageryIntro:
      "LightningCAD imagery leans on the RoleModel photography library—real projects, real people—paired with clean product UI captures of the design tools themselves.",
    logoRules: [
      {
        desc: "Never display the icon smaller than 50 px.",
        label: "Min size",
        value: "50 px",
      },
      {
        desc: "Minimum clear space on all sides equals 40% of the icon height.",
        label: "Clear space",
        value: "40%",
      },
      {
        desc: "Use color logo on light; white logo on dark.",
        label: "Backgrounds",
        value: "Light · Dark",
      },
    ],
    logos: [
      {
        bg: "#FAFAF7",
        label: "CAD logo — light backgrounds",
        pngHref: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCad@2x.png`,
        src: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCad.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCad.svg`,
      },
      {
        bg: "#032A5E",
        label: "CAD logo — dark backgrounds",
        pngHref: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCadWhite@2x.png`,
        src: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCadWhite.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/lightningcad/LightningCadWhite.svg`,
      },
    ],
    zipUrl:
      "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/lightningcad-logos.zip",
  },

  rolemodel: {
    aseUrl: "../downloads/rolemodel-colors.ase",
    // ---- Named color palette (HEX + official CMYK from brand reference) ----
    // span: {c, r} — column/row span for the full-screen bento grid.
    colors: [
      // Core
      {
        cmyk: "C81 M54 Y3 K0",
        group: "core",
        hex: "#3A70B3",
        name: "RM Blue",
        span: { c: 2, r: 2 },
      },
      {
        cmyk: "C98 M80 Y35 K23",
        group: "core",
        hex: "#193C64",
        name: "RM Dark Blue",
        span: { c: 2, r: 1 },
      },
      // Accent
      {
        cmyk: "C33 M40 Y0 K0",
        group: "accent",
        hex: "#A998C9",
        name: "Light Purple",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C81 M98 Y37 K39",
        group: "dark",
        hex: "#3C194A",
        name: "Dark Purple",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C42 M9 Y0 K9",
        group: "accent",
        hex: "#87D4E9",
        name: "Light Blue",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C18 M0 Y29 K15",
        group: "accent",
        hex: "#B3D99A",
        name: "Light Green",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C71 M25 Y76 K8",
        group: "dark",
        hex: "#538C5E",
        name: "Dark Green",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C51 M0 Y72 K0",
        group: "accent",
        hex: "#86C774",
        name: "Medium Green",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C0 M20 Y63 K0",
        group: "accent",
        hex: "#FFCD74",
        name: "Orange",
        span: { c: 1, r: 1 },
      },
      {
        cmyk: "C2 M0 Y51 K0",
        group: "accent",
        hex: "#FCF496",
        name: "Bright Yellow",
        span: { c: 1, r: 1 },
      },
      // Dark
      {
        cmyk: "C89 M66 Y59 K68",
        group: "dark",
        hex: "#04242B",
        name: "Dark Blue Green",
        span: { c: 2, r: 1 },
      },
      {
        cmyk: "C84 M61 Y52 K40",
        group: "dark",
        hex: "#27434D",
        name: "Blue Green",
        span: { c: 2, r: 1 },
      },
    ],
    // ---- Font family ----
    fonts: [
      {
        googleUrl: "https://fonts.google.com/specimen/DM+Sans",
        name: "DM Sans",
        note: "Variable weight 100–1000. Used at all hierarchy levels.",
        role: "Display & UI",
        weights: [400, 500, 600, 700],
      },
      {
        googleUrl: "https://fonts.google.com/specimen/Geist+Mono",
        name: "Geist Mono",
        note: "Always uppercase in UI. Used for labels, metadata, and code.",
        role: "Mono Caps / Code",
        weights: [400, 600, 700],
      },
    ],
    gridCols: 6,
    // ---- Imagery (Framer CMS grid images) ----
    imagery: _imageEntries(ROLEMODEL_IMAGERY),
    imageryIntro:
      'Imagery should feel real, grounded, and people-centered—showing the work, the process, and the partnership. Favor authentic moments over stocky "tech" clichés. Choose photos and illustrations that reinforce trust, competence, and momentum.',
    logoRules: [
      {
        desc: "Never display the icon smaller than 50 px.",
        label: "Min size",
        value: "50 px",
      },
      {
        desc: "Minimum clear space on all sides equals 40% of the icon height.",
        label: "Clear space",
        value: "40%",
      },
      {
        desc: "Use color logo on light; white logo on dark. Never place on busy images.",
        label: "Backgrounds",
        value: "Light · Dark",
      },
    ],
    // ---- Logos ----
    logos: [
      {
        bg: "#FAFAF7",
        label: "Color logo — light backgrounds",
        pngHref: `${BRAND_ASSET_BASE}/logos/rolemodel/RMS-logo-Color@2x.png`,
        src: `${BRAND_ASSET_BASE}/logos/rolemodel/logo.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/rolemodel/logo.svg`,
      },
      {
        bg: "#04242B",
        label: "White logo — dark backgrounds",
        pngHref: `${BRAND_ASSET_BASE}/logos/rolemodel/RMS-logo-White@2x.png`,
        src: `${BRAND_ASSET_BASE}/logos/rolemodel/RMS-logo-White.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/rolemodel/RMS-logo-White.svg`,
      },
      {
        bg: "#FAFAF7",
        label: "Brand icon — color",
        pngHref: `${BRAND_ASSET_BASE}/logos/rolemodel/icon.png`,
        src: `${BRAND_ASSET_BASE}/logos/rolemodel/icon.svg`,
        svgHref: `${BRAND_ASSET_BASE}/logos/rolemodel/icon.svg`,
      },
    ],
    zipUrl:
      "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/rolemodel-brand-all.zip",
  },
};

// ---- Shared type scale (same across all brands) ----
export const TYPE_SCALE = [
  {
    lh: "1em",
    ls: "-0.05em",
    name: "Hero",
    sample: "Build",
    size: "10rem",
    usage: "Single biggest statement on a page",
    weight: 700,
  },
  {
    lh: "1.1em",
    ls: "-0.05em",
    name: "Display",
    sample: "Software that Fits",
    size: "4.5rem",
    usage: "Section-leading headlines",
    weight: 700,
  },
  {
    lh: "1.1em",
    ls: "-0.04em",
    name: "H1",
    sample: "Crafted for your business",
    size: "3.7rem",
    usage: "Major sections, top-level hierarchy",
    weight: 700,
  },
  {
    lh: "1.1em",
    ls: "-0.04em",
    name: "H2",
    sample: "Trusted partnership",
    size: "3.7rem",
    usage: "Secondary section titles under an H1",
    weight: 600,
  },
  {
    lh: "1.3em",
    ls: "-0.03em",
    name: "Subheading",
    sample: "We build software that fits the exact way your company works.",
    size: "2.875rem",
    usage: "Context directly under a headline",
    weight: 500,
  },
  {
    lh: "1.6em",
    ls: "-0.02em",
    name: "Body",
    sample:
      "Great software starts with deep understanding. We embed with your team.",
    size: "1.6rem",
    usage: "Main readable text",
    weight: 400,
  },
  {
    lh: "1.2em",
    ls: "0.06em",
    mono: true,
    name: "Mono Caps",
    sample: "SECTION 04 — TYPOGRAPHY",
    size: "1.05rem",
    usage: "Section headings and call-outs in asides",
    weight: 700,
  },
];

// ---- Voice concepts — sourced from the RoleModel Way + core values + approach ----
export const VOICE_CONCEPTS = [
  {
    description:
      "Strong positions, grounded in values and earned experience rather than authority. Name what we're not before what we are; name uncertainty plainly, then assert the method.",
    name: "Humble Confidence",
    practice: [
      '"The best software projects don\'t start with code"',
      '"relationship, not recipe"',
      '"Hope is not a strategy"',
    ],
    quote:
      "It's impossible to know exactly how a custom software project will go — but by choosing a shared point on the horizon, we can navigate together.",
  },
  {
    description:
      "Shared ownership of outcomes, not a service transaction. Partners are integral members of the team, and trust is a moral commitment.",
    name: "Trusted Partnership",
    practice: [
      '"Together we build the tailored solution your company needs."',
      '"integral members of our development team"',
      '"navigate together"',
    ],
    quote: "We treat your money as if it was our own.",
  },
  {
    description:
      "Teach before prescribing. Why comes before how, and complex ideas are made durable through concrete metaphors and named constructs.",
    name: "Instructive Clarity",
    practice: [
      '"Why do we write tests?"',
      '"Expertise Amplification"',
      '"Iterative Value"',
    ],
    quote:
      "The best software projects don't start with code — they start with understanding your business.",
  },
  {
    description:
      "No concept left floating. Theory, references, and values resolve into a concrete behavior or a business outcome.",
    name: "Practical Value",
    practice: [
      '"Theory can be helpful, but what counts is delivering value for customers."',
      '"start small, deliver early, build on wins"',
    ],
    quote: "Real value, not assumptions.",
  },
];

// ---- Easing tokens ----
export const EASING_TOKENS = [
  {
    cssVar: "--ease-out",
    desc: "Default transition — fast start, soft landing",
    name: "Ease Out",
    value: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  {
    cssVar: "--ease-in-out",
    desc: "Heavier transitions, background fades",
    name: "Ease In-Out",
    value: "cubic-bezier(0.76, 0, 0.24, 1)",
  },
  {
    cssVar: "--ease-overshoot",
    desc: "Bouncy reveals — use sparingly",
    name: "Overshoot",
    value: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
];

export const DURATION_TOKENS = [
  {
    cssVar: "--duration-fast",
    name: "Fast",
    usage: "Hover states, icon micromotion",
    value: "200ms",
  },
  {
    cssVar: "--duration-base",
    name: "Base",
    usage: "Standard page transitions",
    value: "400ms",
  },
  {
    cssVar: "--duration-slow",
    name: "Slow",
    usage: "Background color changes, reveal sequences",
    value: "600ms",
  },
];
