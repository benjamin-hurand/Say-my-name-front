import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("frontend DTOs expose displayName and use identitySource", async () => {
  const [personDto, attributePayload] = await Promise.all([
    readSource("./models/commons/PersonDto.ts"),
    readSource("./models/commons/Attribute/Attribute.dto.ts"),
  ]);

  assert.match(personDto, /displayName:\s*string/);
  assert.match(attributePayload, /identitySource\?:\s*boolean/);
  assert.equal(attributePayload.includes("primary" + "Field"), false);
  assert.doesNotMatch(attributePayload, /UpdateAttributePayload[^;]+\bid:\s*number/s);
});

test("ENUM edit defaults preserve backend option labels", async () => {
  const helpers = await readSource(
    "./scenes/admin/attributes/components/attributeForm/attributeForm.helpers.ts",
  );
  assert.match(helpers, /initial\.options\s*\?\?\s*\[\]\)\.map\(\(option\)\s*=>\s*option\.label\)/s);
});

test("admin attribute update and reorder follow the path-id contract", async () => {
  const [service, drawer, page] = await Promise.all([
    readSource("./services/business/admin/admin.attributes.service.ts"),
    readSource("./scenes/admin/attributes/components/AttributeFormDrawer.tsx"),
    readSource("./scenes/admin/attributes/AdminAttributesPage.tsx"),
  ]);

  assert.match(service, /API\.put<Attribute>\(`\$\{ADMIN_ENDPOINT\}\/attributes\/\$\{id\}`, payload\)/);
  assert.equal(drawer.includes("id: initial.id"), false);
  assert.match(service, /API\.patch\(`\$\{ADMIN_ENDPOINT\}\/attributes\/reorder`, items\)/);
  assert.match(page, /id:\s*getAttrId\(r\),\s*displayOrder:/s);
});
