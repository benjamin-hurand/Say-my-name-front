import { applyCasingPreview } from "./attributeForm/attributeForm.casing.ts";
import type { Attribute } from "../../../../models/commons/Attribute/Attribute";

export function isSystemIdentityConcept(a: Pick<Attribute, "conceptCode">): boolean {
  return a.conceptCode === "IDENTITY";
}

export function isIdentitySourceAttribute(
  a: Pick<Attribute, "identitySource" | "conceptCode">,
): boolean {
  return !!a.identitySource && !isSystemIdentityConcept(a);
}

export function excludeSystemIdentity<T extends Pick<Attribute, "conceptCode">>(
  rows: readonly T[],
): T[] {
  return rows.filter((row) => !isSystemIdentityConcept(row));
}

export function sortByDisplayOrder<T extends Pick<Attribute, "displayOrder">>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export type IdentityReorderItem = { id: number; displayOrder: number };

/**
 * Swaps only the displayOrder of the two adjacent identity sources being
 * reordered. Every other Attribute (including non-identity sources sitting
 * between them) keeps its displayOrder untouched, matching how
 * PATCH /api/admin/attributes/reorder only mutates the ids it is given.
 */
export function buildIdentityReorderSwap(
  sortedSources: readonly Pick<Attribute, "id" | "displayOrder">[],
  index: number,
  direction: "up" | "down",
): IdentityReorderItem[] | null {
  if (index < 0 || index >= sortedSources.length) return null;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sortedSources.length) return null;

  const current = sortedSources[index];
  const target = sortedSources[targetIndex];

  return [
    { id: current.id, displayOrder: target.displayOrder ?? 0 },
    { id: target.id, displayOrder: current.displayOrder ?? 0 },
  ];
}

const IDENTITY_PREVIEW_BASE_BY_CONCEPT_CODE: Record<string, string> = {
  FIRST_NAME: "jean",
  LAST_NAME: "dupont",
};

const DEFAULT_IDENTITY_PREVIEW_BASE = "exemple";

/**
 * Builds a deterministic, non-persisted example value for one identity
 * source, using its known semantic (FIRST_NAME/LAST_NAME) or a neutral
 * fallback derived from its own label for custom fields.
 */
export function resolveIdentityPreviewToken(
  attribute: Pick<Attribute, "conceptCode" | "name" | "casingStrategy">,
): string {
  const conceptCode = attribute.conceptCode ?? null;
  const base =
    (conceptCode && IDENTITY_PREVIEW_BASE_BY_CONCEPT_CODE[conceptCode]) ||
    attribute.name?.trim() ||
    DEFAULT_IDENTITY_PREVIEW_BASE;

  return applyCasingPreview(base, attribute.casingStrategy ?? "NONE");
}

export function buildIdentityPreview(
  sortedSources: readonly Pick<Attribute, "conceptCode" | "name" | "casingStrategy">[],
): string {
  return sortedSources
    .map(resolveIdentityPreviewToken)
    .filter((token) => token.length > 0)
    .join(" ");
}
