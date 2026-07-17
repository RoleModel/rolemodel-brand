#!/usr/bin/env node
// -----------------------------------------------------------------------
// Content generator — reads docs/content/{config,prose}/** and regenerates
// the JS data modules under docs/assets/js/modules/. This is the ONLY
// script that should ever write those generated files; hand edits there
// get overwritten on the next run.
//
// Usage:
//   node docs/scripts/build-content.mjs           # build once
//   node docs/scripts/build-content.mjs --watch   # rebuild on change
// -----------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  watch,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join(import.meta.dirname, "..");
const REPO_DIR = path.join(DOCS_DIR, "..");
const CONTENT_DIR = path.join(DOCS_DIR, "content");
const CONFIG_DIR = path.join(CONTENT_DIR, "config");
const PROSE_DIR = path.join(CONTENT_DIR, "prose");
const MODULES_DIR = path.join(DOCS_DIR, "assets", "js", "modules");

const BRAND_ASSET_BASE_LITERAL =
  "https://raw.githubusercontent.com/RoleModel/rolemodel-brand/main";

const BANNER = `// GENERATED FILE — do not edit directly.
// Source: docs/content/** — edit there, then push. CI regenerates this file.
`;

// ---- Frontmatter parser -------------------------------------------------
// Deliberately minimal: every file this reads is hand-authored for this one
// purpose, so it only needs to support what our content actually uses —
// quoted/bare scalar values and simple "- item" lists. No nested maps, no
// multiline scalars, no CommonMark rendering of the body.

const parseScalar = (raw) => {
  const s = raw.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replaceAll('\\"', '"');
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replaceAll("''", "'");
  }
  if (s === "true") {
    return true;
  }
  if (s === "false") {
    return false;
  }
  return s;
};

export const parseMarkdown = (raw) => {
  const text = raw.replaceAll("\r\n", "\n");
  if (!text.startsWith("---\n")) {
    return { body: text.trim(), data: {} };
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("Unterminated frontmatter block");
  }
  const fmBlock = text.slice(4, end);
  const body = text
    .slice(end + 4)
    .replace(/^\n/u, "")
    .trim();

  const data = {};
  const lines = fmBlock.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }
    const m = line.match(/^(?<key>\w[\w-]*):\s*(?<rest>.*)$/u);
    if (!m) {
      continue;
    }
    const { key, rest } = m.groups;
    if (rest.trim() === "") {
      const items = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s/u.test(lines[j])) {
        items.push(parseScalar(lines[j].replace(/^\s+-\s/u, "")));
        j += 1;
      }
      data[key] = items;
      i = j - 1;
    } else {
      data[key] = parseScalar(rest);
    }
  }
  return { body, data };
};

// ---- File-system helpers -------------------------------------------------

const readJSON = (filePath) => JSON.parse(readFileSync(filePath, "utf-8"));

const readProseDir = (dir) => {
  const out = new Map();
  if (!existsSync(dir)) {
    return out;
  }
  for (const file of readdirSync(dir).toSorted()) {
    if (!file.endsWith(".md")) {
      continue;
    }
    const slug = file.replace(/\.md$/u, "");
    out.set(slug, parseMarkdown(readFileSync(path.join(dir, file), "utf-8")));
  }
  return out;
};

const requireField = (obj, key, context) => {
  if (obj[key] === undefined || obj[key] === "") {
    throw new Error(`Missing required field "${key}" for ${context}`);
  }
  return obj[key];
};

const raw = (text) => ({ __raw: text });
const assetUrl = (relPath) => raw(`\`\${BRAND_ASSET_BASE}/${relPath}\``);

// ---- Build BRANDS / BRAND_ORDER / CATEGORIES -----------------------------

const buildBrandData = () => {
  const brandOrder = readJSON(path.join(CONFIG_DIR, "brand-order.json"));
  const brandProse = readProseDir(path.join(PROSE_DIR, "brands"));

  const brands = {};
  for (const slug of brandOrder) {
    const config = readJSON(path.join(CONFIG_DIR, "brands", `${slug}.json`));
    const prose = brandProse.get(slug);
    if (!prose) {
      throw new Error(`Missing prose/brands/${slug}.md`);
    }
    const entry = {
      font: config.font,
      gridRows: config.gridRows ?? 3,
      heroColor: config.heroColor,
      icon: assetUrl(config.icon),
      logo: assetUrl(config.logo),
      logoWhite: assetUrl(config.logoWhite),
      name: config.name,
      palette: config.palette,
      primary: config.primary,
      sectionSpans: config.sectionSpans ?? {},
      sections: config.sections ?? null,
      tagline: prose.data.tagline ?? "",
      zip: config.zip,
    };
    if (config.subBrands) {
      entry.subBrands = config.subBrands.map((sb) => ({
        color: sb.color,
        logo: assetUrl(sb.logo),
        name: sb.name,
      }));
      entry.subBrandZip = config.subBrandZip ?? "";
    }
    brands[slug] = entry;
  }

  const categoriesConfig = readJSON(path.join(CONFIG_DIR, "categories.json"));
  const categoryProse = readProseDir(path.join(PROSE_DIR, "categories"));
  const categories = categoriesConfig.map(({ slug, span }) => {
    const prose = categoryProse.get(slug);
    if (!prose) {
      throw new Error(`Missing prose/categories/${slug}.md`);
    }
    return {
      name: requireField(prose.data, "name", `category "${slug}"`),
      slug,
      span,
      tagline: requireField(
        { tagline: prose.body },
        "tagline",
        `category "${slug}"`
      ),
    };
  });

  return { brandOrder, brands, categories };
};

// ---- Build PAGE_DATA -------------------------------------------------------

// Imagery sourcing is genuinely brand-specific (Framer CDN vs. repo-local
// files), same as it was in the hand-written file — this decides, per
// source kind, which shared top-level const a brand's imagery field points
// at, and collects the const declarations to emit once. `fieldName` lets
// this run for both the main `imagery` field (Imagery page) and the
// optional `visualStyleImagery` field (Visual Style page) — brands without
// the latter just get no entry, and the page falls back to `imagery`.
const buildImagery = (brandOrder, fieldName, constPrefix) => {
  const constants = [];
  const imageryRefs = {};

  for (const slug of brandOrder) {
    const config = readJSON(path.join(CONFIG_DIR, "page-data", `${slug}.json`));
    const img = config[fieldName];
    if (!img) {
      continue;
    }

    if (img.sharedWith) {
      const target = constants.find((c) => c.owner === img.sharedWith);
      if (!target) {
        throw new Error(
          `page-data/${slug}.json imagery.sharedWith "${img.sharedWith}" must be defined before it's referenced (brand order matters)`
        );
      }
      imageryRefs[slug] =
        target.kind === "repo"
          ? raw(
              `_repoImageEntries(${target.name}, ${JSON.stringify(target.dir)})`
            )
          : raw(`_imageEntries(${target.name})`);
      continue;
    }

    if (img.source === "repo") {
      const constName = `${slug.toUpperCase()}_${constPrefix}_FILES`;
      constants.push({
        dir: img.dir,
        files: img.files,
        kind: "repo",
        name: constName,
        owner: slug,
      });
      imageryRefs[slug] = raw(
        `_repoImageEntries(${constName}, ${JSON.stringify(img.dir)})`
      );
    } else {
      const constName = `${slug.toUpperCase()}_${constPrefix}`;
      constants.push({
        files: img.files,
        kind: "framer",
        name: constName,
        owner: slug,
      });
      imageryRefs[slug] = raw(`_imageEntries(${constName})`);
    }
  }

  return { constants, imageryRefs };
};

const buildPageData = (brandOrder) => {
  const main = buildImagery(brandOrder, "imagery", "IMAGERY");
  const visualStyle = buildImagery(
    brandOrder,
    "visualStyleImagery",
    "VISUAL_STYLE_IMAGERY"
  );
  const imageryConstants = [...main.constants, ...visualStyle.constants];
  const { imageryRefs } = main;
  const pageData = {};

  for (const slug of brandOrder) {
    const config = readJSON(path.join(CONFIG_DIR, "page-data", `${slug}.json`));
    const prose = readProseDir(path.join(PROSE_DIR, "page-data", slug));

    const fonts = config.fonts.map((f) => {
      const key = `font-${f.slug}`;
      const note = prose.get(key);
      if (!note) {
        throw new Error(`Missing prose/page-data/${slug}/${key}.md`);
      }
      return {
        googleUrl: f.googleUrl,
        name: f.name,
        note: requireField(note.data, "note", key),
        role: f.role,
        weights: f.weights,
      };
    });

    const logoRules = config.logoRules.map((r) => {
      const key = `logo-rule-${r.slug}`;
      const descEntry = prose.get(key);
      if (!descEntry) {
        throw new Error(`Missing prose/page-data/${slug}/${key}.md`);
      }
      return {
        desc: requireField(descEntry.data, "desc", key),
        label: r.label,
        value: r.value,
      };
    });

    const imageryIntroEntry = prose.get("imagery-intro");
    if (!imageryIntroEntry) {
      throw new Error(`Missing prose/page-data/${slug}/imagery-intro.md`);
    }

    const logos = config.logos.map((l) => ({
      bg: l.bg,
      label: l.label,
      pngHref: assetUrl(l.pngHref),
      src: assetUrl(l.src),
      svgHref: assetUrl(l.svgHref),
    }));

    pageData[slug] = {
      aseUrl: config.aseUrl,
      colors: config.colors,
      fonts,
      gridCols: config.gridCols,
      imagery: imageryRefs[slug],
      imageryIntro: imageryIntroEntry.body,
      logoRules,
      logos,
      zipUrl: config.zipUrl,
    };
    if (visualStyle.imageryRefs[slug]) {
      pageData[slug].visualStyleImagery = visualStyle.imageryRefs[slug];
    }
  }

  const typeScaleProse = readProseDir(path.join(PROSE_DIR, "type-scale"));
  const typeScale = readJSON(path.join(CONFIG_DIR, "type-scale.json")).map(
    (t) => {
      const p = typeScaleProse.get(t.slug);
      if (!p) {
        throw new Error(`Missing prose/type-scale/${t.slug}.md`);
      }
      const entry = {
        lh: t.lh,
        ls: t.ls,
        name: requireField(p.data, "name", `type-scale ${t.slug}`),
        sample: requireField(p.data, "sample", `type-scale ${t.slug}`),
        size: t.size,
        usage: requireField(p.data, "usage", `type-scale ${t.slug}`),
        weight: t.weight,
      };
      if (t.mono) {
        entry.mono = true;
      }
      return entry;
    }
  );

  const voiceConcepts = [
    ...readProseDir(path.join(PROSE_DIR, "voice-concepts")).values(),
  ].map((v) => ({
    description: requireField(
      { description: v.body },
      "description",
      "voice concept"
    ),
    name: requireField(v.data, "name", "voice concept"),
    practice: requireField(v.data, "practice", "voice concept"),
    quote: requireField(v.data, "quote", "voice concept"),
  }));

  const easingProse = readProseDir(path.join(PROSE_DIR, "tokens", "easing"));
  const easingTokens = readJSON(
    path.join(CONFIG_DIR, "easing-tokens.json")
  ).map((e) => {
    const p = easingProse.get(e.slug);
    if (!p) {
      throw new Error(`Missing prose/tokens/easing/${e.slug}.md`);
    }
    return {
      cssVar: e.cssVar,
      desc: requireField(p.data, "desc", `easing ${e.slug}`),
      name: requireField(p.data, "name", `easing ${e.slug}`),
      value: e.value,
    };
  });

  const durationProse = readProseDir(
    path.join(PROSE_DIR, "tokens", "duration")
  );
  const durationTokens = readJSON(
    path.join(CONFIG_DIR, "duration-tokens.json")
  ).map((d) => {
    const p = durationProse.get(d.slug);
    if (!p) {
      throw new Error(`Missing prose/tokens/duration/${d.slug}.md`);
    }
    return {
      cssVar: d.cssVar,
      name: requireField(p.data, "name", `duration ${d.slug}`),
      usage: requireField(p.data, "usage", `duration ${d.slug}`),
      value: d.value,
    };
  });

  return {
    durationTokens,
    easingTokens,
    imageryConstants,
    pageData,
    typeScale,
    voiceConcepts,
  };
};

// ---- Serialization --------------------------------------------------------
// A thin wrapper over JSON.stringify that understands our `raw()` escape
// hatch for template-literal / function-call values (asset URLs built from
// BRAND_ASSET_BASE, imagery helper calls) so they come out as real code
// instead of quoted strings. Object keys are emitted alphabetically to
// match the codebase's sort-keys lint rule.

const IDENT_RE = /^[A-Za-z_$][\w$]*$/u;

const serialize = (value, indent = 0) => {
  const pad = "  ".repeat(indent);
  const childPad = "  ".repeat(indent + 1);

  if (value && typeof value === "object" && "__raw" in value) {
    return value.__raw;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const items = value.map((v) => `${childPad}${serialize(v, indent + 1)}`);
    return `[\n${items.join(",\n")},\n${pad}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).toSorted();
    if (keys.length === 0) {
      return "{}";
    }
    const items = keys.map((k) => {
      const key = IDENT_RE.test(k) ? k : JSON.stringify(k);
      return `${childPad}${key}: ${serialize(value[k], indent + 1)}`;
    });
    return `{\n${items.join(",\n")},\n${pad}}`;
  }
  return JSON.stringify(value);
};

// ---- File emitters ----------------------------------------------------

const writeBrandData = ({ brandOrder, brands, categories }) => {
  const out = `${BANNER}
export const BRAND_ASSET_BASE = ${JSON.stringify(BRAND_ASSET_BASE_LITERAL)};

// Display order for the brand tiles / nav. Kept explicit so the BRANDS object
// can stay alphabetized (lint) without affecting the order the UI renders in.
export const BRAND_ORDER = ${serialize(brandOrder)};

export const BRANDS = ${serialize(brands)};

// Spans sum to 6 per row across 3 rows (6-col grid) — sized so no two
// adjacent rows read as uniform, matching an actual bento composition
// instead of a repeating checkerboard.
export const CATEGORIES = ${serialize(categories)};
`;
  writeFileSync(path.join(MODULES_DIR, "brand-data.js"), out);
};

const writePageData = ({
  durationTokens,
  easingTokens,
  imageryConstants,
  pageData,
  typeScale,
  voiceConcepts,
}) => {
  const constDecls = imageryConstants
    .map((c) => `const ${c.name} = ${serialize(c.files)};`)
    .join("\n\n");

  const out = `${BANNER}
// Extended brand data for individual pages.
// Augments brand-data.js (BRANDS + CATEGORIES) with named colors, CMYK,
// typography scale, voice concepts, logo file paths, etc.

import { BRAND_ASSET_BASE } from "./brand-data.js";

// Framer CMS image CDN (populated from the Brands collection; the portal spec
// sanctions framerusercontent as the hotlinkable distribution surface).
const _framerImg = (file, size) =>
  \`https://framerusercontent.com/images/\${file}\${size ? \`?scale-down-to=\${size}\` : ""}\`;

const _imageEntries = (files) =>
  files.map((file) => ({
    full: _framerImg(file, 2048),
    src: _framerImg(file, 1024),
  }));

const _repoImageEntries = (files, dir) =>
  files.map((file) => {
    const url = \`../assets/imagery/\${dir}/\${encodeURIComponent(file)}\`;
    return { full: url, src: url };
  });

${constDecls}

export const PAGE_DATA = ${serialize(pageData)};

// ---- Shared type scale (same across all brands) ----
export const TYPE_SCALE = ${serialize(typeScale)};

// ---- Voice concepts — sourced from the RoleModel Way + core values + approach ----
export const VOICE_CONCEPTS = ${serialize(voiceConcepts)};

// ---- Easing tokens ----
export const EASING_TOKENS = ${serialize(easingTokens)};

export const DURATION_TOKENS = ${serialize(durationTokens)};
`;
  writeFileSync(path.join(MODULES_DIR, "page-data.js"), out);
};

// ---- Build/write site-content.js (misc page-level arrays formerly
// hardcoded inline in motion.html, icons.html, visual-style.html,
// imagery.html, color.html, logo.html) --------------------------------

const mapWithProse = (configItems, proseDir, buildEntry) => {
  const prose = readProseDir(proseDir);
  return configItems.map((item) => {
    const p = prose.get(item.slug);
    if (!p) {
      throw new Error(`Missing ${proseDir}/${item.slug}.md`);
    }
    return buildEntry(item, p);
  });
};

const buildSiteContent = () => {
  const motionConfig = readJSON(path.join(CONFIG_DIR, "motion.json"));
  const motionPrinciples = [
    ...readProseDir(path.join(PROSE_DIR, "motion-principles")).values(),
  ].map((p) => ({
    desc: requireField({ desc: p.body }, "desc", "motion principle"),
    title: requireField(p.data, "title", "motion principle"),
  }));

  const iconPrinciples = [
    ...readProseDir(path.join(PROSE_DIR, "icon-principles")).values(),
  ].map((p) => ({
    mark: requireField(p.data, "mark", "icon principle"),
    text: requireField({ text: p.body }, "text", "icon principle"),
  }));

  const imageryConfig = readJSON(path.join(CONFIG_DIR, "imagery.json"));
  const imageryTreatments = [
    ...readProseDir(path.join(PROSE_DIR, "imagery-treatments")).values(),
  ].map((t) => ({
    label: requireField(t.data, "label", "imagery treatment"),
    text: requireField({ text: t.body }, "text", "imagery treatment"),
  }));

  const visualStylePrinciples = [
    ...readProseDir(path.join(PROSE_DIR, "visual-style-principles")).values(),
  ].map((p) => ({
    desc: requireField({ desc: p.body }, "desc", "visual-style principle"),
    title: requireField(p.data, "title", "visual-style principle"),
  }));

  const visualStyleConfig = readJSON(
    path.join(CONFIG_DIR, "visual-style.json")
  );
  const radii = mapWithProse(
    visualStyleConfig.radii,
    path.join(PROSE_DIR, "visual-style", "radii"),
    (r, p) => ({
      size: r.size,
      token: r.token,
      usage: requireField({ usage: p.body }, "usage", `radius ${r.slug}`),
    })
  );
  const shadows = mapWithProse(
    visualStyleConfig.shadows,
    path.join(PROSE_DIR, "visual-style", "shadows"),
    (s, p) => ({
      name: s.name,
      token: s.token,
      usage: requireField({ usage: p.body }, "usage", `shadow ${s.slug}`),
    })
  );
  const specs = mapWithProse(
    visualStyleConfig.specs,
    path.join(PROSE_DIR, "visual-style", "specs"),
    (s, p) => ({
      label: s.label,
      text: requireField({ text: p.body }, "text", `spec ${s.slug}`),
      token: s.token,
    })
  );

  const introProse = parseMarkdown(
    readFileSync(path.join(PROSE_DIR, "intro.md"), "utf-8")
  );
  const introHeading = requireField(
    { heading: introProse.body },
    "heading",
    "intro"
  );

  const uiStringsProse = parseMarkdown(
    readFileSync(path.join(PROSE_DIR, "ui-strings.md"), "utf-8")
  );
  const uiStrings = {
    subBrandFamilyNote: requireField(
      uiStringsProse.data,
      "subBrandFamilyNote",
      "ui-strings"
    ),
    subpaletteNote: requireField(
      uiStringsProse.data,
      "subpaletteNote",
      "ui-strings"
    ),
  };

  return {
    cycleWords: motionConfig.cycleWords,
    iconPrinciples,
    imageryTreatments,
    introHeading,
    mosaicSpans: imageryConfig.mosaicSpans,
    motionPrinciples,
    radii,
    shadows,
    specs,
    uiStrings,
    visualStylePrinciples,
  };
};

const writeSiteContent = (data) => {
  const out = `${BANNER}
// Misc content that used to be hardcoded inline in individual pages'
// <script> blocks — motion/icon/visual-style principles, imagery
// treatments, and a couple of one-off UI strings.

export const INTRO_HEADING = ${serialize(data.introHeading)};

export const CYCLE_WORDS = ${serialize(data.cycleWords)};

export const MOTION_PRINCIPLES = ${serialize(data.motionPrinciples)};

export const ICON_PRINCIPLES = ${serialize(data.iconPrinciples)};

export const MOSAIC_SPANS = ${serialize(data.mosaicSpans)};

export const IMAGERY_TREATMENTS = ${serialize(data.imageryTreatments)};

export const VISUAL_STYLE_PRINCIPLES = ${serialize(data.visualStylePrinciples)};

export const RADII = ${serialize(data.radii)};

export const SHADOWS = ${serialize(data.shadows)};

export const SPECS = ${serialize(data.specs)};

export const UI_STRINGS = ${serialize(data.uiStrings)};
`;
  writeFileSync(path.join(MODULES_DIR, "site-content.js"), out);
};

// ---- Main -----------------------------------------------------------------

export const build = () => {
  const { brandOrder, brands, categories } = buildBrandData();
  writeBrandData({ brandOrder, brands, categories });

  const pageDataResult = buildPageData(brandOrder);
  writePageData(pageDataResult);

  writeSiteContent(buildSiteContent());
};

const main = () => {
  build();
  execFileSync("npm", ["run", "fix"], { cwd: REPO_DIR, stdio: "inherit" });
  console.log("content:build — done");
};

const isWatch = process.argv.includes("--watch");
const isMain = process.argv[1] === import.meta.filename;

if (isMain && isWatch) {
  main();
  console.log("Watching docs/content/ for changes...");
  let timer = null;
  watch(CONTENT_DIR, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        main();
      } catch (error) {
        console.error(error.message);
      }
    }, 150);
  });
} else if (isMain) {
  main();
}
