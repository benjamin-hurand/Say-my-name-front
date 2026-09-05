import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resetCustomTypeSelection,
  confirmCustomTypeSelection,
  resolvePickerValue,
} from "./attributeForm.customType.ts";

test("no card reads as selected before the user picks a custom type", () => {
  const state = resetCustomTypeSelection();
  assert.equal(resolvePickerValue(state), null);
});

test("switching from a concept (e.g. Genre/ENUM) to the custom branch drops the concept's type", () => {
  // Simulates: user picked Genre (ENUM), went back, then chose "custom field".
  // Before the fix, the drawer's `type` field kept ENUM from the Genre step.
  const reset = resetCustomTypeSelection();

  assert.notEqual(reset.type, "ENUM");
  assert.equal(reset.type, "TEXT");
  assert.equal(reset.confirmed, false);
  // And critically: even though a real (non-null) type now backs the form,
  // no card should render as pre-selected.
  assert.equal(resolvePickerValue(reset), null);
});

test("clicking a card selects that type and marks the selection confirmed", () => {
  const confirmed = confirmCustomTypeSelection("NUMBER");

  assert.equal(confirmed.type, "NUMBER");
  assert.equal(confirmed.confirmed, true);
  assert.equal(resolvePickerValue(confirmed), "NUMBER");
});

test("re-entering the picker after a real pick (e.g. via Back) still shows that pick", () => {
  const confirmed = confirmCustomTypeSelection("ENUM");
  assert.equal(resolvePickerValue(confirmed), "ENUM");
});
