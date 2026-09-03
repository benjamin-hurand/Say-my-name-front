import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getPersonDisplayName,
  getPersonInitials,
  PERSON_DISPLAY_NAME_FALLBACK,
} from "./personDisplayName.ts";

test("uses the backend displayName as the only person name source", () => {
  assert.equal(getPersonDisplayName({ displayName: "  Ada Lovelace  " }), "Ada Lovelace");
  assert.equal(
    getPersonDisplayName({ displayName: "", primaryAttributes: [{ value: "Ignored" }] }),
    PERSON_DISPLAY_NAME_FALLBACK,
  );
});

test("derives initials only from displayName", () => {
  assert.equal(getPersonInitials({ displayName: "Ada Lovelace" }), "AL");
  assert.equal(getPersonInitials({ displayName: "" }), "?");
});
