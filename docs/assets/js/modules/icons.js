// Original, hand-drawn line icons — one per brand-guide category.
// Motion is owned by icon-animations.js (GSAP + MorphSVGPlugin): each entry below
// carries its element markup plus, where a shape morph makes sense, a
// `morphTargets` map of { selector: targetPathData } that animations.js
// morphs to on hover and back to the original `d` on mouseleave.

export const ICONS = {
  color: {
    markup: `
      <circle class="color-a" cx="9" cy="9" r="6" fill="currentColor" opacity="0.9"/>
      <circle class="color-b" cx="15" cy="9" r="6" fill="currentColor" opacity="0.55"/>
      <circle class="color-c" cx="12" cy="15" r="6" fill="currentColor" opacity="0.3"/>
    `,
  },
  icons: {
    markup: `
      <g class="tile-icon-shapes">
        <path class="shape-square" d="M5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5v-5A1.5 1.5 0 0 1 5.5 4Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle class="shape-circle" cx="16" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path class="shape-triangle" d="M6 20l6-8 6 8Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      </g>
    `,
    // The square rounds into a circle — a system that can flex shape.
    morphTargets: {
      ".shape-square": "M8 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8Z",
    },
  },
  imagery: {
    markup: `
      <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle class="sun" cx="8.5" cy="9.5" r="2" fill="currentColor"/>
      <path class="hills" d="M 3 17 L 8 16 l 4 0 L 16 16 l 5 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    `,
    // Gentle rolling hills sharpen into dramatic peaks.
    morphTargets: {
      ".hills": "M3 17L8 12l4 3.5L16 10l5 7",
    },
  },
  motion: {
    markup: `
      <line class="handle-line-1" x1="5" y1="19" x2="5" y2="7" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <line class="handle-line-2" x1="19" y1="5" x2="19" y2="17" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <path class="curve" d="M5 19C5 7 19 17 19 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <circle class="point" cx="5" cy="19" r="1.6" fill="currentColor"/>
      <circle class="point" cx="19" cy="5" r="1.6" fill="currentColor"/>
      <circle class="handle-dot-1" cx="5" cy="7" r="1.3" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle class="handle-dot-2" cx="19" cy="17" r="1.3" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle class="traveler" r="2" fill="currentColor" opacity="0"/>
    `,
    // A gentle ease-out curve morphs into a bouncy overshoot curve — the
    // bezier handles (anchor -> line -> handle dot) swing to their new
    // control points at the same time, so the diagram stays honest about
    // what's actually driving the curve.
    morphTargets: {
      ".curve": "M5 19C14 2 10 22 19 5",
    },
  },
  "visual-style": {
    markup: `
      <path class="hex-ring" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <circle class="core" cx="12" cy="12" r="3" fill="currentColor"/>
    `,
    // Hexagon morphs into a 5-point star.
    morphTargets: {
      ".hex-ring": "M12 2L14.5 9H22L16 13.5L18 21L12 16.5L6 21L8 13.5L2 9H9.5Z",
    },
  },
  voice: {
    markup: `
      <path class="mic" stroke="currentColor" stroke-width="1.6" d="M17 7V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7Z"></path>
    <path stroke="currentColor" stroke-width="1.6" d="M20 11C20 15.4183 16.4183 19 12 19M12 19C7.58172 19 4 15.4183 4 11M12 19V22M12 22H15M12 22H9"></path>
    `,
    // Bubble morphs into a soundwave — "voice" made literal.
    morphTargets: {
      ".mic":
        "M17 7V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7Z",
    },
  },
};

export const renderIcon = (slug) => {
  const entry = ICONS[slug];
  if (!entry) {
    /* svg */
    return `<svg class="brand-card__icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }
  /* svg */
  return `<svg class="brand-card__icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="${slug}">${entry.markup}</svg>`;
};
