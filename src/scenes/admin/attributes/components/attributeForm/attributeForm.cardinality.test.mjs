import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

import { resolveConceptMaxValues } from "./attributeForm.cardinality.ts";

test("keeps maxValues editable when the concept does not define a value", () => {
  assert.deepEqual(resolveConceptMaxValues(null, 3), {
    value: 3,
    locked: false,
  });
});

test("locks maxValues and applies the value defined by the concept", () => {
  assert.deepEqual(resolveConceptMaxValues(1, 3), {
    value: 1,
    locked: true,
  });
});

test("updates the lock when the selected concept changes", () => {
  const locked = resolveConceptMaxValues(1, 4);
  const unlocked = resolveConceptMaxValues(null, locked.value);

  assert.equal(locked.locked, true);
  assert.equal(unlocked.locked, false);
  assert.equal(unlocked.value, 1);
});

test("does not contain references to the removed concept usage policy", async () => {
  const sourceRoot = new URL("../../../../..", import.meta.url);
  const files = await collectSourceFiles(sourceRoot);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.equal(source.includes("tenant" + "UsagePolicy"), false, file.pathname);
  }
});

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(child)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(child);
    }
  }

  return files;
}
