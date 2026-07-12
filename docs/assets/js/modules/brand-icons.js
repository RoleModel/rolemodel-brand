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
  "Search.svg",
  "Target.svg",
  "Compass.svg",
  "Ruler.svg",
  "Pen-Tool.svg",
  "Sketch.svg",
  "Web-Development.svg",
  "Web-Design.svg",
  "Source-Code.svg",
  "Code.svg",
  "Laptop-Coding.svg",
  "Developer.svg",
  "Brain.svg",
  "Head-With-Brain.svg",
  "Intelligent-Person.svg",
  "Workflow-Cycle.svg",
  "Infinity-Loop.svg",
  "Process.svg",
  "Sprint-Iteration.svg",
  "Analytics.svg",
  "Statistics-Report.svg",
  "Graph-Report.svg",
  "Sales-Growth.svg",
  "Increase.svg",
  "Handshake.svg",
  "Business-Network.svg",
  "Onboarding.svg",
  "Study.svg",
  "Podium.svg",
  "Checklist.svg",
  "Globe.svg",
  "Paper-Plane.svg",
  "Coffee.svg",
].map(toItem);
