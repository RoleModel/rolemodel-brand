// RoleModel's own icon set — the Streamline "black" line icons committed
// to the repo under icons/black and copied into docs/assets/icons/black so
// GitHub Pages can serve them. These are single-color silhouette SVGs, so
// the ticker renders each as a CSS mask (background: currentColor), letting
// them take the panel's color / brand accent instead of hard black.
//
// Only a curated, on-brand subset is surfaced here (craft, code, learning,
// process, growth). The full set lives alongside these files on disk.

const BRAND_ICON_BASE = "../assets/icons/black/";

const toItem = (file) => ({
  name: file.replace(/\.svg$/u, "").replaceAll(/[-_]/gu, " "),
  src: `${BRAND_ICON_BASE}${encodeURIComponent(file)}`,
});

export const BRAND_ICONS = [
  "search.svg",
  "target.svg",
  "compass.svg",
  "ruler.svg",
  "pen-tool.svg",
  "sketch.svg",
  "web-development.svg",
  "web-design.svg",
  "source-code.svg",
  "code.svg",
  "laptop-coding.svg",
  "developer.svg",
  "brain.svg",
  "head-with-brain.svg",
  "intelligent-person.svg",
  "workflow-cycle.svg",
  "infinity-loop.svg",
  "process.svg",
  "sprint-iteration.svg",
  "analytics.svg",
  "statistics-report.svg",
  "graph-report.svg",
  "sales-growth.svg",
  "increase.svg",
  "handshake.svg",
  "business-network.svg",
  "onboarding.svg",
  "study.svg",
  "podium.svg",
  "checklist.svg",
  "globe.svg",
  "paper-plane.svg",
  "coffee.svg",
].map(toItem);
