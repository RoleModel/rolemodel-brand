// Original, hand-drawn line icons — one per brand-guide category.
// Motion is owned by icon-animations.js (GSAP + MorphSVGPlugin): each entry below
// carries its element markup plus, where a shape morph makes sense, a
// `morphTargets` map of { selector: targetPathData } that animations.js
// morphs to on hover and back to the original `d` on mouseleave.

export const ICONS = {
  academy: {
    markup: `
    <g transform="translate(3.5 3.5)"><path d="M 17.755 0.001 L 17.756 0.001 C 18.137 0.001 18.518 0.009 18.899 0.025 L 18.899 0.026 C 25.257 0.343 31.049 4.46 33.731 10.239 C 33.956 10.725 34.157 11.255 34.361 11.757 L 35.557 14.73 C 36.48 17.017 37.441 19.287 38.353 21.578 C 38.553 22.078 38.755 22.669 39 23.16 C 38.369 23.168 37.738 23.171 37.107 23.168 L 37.107 23.168 C 36.592 23.166 36.028 23.152 35.513 23.201 L 35.464 23.206 L 35.465 23.256 C 35.513 25.398 35.48 27.639 35.479 29.793 C 35.479 31.83 35.518 33.977 35.464 36 C 33.865 35.939 32.025 35.999 30.411 35.996 L 30.411 35.996 L 19.989 35.997 C 18.727 35.995 17.251 36.017 16.006 35.89 L 16.006 35.89 C 11.904 35.511 8.065 33.676 5.163 30.708 L 5.162 30.708 L 5.007 30.549 C 1.758 27.201 -0.043 22.676 0.001 17.977 L 0.001 17.976 C -0.022 13.235 1.823 8.682 5.124 5.33 L 5.124 5.329 C 8.067 2.322 11.952 0.453 16.108 0.046 C 16.657 -0.003 17.202 -0.002 17.755 0.001 Z" fill="transparent" stroke-width="4" stroke="rgb(4, 184, 112)" stroke-miterlimit="10" stroke-dasharray=""></path>
    <g transform="translate(5.5 5.5)">
    <path d="M 11.999 0 L 11.999 24" fill="transparent" stroke-width="4" stroke="rgb(49, 97, 181)"></path>
    <path d="M 24 11.999 L 0 11.999" fill="transparent" stroke-width="4" stroke="rgb(49, 97, 181)"></path>
    <path d="M 20.486 20.485 L 3.515 3.514" fill="transparent" stroke-width="4" stroke="rgb(49, 97, 181)"></path>
    <path d="M 3.515 20.486 L 20.486 3.515" fill="transparent" stroke-width="4" stroke="rgb(49, 97, 181)"></path></g></g>`,
    morphTargets: {
      ".line-1": "M 11.999 0 L 12 1",
      ".line-2": "M 2 12 L 0 11.999",
      ".line-3": "M 5 5 L 3.515 3.514",
      ".line-4": "M 19 5 L 20.486 3.515",
    },
  },
  color: {
    markup: `
    <g class="colors">
      <circle class="color-a" cx="9" cy="9" r="6" fill="currentColor" opacity="0.9"/>
      <circle class="color-b" cx="15" cy="9" r="6" fill="currentColor" opacity=".8"/>
      <circle class="color-c" cx="12" cy="15" r="6" fill="currentColor" opacity=".7"/>
    </g>
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
      <path class="curve" stroke="currentColor" stroke-width="1.6"
        d="M 0 20 C 40 20 -23 0 20 0 M 18 0 L 20 0 M 0 20 L 2 20"
        ></path>
    `,
    morphTargets: {
      ".curve": "M 0 20 C 20 20 0 0 20 0 M 0 0 L 20 0 M 0 20 L 20 20",
    },
  },
  "visual-style": {
    markup: `
    <path stroke="currentColor" stroke-width="1" d="M8 4.5V3M16 4.5V3" stroke-linecap="round" stroke-linejoin="round"></path>
    <path stroke="currentColor" stroke-width="1" d="M19.5 8L21 8M19.5 16H21" stroke-linecap="round" stroke-linejoin="round"></path>
    <path stroke="currentColor" stroke-width="1" d="M8 21V19.5M16 21V19.5" stroke-linecap="round" stroke-linejoin="round"></path>
    <path stroke="currentColor" stroke-width="1" d="M3 8L4.5 8M3 16H4.5" stroke-linecap="round" stroke-linejoin="round"></path>
    <path class="hex-ring" stroke="currentColor" stroke-width="1" d="M8 11C8 9.58579 8 8.87868 8.43934 8.43934C8.87868 8 9.58579 8 11 8H13C14.4142 8 15.1213 8 15.5607 8.43934C16 8.87868 16 9.58579 16 11V13C16 14.4142 16 15.1213 15.5607 15.5607C15.1213 16 14.4142 16 13 16H11C9.58579 16 8.87868 16 8.43934 15.5607C8 15.1213 8 14.4142 8 13V11Z"></path>
    `,
    // Hexagon morphs into a 5-point star.
    morphTargets: {
      ".hex-ring":
        "M 16 2 C 19 2 22 4 22 8 V 16 C 22 20 19 22 16 22 H 8 C 4 22 2 19 2 16 V 8 C 2 4 4 2 8 2 H 16 Z",
    },
  },
  voice: {
    markup: `
    <path class="quote" d="M15.5627 18.5L15.0101 17.9929L15.7713 19.2204L15.5627 18.5ZM17.8554 13.8316L18.594 13.9616L18.7433 13.1138L17.883 13.0821L17.8554 13.8316ZM15.8444 6.15598L15.4282 5.53211L15.428 5.53222L15.8444 6.15598ZM18 5.5V6.25C19.7663 6.25 21.25 7.75043 21.25 9.66703H22H22.75C22.75 6.98037 20.6519 4.75 18 4.75V5.5ZM22 9.66703H21.25C21.25 13.5526 18.7372 16.7999 15.3541 17.7796L15.5627 18.5L15.7713 19.2204C19.8135 18.0499 22.75 14.2018 22.75 9.66703H22ZM15.5627 18.5L16.1153 19.0071C17.3716 17.638 18.2533 15.8969 18.594 13.9616L17.8554 13.8316L17.1167 13.7016C16.8262 15.3523 16.075 16.8325 15.0101 17.9929L15.5627 18.5ZM17.8554 13.8316L17.883 13.0821C16.1699 13.019 14.75 11.5411 14.75 9.66703H14H13.25C13.25 12.2953 15.2566 14.4864 17.8277 14.5811L17.8554 13.8316ZM14 9.66703H14.75C14.75 8.44455 15.3586 7.38216 16.2609 6.77974L15.8444 6.15598L15.428 5.53222C14.1116 6.41106 13.25 7.94004 13.25 9.66703H14ZM15.8444 6.15598L16.2607 6.77985C16.765 6.44339 17.3609 6.25 18 6.25V5.5V4.75C17.0517 4.75 16.168 5.03842 15.4282 5.53211L15.8444 6.15598Z" fill="currentColor"></path>
    <path class="quote2" d="M3.5627 18.5L3.01011 17.9929L3.77131 19.2204L3.5627 18.5ZM5.85537 13.8316L6.59401 13.9616L6.74326 13.1138L5.88299 13.0821L5.85537 13.8316ZM3.84443 6.15598L3.42816 5.53211L3.42799 5.53222L3.84443 6.15598ZM6 5.5V6.25C7.76632 6.25 9.25 7.75043 9.25 9.66703H10H10.75C10.75 6.98037 8.65194 4.75 6 4.75V5.5ZM10 9.66703H9.25C9.25 13.5526 6.73722 16.7999 3.35408 17.7796L3.5627 18.5L3.77131 19.2204C7.81347 18.0499 10.75 14.2018 10.75 9.66703H10ZM3.5627 18.5L4.11528 19.0071C5.37165 17.638 6.25334 15.8969 6.59401 13.9616L5.85537 13.8316L5.11673 13.7016C4.82615 15.3523 4.07503 16.8325 3.01011 17.9929L3.5627 18.5ZM5.85537 13.8316L5.88299 13.0821C4.16985 13.019 2.75 11.5411 2.75 9.66703H2H1.25C1.25 12.2953 3.25661 14.4864 5.82775 14.5811L5.85537 13.8316ZM2 9.66703H2.75C2.75 8.44455 3.35857 7.38216 4.26088 6.77974L3.84443 6.15598L3.42799 5.53222C2.11165 6.41106 1.25 7.94004 1.25 9.66703H2ZM3.84443 6.15598L4.26071 6.77985C4.76496 6.44339 5.36087 6.25 6 6.25V5.5V4.75C5.05172 4.75 4.16804 5.03842 3.42816 5.53211L3.84443 6.15598Z" fill="currentColor"></path>
    `,
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
