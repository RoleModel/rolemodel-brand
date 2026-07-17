#!/usr/bin/env node
// -----------------------------------------------------------------------
// Cache-buster — stamps content-hash ?v= versions onto the CSS and JS that
// HTML pages reference, so a GitHub Pages deploy is picked up immediately
// instead of being masked by the browser/CDN cache (Pages serves assets with
// max-age=600).
//
// CSS (content hashes, so only changed files re-download):
//   1. Each @import in assets/css/index.css gets ?v=<hash of that file>.
//   2. index.css itself is hashed and that hash is stamped onto the
//      <link href=".../index.css"> in every HTML page.
//
// JS: a single hash over the whole assets/js module graph is stamped onto the
//   HTML entry point and every relative JS import. Any JS change therefore
//   invalidates both one-page.js and its imported data/components instead of
//   allowing a stale nested module to survive the entry-point refresh.
//
// Idempotent: existing ?v= values are stripped before re-stamping. Run before
// committing CSS/JS changes:  node docs/scripts/bust-cache.mjs  (npm run cache:bust)
// -----------------------------------------------------------------------

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join(import.meta.dirname, "..");
const CSS_DIR = path.join(DOCS_DIR, "assets", "css");
const JS_DIR = path.join(DOCS_DIR, "assets", "js");
const INDEX_CSS = path.join(CSS_DIR, "index.css");
const PAGES_DIR = path.join(DOCS_DIR, "pages");

const shortHash = (buf) =>
  createHash("sha1").update(buf).digest("hex").slice(0, 8);

const stripVersion = (url) => url.replace(/\?v=[^"')]*$/u, "");

const IMPORT_RE = /@import url\("(?<url>[^"]+?)"\)/gu;
const LINK_RE =
  /(?<pre>href=")(?<path>[^"]*?index\.css)(?:\?v=[^"]*)?(?<post>")/gu;
const ENTRY_JS_RE =
  /(?<pre>src=")(?<path>[^"]*?(?:main|one-page)\.js)(?:\?v=[^"]*)?(?<post>")/gu;
const JS_IMPORT_RE =
  /(?<pre>(?:from\s+|import\s+)["'])(?<path>\.{1,2}\/[^"']+?\.js)(?:\?v=[^"']*)?(?<post>["'])/gu;

const listFilesDeep = (dir) => {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      found.push(...listFilesDeep(full));
    } else {
      found.push(full);
    }
  }
  return found.toSorted();
};

// CSS step 1: stamp each @import with the imported file's own content hash,
// then return the hash of the rewritten index.css for the HTML <link>.
const stampCssImports = () => {
  const original = readFileSync(INDEX_CSS, "utf-8");
  const stamped = original.replace(IMPORT_RE, (_full, rawUrl) => {
    const cleanUrl = stripVersion(rawUrl);
    const version = shortHash(readFileSync(path.resolve(CSS_DIR, cleanUrl)));
    return `@import url("${cleanUrl}?v=${version}")`;
  });
  writeFileSync(INDEX_CSS, stamped);
  return shortHash(Buffer.from(stamped));
};

// Normalize existing versions before hashing so repeated runs are stable, then
// stamp the resulting graph version onto every relative module edge.
const stampJsGraph = () => {
  const jsFiles = listFilesDeep(JS_DIR).filter((file) => file.endsWith(".js"));
  const normalized = jsFiles.map((file) => {
    const source = readFileSync(file, "utf-8");
    return source.replace(
      JS_IMPORT_RE,
      (_full, pre, importPath, post) => `${pre}${importPath}${post}`
    );
  });
  const version = shortHash(Buffer.from(normalized.join("\n")));

  for (const [index, file] of jsFiles.entries()) {
    const stamped = normalized[index].replace(
      JS_IMPORT_RE,
      (_full, pre, importPath, post) =>
        `${pre}${importPath}?v=${version}${post}`
    );
    writeFileSync(file, stamped);
  }
  return version;
};

const stampHtml = (cssVersion, jsVersion) => {
  const htmlFiles = [
    path.join(DOCS_DIR, "index.html"),
    ...readdirSync(PAGES_DIR)
      .filter((name) => name.endsWith(".html"))
      .map((name) => path.join(PAGES_DIR, name)),
  ];
  let touched = 0;
  for (const file of htmlFiles) {
    const before = readFileSync(file, "utf-8");
    const after = before
      .replace(
        LINK_RE,
        (_full, pre, cssPath, post) => `${pre}${cssPath}?v=${cssVersion}${post}`
      )
      .replace(
        ENTRY_JS_RE,
        (_full, pre, jsPath, post) => `${pre}${jsPath}?v=${jsVersion}${post}`
      );
    if (after !== before) {
      writeFileSync(file, after);
      touched += 1;
    }
  }
  return touched;
};

const cssVersion = stampCssImports();
const jsVersion = stampJsGraph();
const touched = stampHtml(cssVersion, jsVersion);

process.stdout.write(
  `Cache-busting stamped — css v=${cssVersion}, js v=${jsVersion} (${touched} HTML file(s) updated)\n`
);
