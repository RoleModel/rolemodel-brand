#!/usr/bin/env node
// -----------------------------------------------------------------------
// CSS cache-buster — stamps content-hash ?v= versions onto every stylesheet
// URL so a GitHub Pages deploy is picked up immediately instead of being
// masked by the browser/CDN cache (Pages serves CSS with max-age=600).
//
// How it works (content hashes, so only changed files re-download):
//   1. Each @import in assets/css/index.css gets ?v=<hash of that file>.
//   2. index.css itself is then hashed (its @import URLs are now part of its
//      bytes) and that hash is stamped onto the <link href=".../index.css">
//      in every HTML page.
//   Change one leaf file -> its hash changes -> index.css changes -> its hash
//   changes -> the HTML link changes. The whole chain busts, nothing else does.
//
// Idempotent: existing ?v= values are stripped before re-stamping, so it is
// safe to run repeatedly. Run before committing CSS changes:
//   node docs/scripts/bust-css.mjs   (or: npm run css:version)
// -----------------------------------------------------------------------

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join(import.meta.dirname, "..");
const CSS_DIR = path.join(DOCS_DIR, "assets", "css");
const INDEX_CSS = path.join(CSS_DIR, "index.css");
const PAGES_DIR = path.join(DOCS_DIR, "pages");

const shortHash = (buf) =>
  createHash("sha1").update(buf).digest("hex").slice(0, 8);

const stripVersion = (url) => url.replace(/\?v=[^"')]*$/u, "");

const IMPORT_RE = /@import url\("(?<url>[^"]+?)"\)/gu;
const LINK_RE =
  /(?<pre>href=")(?<path>[^"]*?index\.css)(?:\?v=[^"]*)?(?<post>")/gu;

// Step 1: stamp each @import with the imported file's own content hash.
const stampImports = () => {
  const original = readFileSync(INDEX_CSS, "utf-8");
  const stamped = original.replace(IMPORT_RE, (_full, rawUrl) => {
    const cleanUrl = stripVersion(rawUrl);
    const filePath = path.resolve(CSS_DIR, cleanUrl);
    const version = shortHash(readFileSync(filePath));
    return `@import url("${cleanUrl}?v=${version}")`;
  });
  writeFileSync(INDEX_CSS, stamped);
  return stamped;
};

// Step 2: stamp the rewritten index.css hash onto every HTML <link>.
const stampHtmlLinks = (indexVersion) => {
  const htmlFiles = [
    path.join(DOCS_DIR, "index.html"),
    ...readdirSync(PAGES_DIR)
      .filter((name) => name.endsWith(".html"))
      .map((name) => path.join(PAGES_DIR, name)),
  ];
  let touched = 0;
  for (const file of htmlFiles) {
    const before = readFileSync(file, "utf-8");
    const after = before.replace(
      LINK_RE,
      (_full, pre, cssPath, post) => `${pre}${cssPath}?v=${indexVersion}${post}`
    );
    if (after !== before) {
      writeFileSync(file, after);
      touched += 1;
    }
  }
  return touched;
};

const stampedIndex = stampImports();
const indexVersion = shortHash(Buffer.from(stampedIndex));
const touched = stampHtmlLinks(indexVersion);

process.stdout.write(
  `CSS cache-busting stamped — index.css v=${indexVersion} (${touched} HTML file(s) updated)\n`
);
