import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("reorder applies the dropped order to state before awaiting the PATCH (no flash back to the old order)", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  const onReorderBody = page.match(/const onReorder = async[\s\S]*?\n  \};/)?.[0];
  assert.ok(onReorderBody, "onReorder handler not found");

  const optimisticSetIndex = onReorderBody.indexOf("setAttributes((prev) =>");
  const awaitPatchIndex = onReorderBody.indexOf("await reorderAdminAttributes(items)");

  assert.notEqual(optimisticSetIndex, -1);
  assert.notEqual(awaitPatchIndex, -1);
  assert.ok(
    optimisticSetIndex < awaitPatchIndex,
    "state must be updated with the new order before the PATCH is awaited"
  );

  // No artificial delay used to paper over ordering issues.
  assert.doesNotMatch(onReorderBody, /setTimeout/);
});

test("reorder success does not trigger any further state change (nothing re-renders on success)", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  const onReorderBody = page.match(/const onReorder = async[\s\S]*?\n  \};/)?.[0];
  const successBlock = onReorderBody.match(/await reorderAdminAttributes\(items\);([\s\S]*?)\} catch/)?.[1];

  assert.ok(successBlock);
  assert.doesNotMatch(successBlock, /setAttributes/);
  assert.match(successBlock, /notifySuccess/);
});

test("reorder failure rolls back the optimistic update and resyncs with the server", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  const onReorderBody = page.match(/const onReorder = async[\s\S]*?\n  \};/)?.[0];
  const catchBlock = onReorderBody.match(/\} catch \(e: any\) \{([\s\S]*?)\n  \};/)?.[1];

  assert.ok(catchBlock);
  assert.match(catchBlock, /setAttributes\(previousAttributes\)/);
  assert.match(catchBlock, /await hardRefreshAttributes\(\);/);
});

test("custom reorder never includes a standard field's id/displayOrder in the PATCH payload", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  assert.match(page, /nextCustomPageRows: Attribute\[\]/);
  assert.match(page, /id:\s*getAttrId\(r\),\s*displayOrder:/s);
  assert.doesNotMatch(page, /standardRows\.map\(\(r, i\)/);
});

test("the attribute list renders a fixed, non-draggable standard block above a draggable custom section", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.match(list, /standardRows\.map\(\(row\) => \(/);
  assert.match(list, /renderCard\(row, null\)/);
  assert.doesNotMatch(list, /isDragDisabled/);
  assert.doesNotMatch(list, /Fingerprint/);

  // Only the custom section is wrapped in dnd.
  assert.match(list, /<DragDropContext onDragEnd=\{handleDragEnd\}>/);
  assert.match(list, /customRows\.map\(\(row, idx\)/);
});

test("dragging reorders only the custom rows array, never the standard block", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  const handleDragEndBody = list.match(/const handleDragEnd = \(r: DropResult\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handleDragEndBody);
  assert.match(handleDragEndBody, /Array\.from\(customRows\)/);
  assert.match(handleDragEndBody, /onReorder\(next\)/);
});

test("the custom section shows a light empty state when there is no custom field", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.match(list, /CUSTOM_FIELDS_EMPTY/);
  assert.match(list, /customRows\.length === 0 && customTotal === 0/);
});

test("pagination is driven by the custom total, not the combined standard+custom total", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.match(list, /customTotal > pageSize/);
  assert.match(list, /Math\.ceil\(customTotal \/ pageSize\)/);
});

test("the droppable placeholder follows the canonical @hello-pangea/dnd pattern: rendered once, after the mapped collection", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  // Manually relocating the placeholder to the dragged item's own slot was
  // tried and reverted: dnd already shifts siblings via transform assuming
  // the *canonical* placeholder position, so an extra manually-placed one
  // double-reserves the space (a large empty gap appears during drag).
  const draggableBody = list.match(/<Draggable[\s\S]*?<\/Draggable>/)?.[0];
  assert.ok(draggableBody, "Draggable render body not found");
  assert.doesNotMatch(draggableBody, /provided\.placeholder/);

  const droppableBody = list.match(/<Droppable droppableId="custom-attributes">[\s\S]*?<\/Droppable>/)?.[0];
  assert.ok(droppableBody, "Droppable render body not found");

  // Exactly one placeholder, and it comes after the .map() call, not before.
  const placeholderMentions = (droppableBody.match(/provided\.placeholder/g) ?? []).length;
  assert.equal(placeholderMentions, 1);
  assert.ok(
    droppableBody.indexOf("customRows.map") < droppableBody.indexOf("provided.placeholder"),
    "placeholder must be rendered after the mapped collection, not inside a specific Draggable"
  );
});

test("custom row spacing is carried by each Draggable's own margin, not the droppable container's gap", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  // @hello-pangea/dnd measures each Draggable's own margin box to size the
  // placeholder and to compute sibling transforms; a container-level `gap`
  // is invisible to that measurement and was the source of the original
  // small spacing drift during drag.
  const droppableContainerSx = list.match(/ref=\{provided\.innerRef\}[\s\S]*?sx=\{\{([\s\S]*?)\}\}/)?.[1];
  assert.ok(droppableContainerSx, "custom droppable container sx not found");
  assert.doesNotMatch(droppableContainerSx, /gap:/);

  assert.match(list, /const CUSTOM_ROW_SPACING = /);
  assert.match(list, /mb: drag\.isLast \? 0 : CUSTOM_ROW_SPACING/);
  assert.match(list, /isLast: idx === customRows\.length - 1/);
});
