import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("the subjective 'useless' diagnostic no longer exists", async () => {
  const [page, health] = await Promise.all([
    readSource("./AdminAttributesPage.tsx"),
    readSource("./attributeHealth.ts"),
  ]);

  assert.doesNotMatch(page, /"useless"/);
  assert.doesNotMatch(health, /"useless"/);
  assert.doesNotMatch(page, /peu exploité/);
});

test("the manual 'Actualiser' refresh button has been removed", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  assert.doesNotMatch(page, /RefreshRoundedIcon/);
  assert.doesNotMatch(page, /ATTRIBUTE_PAGE\.REFRESH"/);
});

test("every mutation path still resyncs the list without the button", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  // Create/update (drawer close after a successful save).
  assert.match(
    page,
    /const onCloseAttributeDrawer[\s\S]*?if \(changed\) \{\s*await hardRefreshAttributes\(\);/,
  );
  // Delete.
  assert.match(page, /onDeleted=\{async \(\) => \{\s*await hardRefreshAttributes\(\);/);
  // Reorder failure (resync after a rejected optimistic update).
  assert.match(
    page,
    /REORDER_ERROR[\s\S]*?\)\s*;\s*\n\s*await hardRefreshAttributes\(\);/,
  );
});
