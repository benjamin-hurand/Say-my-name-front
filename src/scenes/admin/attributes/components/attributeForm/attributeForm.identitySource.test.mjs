import assert from "node:assert/strict";
import { test } from "node:test";

import { isIdentitySourceEligible } from "./attributeForm.identitySource.ts";

test("allows identity sources for eligible canonical and custom single TEXT attributes", () => {
  assert.equal(isIdentitySourceEligible({
    isCustom: false,
    conceptEligible: true,
    valueType: "TEXT",
    maxValues: 1,
    conceptCode: "FIRST_NAME",
  }), true);
  assert.equal(isIdentitySourceEligible({
    isCustom: true,
    conceptEligible: false,
    valueType: "TEXT",
    maxValues: 1,
  }), true);
});

test("rejects IDENTITY, ENUM and multi-value identity sources", () => {
  const base = { isCustom: false, conceptEligible: true, valueType: "TEXT", maxValues: 1 };
  assert.equal(isIdentitySourceEligible({ ...base, conceptCode: "IDENTITY" }), false);
  assert.equal(isIdentitySourceEligible({ ...base, valueType: "ENUM", conceptCode: "GENDER" }), false);
  assert.equal(isIdentitySourceEligible({ ...base, maxValues: 2, conceptCode: "FIRST_NAME" }), false);
});
