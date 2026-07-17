import { ICONS } from "./icons.js?v=0271783e";

// Icon motion, powered by GSAP (+ MorphSVGPlugin for real shape morphs).
// Nothing animates at rest — every icon starts static and its motion is
// initiated by mouseenter, reverting cleanly on mouseleave. Includes
// literal path morphs where it fits the category (Motion's curve, Visual
// Style's hexagon, Icons' square, Voice's bubble, Imagery's hills).

if (typeof gsap !== "undefined" && typeof MorphSVGPlugin !== "undefined") {
  gsap.registerPlugin(MorphSVGPlugin);
}

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Shared hover-morph wiring for any icon with declared morph targets.
// Already hover-initiated only — no change needed here.
const wireMorphTargets = (svg, entry, hoverTarget) => {
  if (!(entry && entry.morphTargets)) {
    return;
  }
  for (const [selector, targetPath] of Object.entries(entry.morphTargets)) {
    const el = svg && svg.querySelector(selector);
    if (!el) {
      continue;
    }
    const originalPath = el.getAttribute("d");
    hoverTarget.addEventListener("mouseenter", () => {
      gsap.to(el, {
        duration: 0.6,
        ease: "elastic.out(1, 0.6)",
        morphSVG: targetPath,
      });
    });
    hoverTarget.addEventListener("mouseleave", () => {
      gsap.to(el, {
        duration: 0.5,
        ease: "power2.out",
        morphSVG: originalPath,
      });
    });
  }
};

// Palette paint wells start swung off the icon — rotated about a pivot well
// below the viewBox (12,40), which pushes them outside it so the svg clips
// them at rest (overflow:hidden on [data-icon="color"], brand-card.css). On
// hover each well rotates up its arc and drops into place with a staggered,
// springy landing; mouseleave swings them back.
const wireColorIcon = (svg, hoverTarget) => {
  const wells = svg.querySelectorAll(".hole, .hole2, .hole3");
  if (!wells.length) {
    return;
  }
  const pivot = "12 40";
  gsap.set(wells, { rotation: -62, svgOrigin: pivot });
  const hover = gsap.timeline({ paused: true });
  hover.to(wells, {
    duration: 0.6,
    ease: "back.out(1.7)",
    rotation: 0,
    stagger: 0.09,
    svgOrigin: pivot,
  });
  hoverTarget.addEventListener("mouseenter", () => hover.play());
  hoverTarget.addEventListener("mouseleave", () => hover.reverse());
};

// Two filled quote glyphs. drawSVG is intentionally NOT used: that plugin
// isn't loaded (index.html ships gsap + MorphSVG/MotionPath/Flip only) and it
// animates a stroke dash, which does nothing on these fill-only paths. Instead
// the pair "speaks" on hover — a staggered pop + lift, like a line of dialogue
// landing — and settles back on leave. Core GSAP, no plugin.
const wireVoiceIcon = (svg, hoverTarget) => {
  const quote1 = svg.querySelectorAll(".quote");
  const quote2 = svg.querySelectorAll(".quote2");

  const hoverTimeline = gsap.timeline({ paused: true });
  hoverTimeline.to(quote1, {
    duration: 0.35,
    scale: 1.12,
    transformOrigin: "100% 50%",
    x: 1,
  });
  hoverTimeline.to(
    quote2,
    {
      duration: 0.35,
      scale: 1.12,
      transformOrigin: "50% 50%",
      x: -15,
    },
    "<"
  );
  hoverTarget.addEventListener("mouseenter", () => hoverTimeline.play());
  hoverTarget.addEventListener("mouseleave", () => hoverTimeline.reverse());
};

const wireAcademyIcon = (svg, hoverTarget) => {
  const line1 = svg.querySelector(".line-1");
  const line2 = svg.querySelector(".line-2");
  const line3 = svg.querySelector(".line-3");
  if (!line1 || !line2 || !line3) {
    return;
  }
  const hover = gsap.timeline({
    defaults: { duration: 0.4, ease: "sine.inOut" },
    paused: true,
    repeat: -1,
    yoyo: true,
  });
  hover.to(line1, { y: -1.5 });
  hover.to(line2, { y: -1.5 }, 0);
  hover.to(line3, { y: -1.5 }, 0);
  hoverTarget.addEventListener("mouseenter", () => hover.play());
  hoverTarget.addEventListener("mouseleave", () => {
    hover.pause();
    gsap.to([line1, line2, line3], {
      duration: 0.25,
      ease: "power2.out",
      y: 0,
    });
  });
};

const wireImageryIcon = (svg, hoverTarget) => {
  const sun = svg.querySelector(".sun");
  hoverTarget.addEventListener("mouseenter", () => {
    gsap.to(sun, {
      duration: 0.6,
      ease: "back.out(2)",
      scale: 1.5,
      x: 2,
      y: -5,
    });
  });
  hoverTarget.addEventListener("mouseleave", () => {
    gsap.to(sun, {
      duration: 0.4,
      ease: "power2.out",
      scale: 1,
      x: 0,
      y: 0,
    });
  });
};

const wireIconsIcon = (svg, hoverTarget) => {
  const circle = svg.querySelector(".shape-circle");
  const square = svg.querySelector(".shape-square");
  const triangle = svg.querySelector(".shape-triangle");
  hoverTarget.addEventListener("mouseenter", () => {
    gsap.to(circle, {
      duration: 0.5,
      ease: "back.out(2)",
      scale: 1.1,
      transformOrigin: "16px 8px",
      x: 2,
      y: -2,
    });
    gsap.to(square, {
      duration: 0.3,
      ease: "back.out(2)",
      rotation: 8,
      scale: 1.2,
      strokeWidth: 2,
      transformOrigin: "0px 0px",
      x: -2,
      y: 2,
    });
    gsap.to(triangle, {
      delay: 0.05,
      duration: 0.5,
      ease: "back.out(2)",
      rotation: 8,
      transformOrigin: "12px 16px",
      y: 3,
    });
  });
  hoverTarget.addEventListener("mouseleave", () => {
    gsap.to([circle, triangle, square], {
      duration: 0.4,
      ease: "power2.out",
      rotation: 0,
      scale: 1,
      strokeWidth: 1,
      x: 0,
      y: 0,
    });
  });
};

// Motion icon: a traveler dot runs a bouncy bezier while its handles swing
// out to the curve's control points on hover, snapping back on leave.
const wireMotionIcon = (svg, hoverTarget) => {
  const traveler = svg.querySelector(".traveler");
  const curvePath = "M5 19C5 7 19 17 19 5";
  const handleLine1 = svg.querySelector(".handle-line-1");
  const handleLine2 = svg.querySelector(".handle-line-2");
  const handleDot1 = svg.querySelector(".handle-dot-1");
  const handleDot2 = svg.querySelector(".handle-dot-2");

  // The current motion icon (icons.js) is a single morphing `.curve` path —
  // the traveler-dot + control-handle rig this function drives isn't in that
  // markup. Bail before wiring anything so GSAP is never handed a null target;
  // the hover animation is the `.curve` morph wired by wireMorphTargets.
  if (!handleLine1 || !handleLine2 || !handleDot1 || !handleDot2) {
    return;
  }

  let travel = null;
  if (traveler && typeof MotionPathPlugin !== "undefined") {
    gsap.registerPlugin(MotionPathPlugin);
    // The <circle> has no cx/cy, so until the tween renders it sits at
    // the viewBox origin — park it on the curve's start anchor (5,19).
    gsap.set(traveler, { x: 5, y: 19 });
    travel = gsap.to(traveler, {
      duration: 1.3,
      ease: "sine.inOut",
      motionPath: { autoRotate: false, path: curvePath },
      paused: true,
      repeat: -1,
      yoyo: true,
    });
  }

  // Handles swing from their resting position to the bouncy curve's
  // control points, in step with the .curve morph above.
  hoverTarget.addEventListener("mouseenter", () => {
    if (travel) {
      travel.restart();
      gsap.to(traveler, { duration: 0.2, opacity: 1 });
    }
    gsap.to(handleLine1, {
      attr: { x2: 4, y2: 0 },
      duration: 0.6,
      ease: "elastic.out(1, 0.6)",
    });
    gsap.to(handleDot1, {
      attr: { cx: 4, cy: 0 },
      duration: 0.6,
      ease: "elastic.out(1, 0.6)",
    });
    gsap.to(handleLine2, {
      attr: { x2: 19, y2: 22 },
      duration: 0.6,
      ease: "elastic.out(1, 0.6)",
    });
    gsap.to(handleDot2, {
      attr: { cx: 19, cy: 22 },
      duration: 0.6,
      ease: "elastic.out(1, 0.6)",
    });
  });
  hoverTarget.addEventListener("mouseleave", () => {
    if (travel) {
      travel.pause();
      // Fade out and reset to the start anchor; the next hover restarts
      // the path tween from 0, so it picks up exactly from there.
      gsap.to(traveler, {
        duration: 0.3,
        onComplete: () => gsap.set(traveler, { x: 5, y: 19 }),
        opacity: 0,
      });
    }
    gsap.to(handleLine1, {
      attr: { x2: 5, y2: 7 },
      duration: 0.5,
      ease: "power2.out",
    });
    gsap.to(handleDot1, {
      attr: { cx: 5, cy: 7 },
      duration: 0.5,
      ease: "power2.out",
    });
    gsap.to(handleLine2, {
      attr: { x2: 19, y2: 17 },
      duration: 0.5,
      ease: "power2.out",
    });
    gsap.to(handleDot2, {
      attr: { cx: 19, cy: 17 },
      duration: 0.5,
      ease: "power2.out",
    });
  });
};

// The shape itself morphs (hex-ring → star) via wireMorphTargets. Here we add
// a slow spin to the ring and a pulse to the core — but only for the elements
// that actually exist in the current markup (there is no .core), so GSAP never
// receives a null target.
const wireVisualStyleIcon = (svg, hoverTarget) => {
  const ring = svg.querySelector(".hex-ring");
  const core = svg.querySelector(".core");
  const ringSpin = ring
    ? gsap.to(ring, {
        duration: 3,
        ease: "none",
        paused: true,
        repeat: -1,
        rotation: 360,
        transformOrigin: "center",
      })
    : null;
  const corePulse = core
    ? gsap.to(core, {
        duration: 0.6,
        ease: "sine.inOut",
        opacity: 1,
        paused: true,
        repeat: -1,
        scale: 1.15,
        transformOrigin: "center",
        yoyo: true,
      })
    : null;
  hoverTarget.addEventListener("mouseenter", () => {
    ringSpin?.play();
    corePulse?.play();
  });
  hoverTarget.addEventListener("mouseleave", () => {
    ringSpin?.pause();
    corePulse?.pause();
    if (ring) {
      gsap.to(ring, { duration: 0.3, ease: "power2.out", rotation: 0 });
    }
    if (core) {
      gsap.to(core, {
        duration: 0.3,
        ease: "power2.out",
        opacity: 0.9,
        scale: 1,
      });
    }
  });
};

// Transform only — animating `filter` on an <img src="*.svg"> causes a black
// flash in Chrome/Safari while the filtered raster re-decodes.
const wireLogoIcon = (svg, hoverTarget, tileIcon) => {
  const img = tileIcon.querySelector("img");
  if (!img) {
    return;
  }
  const hover = gsap.to(img, {
    duration: 0.4,
    ease: "back.out(2)",
    paused: true,
    scale: 1.05,
    y: -4,
  });
  hoverTarget.addEventListener("mouseenter", () => hover.play());
  hoverTarget.addEventListener("mouseleave", () => hover.reverse());
};

// Animates the active brand's own variable font weight axis directly
// (font-weight is a continuous number here, not a fixed static cut — see the
// "wght@min..max" request in index.html).
const wireTypographyIcon = (svg, hoverTarget, tileIcon) => {
  const glyph = tileIcon.querySelector(".brand-card__glyph");
  if (!glyph) {
    return;
  }
  gsap.set(glyph, { fontWeight: 400 });
  const hover = gsap.to(glyph, {
    duration: 0.5,
    ease: "power2.out",
    fontWeight: 700,
    paused: true,
  });
  hoverTarget.addEventListener("mouseenter", () => hover.play());
  hoverTarget.addEventListener("mouseleave", () => hover.reverse());
};

// Per-slug dispatch. Each wirer takes (svg, hoverTarget, tileIcon) and reads
// only what it needs; keeps initIconAnimations flat and under the complexity
// cap as icons are added.
const ICON_WIRERS = {
  academy: wireAcademyIcon,
  color: wireColorIcon,
  icons: wireIconsIcon,
  imagery: wireImageryIcon,
  logo: wireLogoIcon,
  motion: wireMotionIcon,
  typography: wireTypographyIcon,
  "visual-style": wireVisualStyleIcon,
  voice: wireVoiceIcon,
};

export const initIconAnimations = (tileIcon, slug) => {
  if (typeof gsap === "undefined" || PREFERS_REDUCED_MOTION) {
    return;
  }
  const svg = tileIcon.querySelector("svg");
  const entry = ICONS[slug] || null;

  // Hover triggers on the whole card (button), not just the icon.
  const hoverTarget = tileIcon.closest(".brand-card") || tileIcon;

  wireMorphTargets(svg, entry, hoverTarget);

  const wire = ICON_WIRERS[slug];
  if (wire) {
    wire(svg, hoverTarget, tileIcon);
  }
};
