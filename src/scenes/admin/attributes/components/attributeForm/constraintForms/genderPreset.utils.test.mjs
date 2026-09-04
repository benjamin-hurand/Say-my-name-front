import assert from "node:assert/strict";
import { test } from "node:test";

import { GENDER_PRESET_VALUES } from "./genderPreset.utils.ts";

test("GENDER preset is the fixed system list, in order, with no custom escape hatch", () => {
  assert.deepEqual(GENDER_PRESET_VALUES, ["Homme", "Femme", "Non-binaire ou autre"]);
});
