import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildIdentityPreview,
  buildIdentityReorderSwap,
  excludeSystemIdentity,
  isIdentitySourceAttribute,
  isSystemIdentityConcept,
  resolveIdentityPreviewToken,
  sortByDisplayOrder,
} from "./identity.utils.ts";

test("identifies identity source attributes while excluding the system IDENTITY row", () => {
  assert.equal(isIdentitySourceAttribute({ identitySource: true, conceptCode: "FIRST_NAME" }), true);
  assert.equal(isIdentitySourceAttribute({ identitySource: false, conceptCode: "LAST_NAME" }), false);
  assert.equal(isIdentitySourceAttribute({ identitySource: true, conceptCode: "IDENTITY" }), false);
  assert.equal(isSystemIdentityConcept({ conceptCode: "IDENTITY" }), true);
  assert.equal(isSystemIdentityConcept({ conceptCode: "FIRST_NAME" }), false);
});

test("excludes the system IDENTITY row from a general attribute list", () => {
  const rows = [
    { conceptCode: "IDENTITY" },
    { conceptCode: "FIRST_NAME" },
    { conceptCode: null },
  ];

  assert.deepEqual(excludeSystemIdentity(rows), [
    { conceptCode: "FIRST_NAME" },
    { conceptCode: null },
  ]);
});

test("sorts sources by displayOrder ascending", () => {
  const rows = [{ displayOrder: 10 }, { displayOrder: 1 }, { displayOrder: 2 }];
  assert.deepEqual(sortByDisplayOrder(rows), [
    { displayOrder: 1 },
    { displayOrder: 2 },
    { displayOrder: 10 },
  ]);
});

test("swaps only the two adjacent identity sources and preserves other attributes' order", () => {
  const sources = [
    { id: 1, displayOrder: 1 },
    { id: 2, displayOrder: 2 },
  ];

  assert.deepEqual(buildIdentityReorderSwap(sources, 1, "up"), [
    { id: 2, displayOrder: 1 },
    { id: 1, displayOrder: 2 },
  ]);

  assert.deepEqual(buildIdentityReorderSwap(sources, 0, "down"), [
    { id: 1, displayOrder: 2 },
    { id: 2, displayOrder: 1 },
  ]);
});

test("does not touch attributes sitting between the two swapped sources", () => {
  // First name (1), Last name (2), Departement (10) — swapping First/Last
  // must leave Departement's displayOrder=10 completely out of the payload.
  const sources = [
    { id: 1, displayOrder: 1 },
    { id: 2, displayOrder: 2 },
  ];

  const payload = buildIdentityReorderSwap(sources, 0, "down");
  assert.equal(payload.some((item) => item.id === 99), false);
  assert.deepEqual(payload, [
    { id: 1, displayOrder: 2 },
    { id: 2, displayOrder: 1 },
  ]);
});

test("refuses to move past the edges", () => {
  const sources = [{ id: 1, displayOrder: 1 }, { id: 2, displayOrder: 2 }];
  assert.equal(buildIdentityReorderSwap(sources, 0, "up"), null);
  assert.equal(buildIdentityReorderSwap(sources, 1, "down"), null);
  assert.equal(buildIdentityReorderSwap(sources, -1, "up"), null);
  assert.equal(buildIdentityReorderSwap(sources, 5, "up"), null);
});

test("builds a deterministic preview following the current source order", () => {
  const firstName = { conceptCode: "FIRST_NAME", name: "Prenom", casingStrategy: "TITLE_CASE" };
  const lastName = { conceptCode: "LAST_NAME", name: "Nom", casingStrategy: "UPPERCASE" };

  assert.equal(buildIdentityPreview([firstName, lastName]), "Jean DUPONT");
  assert.equal(buildIdentityPreview([lastName, firstName]), "DUPONT Jean");
});

test("falls back to a neutral example based on the field label for custom sources", () => {
  const custom = { conceptCode: null, name: "Matricule", casingStrategy: "UPPERCASE" };
  assert.equal(resolveIdentityPreviewToken(custom), "MATRICULE");
});
