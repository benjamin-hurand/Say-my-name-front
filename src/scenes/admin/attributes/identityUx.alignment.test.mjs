import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("the attribute form no longer exposes an identitySource toggle", async () => {
  const [fieldConfigScreen, drawer, schema] = await Promise.all([
    readSource("./components/attributeForm/FieldConfigScreen.tsx"),
    readSource("./components/AttributeFormDrawer.tsx"),
    readSource("./validation/attributeCreate.schema.ts"),
  ]);

  assert.doesNotMatch(fieldConfigScreen, /identitySource/i);
  assert.doesNotMatch(drawer, /identitySource/i);
  assert.doesNotMatch(drawer, /presetIdentitySource/i);
  assert.doesNotMatch(schema, /identitySource/i);
});

test("the attribute list no longer shows an identity fingerprint or locks dragging", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.doesNotMatch(list, /identitySource/i);
  assert.doesNotMatch(list, /Fingerprint/);
  assert.doesNotMatch(list, /isDragDisabled/);
});

test("reordering the general list no longer filters out identity sources", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.match(list, /onReorder\(next\)/);
});

test("the create flow no longer offers an identity-source preset CTA", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  assert.doesNotMatch(page, /presetIdentitySource/i);
  assert.doesNotMatch(page, /openCreateIdentitySource/);
  assert.doesNotMatch(page, /IdentityMembersCard/);
  assert.match(page, /DisplayNameCard/);
});
