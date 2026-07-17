import assert from "node:assert/strict";
import { test } from "node:test";

import { parseMarkdown } from "./build-content.mjs";

test("parseMarkdown — body only, no frontmatter", () => {
  const { data, body } = parseMarkdown("Just a paragraph of text.\n");
  assert.deepEqual(data, {});
  assert.equal(body, "Just a paragraph of text.");
});

test("parseMarkdown — quoted and bare scalars", () => {
  const { data } = parseMarkdown(
    "---\nname: Humble Confidence\nslug: humble-confidence\n---\n"
  );
  assert.equal(data.name, "Humble Confidence");
  assert.equal(data.slug, "humble-confidence");
});

test("parseMarkdown — double-quoted string with escaped quotes", () => {
  const { data } = parseMarkdown(
    '---\nquote: "She said \\"hello\\" to me"\n---\n'
  );
  assert.equal(data.quote, 'She said "hello" to me');
});

test("parseMarkdown — single-quoted string with doubled-quote escaping (YAML style)", () => {
  const { data } = parseMarkdown("---\nquote: '\"don''t stop\"'\n---\n");
  assert.equal(data.quote, '"don\'t stop"');
});

test("parseMarkdown — list values", () => {
  const { data } = parseMarkdown(
    '---\npractice:\n  - "one"\n  - "two"\n  - "three"\n---\n'
  );
  assert.deepEqual(data.practice, ["one", "two", "three"]);
});

test("parseMarkdown — body preserved alongside frontmatter", () => {
  const { body } = parseMarkdown(
    "---\nname: Test\n---\n\nThe actual description text.\n"
  );
  assert.equal(body, "The actual description text.");
});

test("VOICE_CONCEPTS content round-trips through the real generator", async () => {
  const { build } = await import("./build-content.mjs");
  build();
  const { VOICE_CONCEPTS, TYPE_SCALE, EASING_TOKENS, DURATION_TOKENS } =
    await import("../assets/js/modules/page-data.js");
  assert.equal(VOICE_CONCEPTS.length, 4);
  assert.equal(VOICE_CONCEPTS[0].name, "Humble Confidence");
  assert.equal(TYPE_SCALE.length, 7);
  assert.equal(EASING_TOKENS.length, 2);
  assert.equal(DURATION_TOKENS.length, 3);
});

test("INTRO_HEADING content round-trips through the real generator", async () => {
  const { build } = await import("./build-content.mjs");
  build();
  const { INTRO_HEADING } =
    await import("../assets/js/modules/site-content.js");
  assert.equal(
    INTRO_HEADING,
    "Our brand guidelines help us craft an identity as intentional as the software we build."
  );
});

test("BRANDS content round-trips through the real generator", async () => {
  const { BRANDS, BRAND_ORDER, CATEGORIES } =
    await import("../assets/js/modules/brand-data.js");
  assert.deepEqual(BRAND_ORDER, ["rolemodel", "academy", "lightningcad"]);
  assert.equal(BRANDS.rolemodel.primary, "#3A70B3");
  assert.deepEqual(BRANDS.academy.sections, [
    "logo",
    "color",
    "imagery",
    "typography",
  ]);
  assert.deepEqual(BRANDS.lightningcad.sections, ["logo", "color"]);
  assert.equal(BRANDS.academy.gridRows, 2);
  assert.deepEqual(BRANDS.academy.sectionSpans, {
    imagery: 6,
    typography: 6,
  });
  assert.equal(BRANDS.lightningcad.gridRows, 1);
  assert.equal(BRANDS.lightningcad.subBrands.length, 5);
  assert.equal(
    BRANDS.lightningcad.subBrands.some(
      ({ name }) => name === "Building Designer" || name === "Flow Designer"
    ),
    false
  );
  assert.equal(
    BRANDS.lightningcad.subBrandZip,
    "https://github.com/RoleModel/rolemodel-brand/releases/latest/download/designer-product-logos.zip"
  );
  assert.equal(CATEGORIES.length, 8);
});
