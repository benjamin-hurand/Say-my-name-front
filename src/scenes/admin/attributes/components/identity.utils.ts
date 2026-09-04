import { applyCasingPreview } from "./attributeForm/attributeForm.casing.ts";
import type { Attribute } from "../../../../models/commons/Attribute/Attribute";

export function isSystemIdentityConcept(a: Pick<Attribute, "conceptCode">): boolean {
  return a.conceptCode === "IDENTITY";
}

export function excludeSystemIdentity<T extends Pick<Attribute, "conceptCode">>(
  rows: readonly T[],
): T[] {
  return rows.filter((row) => !isSystemIdentityConcept(row));
}

const IDENTITY_PREVIEW_BASE_BY_CONCEPT_CODE: Record<string, string> = {
  FIRST_NAME: "jean",
  LAST_NAME: "dupont",
};

const DEFAULT_IDENTITY_PREVIEW_BASE = "exemple";

/**
 * Builds a deterministic, non-persisted example value for one identity
 * component, using its known semantic (FIRST_NAME/LAST_NAME) or a neutral
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

/**
 * Composes the displayed-name preview strictly as FIRST_NAME then LAST_NAME
 * (the backend's fixed semantic order — never influenced by displayOrder).
 */
export function buildIdentityPreview(
  sources: readonly Pick<Attribute, "conceptCode" | "name" | "casingStrategy">[],
): string {
  return sources
    .map(resolveIdentityPreviewToken)
    .filter((token) => token.length > 0)
    .join(" ");
}

type IdentitySourceAttribute = Pick<Attribute, "conceptCode" | "name" | "casingStrategy">;

export type DisplayNameSummary =
  | { kind: "empty" }
  | {
      kind: "composed";
      labelKey: "BOTH_LABEL" | "FIRST_ONLY_LABEL" | "LAST_ONLY_LABEL";
      preview: string;
    };

/**
 * Pure summary of what the backend will display as a person's name, given
 * only the FIRST_NAME and LAST_NAME attributes (the only two Concepts the
 * backend ever composes IDENTITY from for the MVP).
 */
export function resolveDisplayNameSummary(
  firstName: IdentitySourceAttribute | null,
  lastName: IdentitySourceAttribute | null,
): DisplayNameSummary {
  if (!firstName && !lastName) {
    return { kind: "empty" };
  }

  const labelKey =
    firstName && lastName ? "BOTH_LABEL" : firstName ? "FIRST_ONLY_LABEL" : "LAST_ONLY_LABEL";

  return {
    kind: "composed",
    labelKey,
    preview: buildIdentityPreview([firstName, lastName].filter(Boolean) as IdentitySourceAttribute[]),
  };
}
