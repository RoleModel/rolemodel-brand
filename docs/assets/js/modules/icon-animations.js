import { ICONS } from "./icons.js";

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

export const initIconAnimations = (tileIcon, slug) => {
  if (typeof gsap === "undefined" || PREFERS_REDUCED_MOTION) {
    return;
  }
  const svg = tileIcon.querySelector("svg");
  const entry = ICONS[slug] || null;

  // Hover triggers on the whole card (button), not just the icon.
  const hoverTarget = tileIcon.closest(".brand-card") || tileIcon;

  wireMorphTargets(svg, entry, hoverTarget);

  switch (slug) {
    case "color": {
      const [a, b, c] = [".color-a", ".color-b", ".color-c"].map((s) =>
        svg.querySelector(s)
      );
      const hover = gsap.timeline({
        defaults: { duration: 0.8, ease: "sine.inOut" },
        paused: true,
        repeat: -1,
        yoyo: true,
      });
      hover
        .to(a, { scale: 1.05, x: -6, y: -7 }, 0)
        .to(b, { scale: 1.05, x: 7, y: -4 }, 0)
        .to(c, { scale: 1.05, x: -3, y: 7 }, 0);
      hoverTarget.addEventListener("mouseenter", () => hover.play());
      hoverTarget.addEventListener("mouseleave", () => {
        hover.pause();
        gsap.to([a, b, c], {
          duration: 0.35,
          ease: "power2.out",
          scale: 1,
          x: 0,
          y: 0,
        });
      });
      break;
    }

    case "voice": {
      const mic = svg.querySelector(".mic");
      if (!mic) {
        return;
      }
      const hover = gsap.timeline({
        defaults: { duration: 0.4, ease: "sine.inOut" },
        paused: true,
        repeat: -1,
        yoyo: true,
      });
      hover.to(mic, { y: -1.5 });
      hoverTarget.addEventListener("mouseenter", () => hover.play());
      hoverTarget.addEventListener("mouseleave", () => {
        hover.pause();
        gsap.to(mic, { duration: 0.25, ease: "power2.out", y: 0 });
      });
      break;
    }

    case "imagery": {
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
      break;
    }

    case "icons": {
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
      break;
    }

    case "motion": {
      const traveler = svg.querySelector(".traveler");
      const curvePath = "M5 19C5 7 19 17 19 5";
      const handleLine1 = svg.querySelector(".handle-line-1");
      const handleLine2 = svg.querySelector(".handle-line-2");
      const handleDot1 = svg.querySelector(".handle-dot-1");
      const handleDot2 = svg.querySelector(".handle-dot-2");

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
      break;
    }

    case "visual-style": {
      const ring = svg.querySelector(".hex-ring");
      const core = svg.querySelector(".core");
      const ringSpin = gsap.to(ring, {
        duration: 3,
        ease: "none",
        paused: true,
        repeat: -1,
        rotation: 360,
        transformOrigin: "center",
      });
      const corePulse = gsap.to(core, {
        duration: 0.6,
        ease: "sine.inOut",
        opacity: 1,
        paused: true,
        repeat: -1,
        scale: 1.15,
        transformOrigin: "center",
        yoyo: true,
      });
      hoverTarget.addEventListener("mouseenter", () => {
        ringSpin.play();
        corePulse.play();
      });
      hoverTarget.addEventListener("mouseleave", () => {
        ringSpin.pause();
        corePulse.pause();
        gsap.to(ring, { duration: 0.3, ease: "power2.out", rotation: 0 });
        gsap.to(core, {
          duration: 0.3,
          ease: "power2.out",
          opacity: 0.9,
          scale: 1,
        });
      });
      break;
    }

    case "logo": {
      const img = tileIcon.querySelector("img");
      if (!img) {
        return;
      }
      const hover = gsap.to(img, {
        duration: 0.4,
        ease: "back.out(2)",
        filter: "brightness(1.1) drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
        paused: true,
        scale: 1.05,
        y: -4,
      });
      hoverTarget.addEventListener("mouseenter", () => hover.play());
      hoverTarget.addEventListener("mouseleave", () => hover.reverse());
      break;
    }

    case "typography": {
      // Animates the active brand's own variable font weight axis directly
      // (font-weight is a continuous number here, not a fixed static cut —
      // see the "wght@min..max" request in index.html).
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
      break;
    }

    default: {
      break;
    }
  }
};
