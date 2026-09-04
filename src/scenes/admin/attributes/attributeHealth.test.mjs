import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ATTRIBUTE_ISSUE_SEVERITY,
  computeAttributeIssueTags,
} from "./attributeHealth.ts";

const GENDER_CONCEPT = {
  id: 1,
  code: "GENDER",
  iconKey: null,
  valueType: "ENUM",
  derived: false,
  portabilityKind: "NONE",
  identityComponentEligible: false,
  defaultCasingStrategy: null,
};

const FIRST_NAME_CONCEPT = {
  id: 2,
  code: "FIRST_NAME",
  iconKey: null,
  valueType: "TEXT",
  derived: false,
  portabilityKind: "NONE",
  identityComponentEligible: true,
  defaultCasingStrategy: "TITLE_CASE",
};

function conceptMaps(concepts) {
  return [
    new Map(concepts.map((c) => [c.id, c])),
    new Map(concepts.map((c) => [c.code, c])),
  ];
}

test("a valid GENDER attribute (not filterable/sortable) raises no diagnostic", () => {
  const [byId, byCode] = conceptMaps([GENDER_CONCEPT]);
  const attribute = {
    id: 10,
    name: "Genre",
    conceptId: GENDER_CONCEPT.id,
    conceptCode: GENDER_CONCEPT.code,
    type: "ENUM",
    filter: false,
    sort: false,
    required: false,
    options: [
      { id: 1, attributeId: 10, code: "MALE", label: "Homme", orderIndex: 0, active: true },
    ],
  };

  assert.deepEqual(computeAttributeIssueTags(attribute, byId, byCode), []);
});

test("a valid custom attribute with no filter/sort/required raises no diagnostic", () => {
  const [byId, byCode] = conceptMaps([]);
  const attribute = {
    id: 11,
    name: "Couleur préférée",
    conceptId: null,
    conceptCode: null,
    type: "TEXT",
    filter: false,
    sort: false,
    required: false,
  };

  assert.deepEqual(computeAttributeIssueTags(attribute, byId, byCode), []);
});

test("an ENUM attribute with no active options is flagged as a real issue", () => {
  const [byId, byCode] = conceptMaps([]);
  const attribute = {
    id: 12,
    name: "Statut",
    conceptId: null,
    conceptCode: null,
    type: "ENUM",
    options: [],
  };

  const tags = computeAttributeIssueTags(attribute, byId, byCode);
  assert.deepEqual(tags, ["enum-without-options"]);
  assert.equal(ATTRIBUTE_ISSUE_SEVERITY["enum-without-options"], "warning");
});

test("an attribute whose type is incompatible with its concept is flagged as a real issue", () => {
  const [byId, byCode] = conceptMaps([FIRST_NAME_CONCEPT]);
  const attribute = {
    id: 13,
    name: "Prénom",
    conceptId: FIRST_NAME_CONCEPT.id,
    conceptCode: FIRST_NAME_CONCEPT.code,
    type: "NUMBER",
  };

  const tags = computeAttributeIssueTags(attribute, byId, byCode);
  assert.deepEqual(tags, ["concept-type-mismatch"]);
  assert.equal(ATTRIBUTE_ISSUE_SEVERITY["concept-type-mismatch"], "error");
});

test("the 'needs attention' count only reflects real, actionable issues", () => {
  const [byId, byCode] = conceptMaps([GENDER_CONCEPT, FIRST_NAME_CONCEPT]);
  const attributes = [
    {
      id: 10,
      name: "Genre",
      conceptId: GENDER_CONCEPT.id,
      conceptCode: GENDER_CONCEPT.code,
      type: "ENUM",
      filter: false,
      sort: false,
      options: [{ id: 1, attributeId: 10, code: "MALE", label: "Homme", orderIndex: 0, active: true }],
    },
    {
      id: 11,
      name: "Couleur préférée",
      conceptId: null,
      conceptCode: null,
      type: "TEXT",
      filter: false,
      sort: false,
    },
    {
      id: 12,
      name: "Statut",
      conceptId: null,
      conceptCode: null,
      type: "ENUM",
      options: [],
    },
    {
      id: 13,
      name: "Prénom",
      conceptId: FIRST_NAME_CONCEPT.id,
      conceptCode: FIRST_NAME_CONCEPT.code,
      type: "NUMBER",
    },
  ];

  const flaggedIds = attributes
    .filter((a) => computeAttributeIssueTags(a, byId, byCode).length > 0)
    .map((a) => a.id);

  assert.deepEqual(flaggedIds, [12, 13]);
});
