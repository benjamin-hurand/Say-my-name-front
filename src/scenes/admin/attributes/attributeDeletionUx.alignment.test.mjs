import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("no native confirm() is used anywhere in the attribute list delete flow", async () => {
  const list = await readSource("./components/AttributeList.tsx");
  assert.doesNotMatch(list, /\bconfirm\(/);
});

test("IDENTITY never opens any delete dialog (blocked or confirm)", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  const handleDeleteClickBody = list.match(/const handleDeleteClick = \(row: Attribute\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handleDeleteClickBody, "handleDeleteClick not found");

  const identityGuardIndex = handleDeleteClickBody.indexOf('getConceptCode(row) === "IDENTITY") return;');
  const blockedDialogIndex = handleDeleteClickBody.indexOf("setBlockedDelete(row)");
  const confirmDialogIndex = handleDeleteClickBody.indexOf("setConfirmDelete({");

  assert.notEqual(identityGuardIndex, -1);
  assert.notEqual(blockedDialogIndex, -1);
  assert.notEqual(confirmDialogIndex, -1);
  assert.ok(
    identityGuardIndex < blockedDialogIndex && identityGuardIndex < confirmDialogIndex,
    "the IDENTITY early-return must run before any dialog can be opened"
  );
});

test("a used attribute (canDelete=false) opens the blocked explanation dialog instead of a confirm dialog", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  const handleDeleteClickBody = list.match(/const handleDeleteClick = \(row: Attribute\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handleDeleteClickBody);
  assert.match(handleDeleteClickBody, /impact && !impact\.canDelete/);

  const blockedBranch = handleDeleteClickBody.match(/if \(impact && !impact\.canDelete\) \{([\s\S]*?)\}/)?.[1];
  assert.ok(blockedBranch);
  assert.match(blockedBranch, /setBlockedDelete\(row\)/);
  assert.match(blockedBranch, /return;/);
});

test("custom (non-concept) attributes get the light confirmation, standard concepts get the reinforced one", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.match(
    list,
    /const REINFORCED_CONFIRM_CONCEPT_CODES = new Set\(\["FIRST_NAME", "LAST_NAME", "GENDER"\]\);/
  );
  assert.match(list, /reinforced: !!conceptCode && REINFORCED_CONFIRM_CONCEPT_CODES\.has\(conceptCode\)/);
});

test("the reinforced confirm body avoids Concept/Fact/identitySource jargon and gives GENDER its own copy", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  const getConfirmBodyFn = list.match(/const getConfirmBody = \(row: Attribute\): string => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(getConfirmBodyFn, "getConfirmBody not found");
  assert.match(getConfirmBodyFn, /DELETE_CONFIRM_GENDER_BODY/);
  assert.match(getConfirmBodyFn, /DELETE_CONFIRM_NAME_FIELD_BODY/);
  assert.doesNotMatch(getConfirmBodyFn, /\bConcept\b|\bFact\b|identitySource/);
});

test("confirming delete calls the DELETE endpoint exactly once, from the confirm handler only", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  const deleteCallSites = (list.match(/deleteAdminAttribute\(/g) ?? []).length;
  assert.equal(deleteCallSites, 1, "deleteAdminAttribute must only be called from the confirm handler");

  const handleConfirmDeleteBody = list.match(/const handleConfirmDelete = async \(\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handleConfirmDeleteBody);
  assert.match(handleConfirmDeleteBody, /await deleteAdminAttribute\(getRowId\(row\)\)/);
});

test("the blocked explanation dialog never imports or calls the DELETE endpoint (non-destructive)", async () => {
  const blockedDialog = await readSource("./components/AttributeDeletionBlockedDialog.tsx");
  assert.doesNotMatch(blockedDialog, /deleteAdminAttribute/);
});

test("the blocked dialog surfaces person/course/pending-change-request impact counts, not raw table/FK details", async () => {
  const blockedDialog = await readSource("./components/AttributeDeletionBlockedDialog.tsx");

  assert.match(blockedDialog, /impact\.personCount > 0/);
  assert.match(blockedDialog, /impact\.courseCount > 0/);
  assert.match(blockedDialog, /impact\.pendingChangeRequestCount > 0/);
  assert.match(blockedDialog, /DELETE_BLOCKED_USED_BY_PERSONS/);
  assert.match(blockedDialog, /DELETE_BLOCKED_USED_BY_COURSES/);
  assert.match(blockedDialog, /DELETE_BLOCKED_PENDING_REQUESTS/);

  assert.doesNotMatch(blockedDialog, /facts|fk_|attribute_id|tenant_id/i);
});

test("the delete button stays visible and enabled for a used attribute; only IDENTITY disables it", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  const isDeleteBlockedLine = list.match(/const isDeleteBlocked = .*/)?.[0];
  assert.ok(isDeleteBlockedLine);
  assert.match(isDeleteBlockedLine, /!isSystemIdentity/);

  // The delete IconButton's disabled prop must only key off IDENTITY, not
  // off deletion-impact — a used field stays clickable and explains itself.
  const deleteButtonBlock = list.match(
    /<Tooltip\s+title=\{\s*isDeleteBlocked[\s\S]*?<\/Tooltip>/
  )?.[0];
  assert.ok(deleteButtonBlock, "delete button block not found");
  assert.match(deleteButtonBlock, /disabled=\{isSystemIdentity\}/);
});

test("the shared ConfirmDialog component (not a bespoke one) is reused for both confirm variants", async () => {
  const list = await readSource("./components/AttributeList.tsx");

  assert.match(list, /import ConfirmDialog from "\.\.\/\.\.\/\.\.\/\.\.\/components\/commons\/dialogs\/ConfirmDialog";/);

  const confirmDialogUsages = (list.match(/<ConfirmDialog/g) ?? []).length;
  assert.equal(confirmDialogUsages, 1, "exactly one ConfirmDialog render site, driven by the confirmDelete variant");
});

test("the admin attributes page force-refreshes from /admin/attributes on mount so deletionImpact is available before any delete click", async () => {
  const page = await readSource("./AdminAttributesPage.tsx");

  assert.match(
    page,
    /useEffect\(\(\) => \{\s*void hardRefreshAttributes\(\);\s*\}, \[hardRefreshAttributes\]\);/
  );
});

test("the Attribute model exposes deletionImpact with the counts the blocked dialog and canDelete rule rely on", async () => {
  const model = await readSource("../../../models/commons/Attribute/Attribute.ts");

  assert.match(model, /export interface AttributeDeletionImpact \{/);
  assert.match(model, /factCount: number;/);
  assert.match(model, /personCount: number;/);
  assert.match(model, /courseCount: number;/);
  assert.match(model, /pendingChangeRequestCount: number;/);
  assert.match(model, /canDelete: boolean;/);
  assert.match(model, /deletionImpact\?: AttributeDeletionImpact \| null;/);
});
