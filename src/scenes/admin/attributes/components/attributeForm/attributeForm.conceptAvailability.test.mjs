import assert from "node:assert/strict";
import { test } from "node:test";

import {
  filterAvailableConcepts,
  resolveConceptAvailability,
  resolveConfiguredConceptItems,
  shouldSkipConceptPicker,
} from "./attributeForm.conceptAvailability.ts";

const concepts = [{ id: 1 }, { id: 2 }, { id: 3 }];

test("makes every concept available when no attribute exists", () => {
  const result = resolveConceptAvailability(concepts, []);

  assert.deepEqual(
    [...result.values()],
    [{ available: true }, { available: true }, { available: true }],
  );
});

test("filters the picker to available concepts without changing catalog order", () => {
  const availability = resolveConceptAvailability(
    concepts,
    [{ id: 10, conceptId: 2, name: "Nom" }],
  );

  assert.deepEqual(
    filterAvailableConcepts(concepts, availability).map(({ id }) => id),
    [1, 3],
  );
});

test("never exposes the system IDENTITY concept in normal creation", () => {
  const catalog = [
    { id: 1, code: "FIRST_NAME" },
    { id: 2, code: "IDENTITY" },
    { id: 3, code: "GENDER" },
  ];
  const availability = resolveConceptAvailability(catalog, []);

  assert.deepEqual(
    filterAvailableConcepts(catalog, availability).map(({ code }) => code),
    ["FIRST_NAME", "GENDER"],
  );
});

test("returns an empty system catalog when every concept is configured", () => {
  const availability = resolveConceptAvailability(
    concepts,
    concepts.map(({ id }) => ({
      id: id + 10,
      conceptId: id,
      name: `Champ ${id}`,
    })),
  );

  assert.deepEqual(filterAvailableConcepts(concepts, availability), []);
});

test("marks a used concept unavailable with the owning attribute", () => {
  const result = resolveConceptAvailability(
    concepts,
    [{ id: 10, conceptId: 2, name: "Prénom principal" }],
  );

  assert.deepEqual(result.get(2), {
    available: false,
    usedByAttributeId: 10,
    usedByAttributeName: "Prénom principal",
  });
});

test("ignores custom attributes with a null conceptId", () => {
  const result = resolveConceptAvailability(
    concepts,
    [{ id: 10, conceptId: null, name: "Champ personnalisé" }],
  );

  assert.equal([...result.values()].every(({ available }) => available), true);
});

test("excludes the currently edited attribute by its real identifier", () => {
  const result = resolveConceptAvailability(
    concepts,
    [{ id: 10, conceptId: 2, name: "Prénom principal" }],
    10,
  );

  assert.deepEqual(result.get(2), { available: true });
});

test("keeps a concept owned by another attribute unavailable while editing", () => {
  const result = resolveConceptAvailability(
    concepts,
    [
      { id: 10, conceptId: 1, name: "Attribut édité" },
      { id: 11, conceptId: 2, name: "Nom principal" },
    ],
    10,
  );

  assert.deepEqual(result.get(1), { available: true });
  assert.equal(result.get(2)?.available, false);
  assert.equal(result.get(2)?.usedByAttributeId, 11);
});

test("makes a concept available again after its attribute is removed", () => {
  const beforeRemoval = resolveConceptAvailability(
    concepts,
    [{ id: 10, conceptId: 2, name: "Prénom principal" }],
  );
  const afterRemoval = resolveConceptAvailability(concepts, []);

  assert.equal(beforeRemoval.get(2)?.available, false);
  assert.equal(afterRemoval.get(2)?.available, true);
});

test("ignores attributes whose conceptId is null or missing", () => {
  const result = resolveConceptAvailability(
    concepts,
    [
      { id: 10, conceptId: null, name: "Personnalisé" },
      { id: 11, name: "Ancienne donnée" },
    ],
  );

  assert.equal([...result.values()].every(({ available }) => available), true);
});

test("derives configured concepts in catalog order with the real attribute name", () => {
  const conceptCatalog = [
    { id: 1, code: "FIRST_NAME" },
    { id: 2, code: "LAST_NAME" },
    { id: 3, code: "GENDER" },
  ];
  const attributes = [
    { id: 20, conceptId: 3, name: "Genre déclaré" },
    { id: 10, conceptId: 1, name: "First name" },
  ];
  const availability = resolveConceptAvailability(conceptCatalog, attributes);

  const items = resolveConfiguredConceptItems(
    conceptCatalog,
    attributes,
    availability,
    (concept) => `label:${concept.code}`,
  );

  assert.deepEqual(
    items.map(({ conceptId, conceptLabel, attributeId, attributeName }) => ({
      conceptId,
      conceptLabel,
      attributeId,
      attributeName,
    })),
    [
      {
        conceptId: 1,
        conceptLabel: "label:FIRST_NAME",
        attributeId: 10,
        attributeName: "First name",
      },
      {
        conceptId: 3,
        conceptLabel: "label:GENDER",
        attributeId: 20,
        attributeName: "Genre déclaré",
      },
    ],
  );
  assert.equal(items[0].attribute, attributes[1]);
});

test("custom attributes never become configured concept items", () => {
  const conceptCatalog = [{ id: 1, code: "FIRST_NAME" }];
  const attributes = [
    { id: 10, conceptId: null, name: "Badge" },
    { id: 11, conceptId: null, name: "Bureau" },
  ];
  const availability = resolveConceptAvailability(conceptCatalog, attributes);

  const items = resolveConfiguredConceptItems(
    conceptCatalog,
    attributes,
    availability,
    (concept) => concept.code,
  );

  assert.deepEqual(items, []);
  assert.deepEqual(availability.get(1), { available: true });
});

test("keeps a stale configured concept visible without exposing an impossible edit", () => {
  const conceptCatalog = [{ id: 1, code: "FIRST_NAME" }];
  const availability = new Map([
    [
      1,
      {
        available: false,
        usedByAttributeId: 999,
        usedByAttributeName: "Ancien prénom",
      },
    ],
  ]);

  const [item] = resolveConfiguredConceptItems(
    conceptCatalog,
    [],
    availability,
    (concept) => concept.code,
  );

  assert.equal(item.attributeId, 999);
  assert.equal(item.attributeName, "Ancien prénom");
  assert.equal(item.attribute, undefined);
});

test("skips the concept picker when creating and only the custom tile remains", () => {
  assert.equal(shouldSkipConceptPicker(false, []), true);
  assert.equal(shouldSkipConceptPicker(false, [{ id: 1 }]), false);
});

test("never skips the concept picker while editing an existing attribute", () => {
  assert.equal(shouldSkipConceptPicker(true, []), false);
});
