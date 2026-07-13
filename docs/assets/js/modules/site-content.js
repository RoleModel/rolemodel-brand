// GENERATED FILE — do not edit directly.
// Source: docs/content/** — edit there, then push. CI regenerates this file.

// Misc content that used to be hardcoded inline in individual pages'
// <script> blocks — motion/icon/visual-style principles, imagery
// treatments, and a couple of one-off UI strings.

export const INTRO_HEADING =
  "Our brand guidelines help us craft an identity as intentional as the software we build.";

export const CYCLE_WORDS = ["purpose", "precision", "restraint", "intent"];

export const MOTION_PRINCIPLES = [
  {
    desc: "Animation directs attention, confirms an action, or shows system state. If it does none of those, it does not ship.",
    title: "Intentional, not ambient",
  },
  {
    desc: "Ease-out is the default: elements enter quickly and settle gently. Linear motion feels mechanical — save it for progress, not personality.",
    title: "Fast starts, soft landings",
  },
  {
    desc: "Move a single element, or a coherent group in sequence. Parallel motion competes for attention and reads as noise.",
    title: "One thing at a time",
  },
  {
    desc: "Every animation degrades to an instant, legible state. Motion is the polish, never the gate.",
    title: "Reduced motion is first-class",
  },
];

export const ICON_PRINCIPLES = [
  {
    mark: "✓",
    text: "Match icon style to context: spot icons for features, UI icons for interactive controls.",
  },
  {
    mark: "✓",
    text: "Maintain consistent stroke weight within a single composition (don't mix 1px and 2px strokes).",
  },
  {
    mark: "✓",
    text: "Use brand colors for fills and strokes. Avoid generic grays in non-system contexts.",
  },
  {
    mark: "✗",
    text: "Never use a UI icon at spot scale. A 16px icon blown up to 80px loses all visual intent.",
  },
  {
    mark: "✗",
    text: "Never mix icon families in the same component or page section.",
  },
];

export const MOSAIC_SPANS = ["a", "b", "c", "d", "e", "f", "g"];

export const IMAGERY_TREATMENTS = [
  {
    label: "Crop",
    text: "Tight crops on faces or hands convey craft. Wide establishing shots need a clear subject in the foreground.",
  },
  {
    label: "Color",
    text: "Slight warmth bias. Avoid cold, desaturated tones. The image doesn't have to match the brand palette exactly.",
  },
  {
    label: "Overlay",
    text: "When placing text over images, use a single-color tint overlay at 50–70% opacity, or position text in a clear area.",
  },
];

export const VISUAL_STYLE_PRINCIPLES = [
  {
    desc: "Consistent radius, consistent shadow, consistent spacing. The system is visible through its regularity — not through decoration.",
    title: "Geometric Restraint",
  },
  {
    desc: "Information is dense at smaller scales (data, controls) and sparse at larger scales (hero, marketing). Breathing room is a design element.",
    title: "Density at Scale",
  },
  {
    desc: "Color communicates status, hierarchy, or brand identity — not decoration. One dominant hue per composition with a single accent at most.",
    title: "Meaningful Color",
  },
  {
    desc: "Scale and weight carry the hierarchy — not color or decorative treatment. Every text element has a single clear role.",
    title: "Typographic Hierarchy",
  },
];

export const RADII = [
  {
    size: 40,
    token: "--radius-xs",
    usage: "Tags, chips",
  },
  {
    size: 48,
    token: "--radius-sm",
    usage: "Small controls",
  },
  {
    size: 56,
    token: "--radius-md",
    usage: "Buttons, inputs",
  },
  {
    size: 64,
    token: "--radius-lg",
    usage: "Cards (compact)",
  },
  {
    size: 72,
    token: "--radius-xl",
    usage: "Cards (standard)",
  },
  {
    size: 88,
    token: "--radius-2xl",
    usage: "Cards (prominent)",
  },
  {
    size: 48,
    token: "--radius-pill",
    usage: "Pills, toggles",
  },
];

export const SHADOWS = [
  {
    name: "Card",
    token: "--shadow-card",
    usage: "Cards, panels",
  },
  {
    name: "Raised",
    token: "--shadow-raised",
    usage: "Floating buttons, active states",
  },
  {
    name: "Modal",
    token: "--shadow-modal",
    usage: "Modals, lightboxes",
  },
];

export const SPECS = [
  {
    label: "Max Width",
    text: "Content container. Centered with horizontal padding.",
    token: "--content-max",
  },
  {
    label: "Gutter",
    text: "Horizontal padding on page content. Tightens on mobile.",
    token: "--content-pad",
  },
  {
    label: "Section Gap",
    text: "Vertical space between major content sections.",
    token: "--section-gap",
  },
];

export const UI_STRINGS = {
  subBrandFamilyNote:
    "$BRAND is a platform of purpose-built design tools. Each product carries its own mark and signature color while sharing the CAD lineage.",
  subpaletteNote:
    "Each product in the family owns a signature color. Click a swatch to copy its hex.",
};
