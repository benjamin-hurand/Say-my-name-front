import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveEnumSelectionMode } from "./enumSelection.ts";

test("ENUM maxValues=1 is single-select", () => {
  assert.equal(resolveEnumSelectionMode(1), "single");
});

test("ENUM maxValues>1 is multi-select regardless of required", () => {
  for (const required of [true, false]) {
    assert.equal(resolveEnumSelectionMode(required ? 2 : 5), "multiple");
  }
});
