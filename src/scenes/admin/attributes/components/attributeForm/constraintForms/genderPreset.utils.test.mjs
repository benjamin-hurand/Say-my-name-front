import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveActiveGenderPresetKey } from "./genderPreset.utils.ts";

test("deduces the matching preset from the current values when not in manual mode", () => {
  assert.equal(resolveActiveGenderPresetKey(["Homme", "Femme"], false), "HF");
  assert.equal(resolveActiveGenderPresetKey(["Masculin", "Féminin"], false), "MF");
  assert.equal(resolveActiveGenderPresetKey(["Autre chose"], false), "CUSTOM");
  assert.equal(resolveActiveGenderPresetKey(undefined, false), "CUSTOM");
});

test("stays on the custom list once manual mode is enabled, even if values match a preset exactly", () => {
  assert.equal(resolveActiveGenderPresetKey(["Homme", "Femme"], true), "CUSTOM");
});
