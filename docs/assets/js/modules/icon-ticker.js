// Seamless marquee row of icons — the ticker duplicates its content once
// and animates the track by -50%, so the loop never shows a seam
// (see css/pages/icons.css for the animation). Pauses on hover; reduced
// motion disables the animation entirely in CSS.
//
// Each icon is either inline SVG ({ svg }) or a single-color file rendered
// as a CSS mask ({ src }) so it inherits the panel's color.

// Inline SVG icons render their markup inside the item; single-color file
// icons ({ src }) are painted as a mask on the item box itself (which has a
// fixed size), so they inherit the panel color. The mask is set in JS —
// url() in a CSS custom property resolves relative to the stylesheet, but
// here we want it relative to the page, like every other asset.
const buildItem = (icon) => {
  const item = document.createElement("span");
  item.className = "icon-ticker__item";
  item.title = icon.name;

  if (icon.svg) {
    item.setHTMLUnsafe(icon.svg);
    return item;
  }

  item.classList.add("icon-ticker__item--mask");
  const maskValue = `url("${icon.src}") center / contain no-repeat`;
  item.style.webkitMask = maskValue;
  item.style.mask = maskValue;
  return item;
};

export const createIconTicker = ({
  icons,
  size = "md",
  direction = "left",
  duration = 40,
}) => {
  const buildGroup = () => {
    const group = document.createElement("div");
    group.className = "icon-ticker__group";
    for (const icon of icons) {
      group.append(buildItem(icon));
    }
    return group;
  };

  const track = document.createElement("div");
  track.className = "icon-ticker__track";
  const original = buildGroup();
  const clone = buildGroup();
  clone.setAttribute("aria-hidden", "true");
  track.append(original, clone);

  const ticker = document.createElement("div");
  ticker.className = `icon-ticker icon-ticker--${size} icon-ticker--${direction}`;
  ticker.style.setProperty("--ticker-duration", `${duration}s`);
  ticker.append(track);
  return ticker;
};
