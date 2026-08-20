#!/usr/bin/env node
// -----------------------------------------------------------------------
// Logo export — copies the curated logo set out to a consumer (today: the
// `rolemodel-brand` skill in the `standard` repo) and writes the markdown
// index that lets an agent find the right file without listing a directory.
//
// The set is not hand-listed here. It is derived from
// docs/content/config/brands/*.json — the same config that drives the
// guidelines site — so a brand or sub-brand added there is exported here
// automatically, and nothing can be exported that the site doesn't know
// about. Labels come from docs/content/config/page-data/*.json where a
// brand defines them.
//
// Usage:
//   node scripts/export-logos.mjs --dest <dir>   # copy + write README.md
//   node scripts/export-logos.mjs --dest <dir> --check   # verify only
//
// --check exits non-zero when the destination has drifted, so it can gate
// a commit or CI run without writing anything.
// -----------------------------------------------------------------------

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { parseMarkdown } from "../docs/scripts/build-content.mjs";

const REPO_DIR = path.join(import.meta.dirname, "..");
const CONFIG_DIR = path.join(REPO_DIR, "docs", "content", "config");
const PROSE_DIR = path.join(REPO_DIR, "docs", "content", "prose");
const DEFAULT_DEST = path.join(
  REPO_DIR,
  "..",
  "standard",
  "skills",
  "rolemodel-brand",
  "assets",
  "logos"
);

const readJSON = (filePath) => JSON.parse(readFileSync(filePath, "utf-8"));

// ---- Which files make up the export ---------------------------------------

// A brand contributes its wordmark, its reversed wordmark, and its icon; a
// sub-brand contributes its wordmark and reversed wordmark. Anything the
// config omits (Compass had no white cut for a while) is simply skipped —
// a missing optional variant is not an error, a missing declared file is.
const VARIANTS = [
  { key: "logo", usage: "Light backgrounds" },
  { key: "logoWhite", usage: "Dark or photographic backgrounds" },
  { key: "icon", usage: "Square / constrained space" },
];

const collectEntries = () => {
  const brandOrder = readJSON(path.join(CONFIG_DIR, "brand-order.json"));
  const entries = [];

  for (const slug of brandOrder) {
    const brand = readJSON(path.join(CONFIG_DIR, "brands", `${slug}.json`));

    for (const { key, usage } of VARIANTS) {
      if (brand[key]) {
        entries.push({
          brand: brand.name,
          brandSlug: slug,
          group: slug,
          name: brand.name,
          source: brand[key],
          usage,
        });
      }
    }

    for (const sub of brand.subBrands ?? []) {
      for (const { key, usage } of VARIANTS) {
        if (sub[key]) {
          entries.push({
            brand: brand.name,
            brandSlug: slug,
            color: sub.color,
            // Sub-brands get their own folder rather than their parent's:
            // an agent looking for the Standard mark looks under standard/,
            // not under rolemodel/ alongside RoleModel's own wordmark.
            group: sub.slug,
            name: sub.name,
            source: sub[key],
            usage,
          });
        }
      }
    }
  }

  return entries;
};

// <group>/<basename> — group is the brand slug for a brand's own marks and
// the sub-brand slug for a product's, so the destination mirrors how the
// marks are actually referred to rather than this repo's folder names.
const destPathFor = (entry) =>
  path.join(entry.group, path.basename(entry.source));

// ---- Markdown index --------------------------------------------------------

// A brand only gets a family section if its prose actually declares one
// (familyNote in prose/brands/<slug>.md). Without that gate every brand with
// sub-brands would claim the Almanac/Compass/Standard family rule, which is
// wrong — the Designer products are a different family under LightningCAD.
const familyNoteFor = (slug) => {
  const file = path.join(PROSE_DIR, "brands", `${slug}.md`);
  if (!existsSync(file)) {
    return "";
  }
  return parseMarkdown(readFileSync(file, "utf-8")).data.familyNote ?? "";
};

const buildReadme = (entries, sourceRef) => {
  // One section per brand, sub-brands listed under the brand they belong to.
  const byBrand = new Map();
  for (const entry of entries) {
    if (!byBrand.has(entry.brandSlug)) {
      byBrand.set(entry.brandSlug, []);
    }
    byBrand.get(entry.brandSlug).push(entry);
  }

  const sections = [...byBrand.values()].map((brandEntries) => {
    const rows = brandEntries
      .map(
        (e) =>
          `| ${e.name} | ${e.usage} | \`${destPathFor(e).split(path.sep).join("/")}\` |`
      )
      .join("\n");
    return `### ${brandEntries[0].brand}\n\n| Product | Use for | File |\n|---|---|---|\n${rows}`;
  });

  const familySections = [...byBrand.entries()]
    .map(([slug, brandEntries]) => {
      const note = familyNoteFor(slug);
      const members = [
        ...new Map(
          brandEntries.filter((e) => e.color).map((e) => [e.name, e])
        ).values(),
      ];
      if (!(note && members.length)) {
        return "";
      }
      const rows = members
        .map((e) => `| ${e.name} | \`${e.color}\` |`)
        .join("\n");
      return `## ${brandEntries[0].brand} Product Family\n\n${note}\n\n| Product | Signature color |\n|---|---|\n${rows}`;
    })
    .filter(Boolean);

  return `# RoleModel Logos

Logo source files for RoleModel and its products.

**Generated — do not edit.** These files are copied out of
[RoleModel/rolemodel-brand](https://github.com/RoleModel/rolemodel-brand) by
\`scripts/export-logos.mjs\`. Edits here are overwritten on the next export.
To change a mark, change it in \`rolemodel-brand\`.

Exported from \`rolemodel-brand\` @ \`${sourceRef}\`.

## Choosing A File

Prefer SVG everywhere. Use the white variant on dark or photographic
backgrounds, never the color mark. Use the icon only where a square or
constrained space makes the wordmark illegible.

${sections.join("\n\n")}

${familySections.join("\n\n")}
`;
};

// ---- Run -------------------------------------------------------------------

const parseArgs = () => {
  const args = process.argv.slice(2);
  const destIndex = args.indexOf("--dest");
  return {
    check: args.includes("--check"),
    dest: destIndex === -1 ? DEFAULT_DEST : path.resolve(args[destIndex + 1]),
  };
};

const listFiles = (dir, prefix = "") => {
  if (!existsSync(dir)) {
    return [];
  }
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      out.push(...listFiles(path.join(dir, item.name), rel));
    } else {
      out.push(rel);
    }
  }
  return out;
};

export const exportLogos = ({ check = false, dest = DEFAULT_DEST } = {}) => {
  const entries = collectEntries();

  const missing = entries.filter(
    (e) => !existsSync(path.join(REPO_DIR, e.source))
  );
  if (missing.length > 0) {
    throw new Error(
      `Config references files that do not exist:\n${missing.map((m) => `  ${m.source} (${m.name})`).join("\n")}`
    );
  }

  const sourceRef = process.env.SOURCE_REF ?? "main";
  const readme = buildReadme(entries, sourceRef);
  const expected = new Set([
    "README.md",
    ...entries.map((e) => destPathFor(e).split(path.sep).join("/")),
  ]);

  if (check) {
    const actual = new Set(listFiles(dest));
    const problems = [
      ...[...expected]
        .filter((f) => !actual.has(f))
        .map((f) => `missing: ${f}`),
      ...[...actual].filter((f) => !expected.has(f)).map((f) => `extra: ${f}`),
      ...entries
        .filter((e) => {
          const target = path.join(dest, destPathFor(e));
          return (
            existsSync(target) &&
            !readFileSync(target).equals(
              readFileSync(path.join(REPO_DIR, e.source))
            )
          );
        })
        .map((e) => `differs: ${destPathFor(e)}`),
    ];
    return { entries, problems };
  }

  // Rebuild the tree so a logo removed from the config disappears from the
  // destination too, instead of lingering as an orphan nobody notices.
  rmSync(dest, { force: true, recursive: true });
  for (const entry of entries) {
    const target = path.join(dest, destPathFor(entry));
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.join(REPO_DIR, entry.source), target);
  }
  writeFileSync(path.join(dest, "README.md"), readme);

  return { entries, problems: [] };
};

const isMain = process.argv[1] === import.meta.filename;
if (isMain) {
  const { check, dest } = parseArgs();
  const { entries, problems } = exportLogos({ check, dest });

  if (check) {
    if (problems.length > 0) {
      console.error(
        `Logo export is out of date (${problems.length} problems):`
      );
      for (const problem of problems) {
        console.error(`  ${problem}`);
      }
      process.exit(1);
    }
    console.log(`Logo export is current — ${entries.length} files in ${dest}`);
  } else {
    console.log(`Exported ${entries.length} logos + README.md to ${dest}`);
  }
}
