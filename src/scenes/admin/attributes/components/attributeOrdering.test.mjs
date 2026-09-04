import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STANDARD_CONCEPT_ORDER,
  isStandardAttribute,
  splitStandardAndCustomAttributes,
} from "./attributeOrdering.ts";

test("recognizes FIRST_NAME/LAST_NAME/GENDER as standard, everything else as custom", () => {
  assert.equal(isStandardAttribute({ conceptCode: "FIRST_NAME" }), true);
  assert.equal(isStandardAttribute({ conceptCode: "LAST_NAME" }), true);
  assert.equal(isStandardAttribute({ conceptCode: "GENDER" }), true);
  assert.equal(isStandardAttribute({ conceptCode: "IDENTITY" }), false);
  assert.equal(isStandardAttribute({ conceptCode: null }), false);
});

test("sorts standards into FIRST_NAME/LAST_NAME/GENDER regardless of their displayOrder", () => {
  const rows = [
    { id: 1, conceptCode: "GENDER", displayOrder: 1 },
    { id: 2, conceptCode: "LAST_NAME", displayOrder: 2 },
    { id: 3, conceptCode: "FIRST_NAME", displayOrder: 999 },
  ];

  const { standards } = splitStandardAndCustomAttributes(rows);

  assert.deepEqual(standards.map((r) => r.conceptCode), [...STANDARD_CONCEPT_ORDER]);
});

test("keeps custom attributes out of the standard block and preserves their given order", () => {
  const rows = [
    { id: 1, conceptCode: "FIRST_NAME" },
    { id: 2, conceptCode: null },
    { id: 3, conceptCode: "GENDER" },
    { id: 4, conceptCode: null },
    { id: 5, conceptCode: "LAST_NAME" },
  ];

  const { standards, customs } = splitStandardAndCustomAttributes(rows);

  assert.deepEqual(standards.map((r) => r.id), [1, 5, 3]);
  assert.deepEqual(customs.map((r) => r.id), [2, 4]);
});

test("IDENTITY is neither a standard nor accidentally treated as custom by this split alone", () => {
  // IDENTITY is filtered out upstream (excludeSystemIdentity); this split
  // only guarantees it never lands in the standard block if it ever reaches it.
  const rows = [{ id: 1, conceptCode: "IDENTITY" }];
  const { standards, customs } = splitStandardAndCustomAttributes(rows);

  assert.deepEqual(standards, []);
  assert.deepEqual(customs, rows);
});
