import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildIdentityPreview,
  excludeSystemIdentity,
  isSystemIdentityConcept,
  resolveDisplayNameSummary,
  resolveIdentityPreviewToken,
} from "./identity.utils.ts";

test("identifies the system IDENTITY concept", () => {
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

test("builds a deterministic preview in the given order", () => {
  const firstName = { conceptCode: "FIRST_NAME", name: "Prenom", casingStrategy: "TITLE_CASE" };
  const lastName = { conceptCode: "LAST_NAME", name: "Nom", casingStrategy: "UPPERCASE" };

  assert.equal(buildIdentityPreview([firstName, lastName]), "Jean DUPONT");
});

test("falls back to a neutral example based on the field label for custom sources", () => {
  const custom = { conceptCode: null, name: "Matricule", casingStrategy: "UPPERCASE" };
  assert.equal(resolveIdentityPreviewToken(custom), "MATRICULE");
});

test("summarizes the displayed name from FIRST_NAME and LAST_NAME only", () => {
  const firstName = { conceptCode: "FIRST_NAME", name: "Prenom", casingStrategy: "TITLE_CASE" };
  const lastName = { conceptCode: "LAST_NAME", name: "Nom", casingStrategy: "UPPERCASE" };

  assert.deepEqual(resolveDisplayNameSummary(firstName, lastName), {
    kind: "composed",
    labelKey: "BOTH_LABEL",
    preview: "Jean DUPONT",
  });

  assert.deepEqual(resolveDisplayNameSummary(firstName, null), {
    kind: "composed",
    labelKey: "FIRST_ONLY_LABEL",
    preview: "Jean",
  });

  assert.deepEqual(resolveDisplayNameSummary(null, lastName), {
    kind: "composed",
    labelKey: "LAST_ONLY_LABEL",
    preview: "DUPONT",
  });

  assert.deepEqual(resolveDisplayNameSummary(null, null), { kind: "empty" });
});
