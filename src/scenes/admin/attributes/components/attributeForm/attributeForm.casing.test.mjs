import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyCasingPreview,
  isCasingApplicable,
  resolveSuggestedCasingStrategy,
} from "./attributeForm.casing.ts";
import { resolveCasingPreviewSource } from "./attributeForm.semanticRegistry.ts";

test("uses the concept recommendation while casing is automatic", () => {
  assert.equal(
    resolveSuggestedCasingStrategy({
      recommendedStrategy: "TITLE_CASE",
      currentValue: "NONE",
      isCustomized: false,
      valueType: "TEXT",
    }),
    "TITLE_CASE",
  );
});

test("preserves a customized strategy when the concept changes", () => {
  assert.equal(
    resolveSuggestedCasingStrategy({
      recommendedStrategy: "UPPERCASE",
      currentValue: "SENTENCE_PRESERVE",
      isCustomized: true,
      valueType: "TEXT",
    }),
    "SENTENCE_PRESERVE",
  );
});

test("uses NONE for custom text and non-text values", () => {
  assert.equal(
    resolveSuggestedCasingStrategy({
      recommendedStrategy: null,
      currentValue: "TITLE_CASE",
      isCustomized: false,
      valueType: "TEXT",
    }),
    "NONE",
  );
  assert.equal(
    resolveSuggestedCasingStrategy({
      recommendedStrategy: "TITLE_CASE",
      currentValue: "TITLE_CASE",
      isCustomized: true,
      valueType: "DATE",
    }),
    "NONE",
  );
});

test("matches casing behavior for accents, hyphens, apostrophes and spaces", () => {
  assert.equal(applyCasingPreview("  marie-josé   o'brian ", "NONE"), "marie-josé o'brian");
  assert.equal(
    applyCasingPreview("  marie-josé   o'brian ", "TITLE_CASE"),
    "Marie-José O'Brian",
  );
  assert.equal(applyCasingPreview("éléonore", "SENTENCE_PRESERVE"), "Éléonore");
  assert.equal(applyCasingPreview("été indien", "UPPERCASE"), "ÉTÉ INDIEN");
});

test("resolves concept-aware preview sources with a neutral fallback", () => {
  assert.equal(resolveCasingPreviewSource("FIRST_NAME"), "jean baptiste");
  assert.equal(resolveCasingPreviewSource("DEPARTMENT"), "direction produit");
  assert.equal(resolveCasingPreviewSource("UNKNOWN"), "exemple de texte");
  assert.equal(resolveCasingPreviewSource(null), "exemple de texte");
});

test("shows casing only for editable text values", () => {
  assert.equal(isCasingApplicable("TEXT", false), true);
  assert.equal(isCasingApplicable("TEXT", true), false);
  assert.equal(isCasingApplicable("ENUM", false), false);
  assert.equal(isCasingApplicable("DATETIME", false), false);
});
