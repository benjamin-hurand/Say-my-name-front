import type { Attribute } from "../../../../models/commons/Attribute/Attribute";

/**
 * Standard identity fields form a fixed, non-draggable block at the top of
 * the attribute list (product decision). Their relative order here is
 * semantic, never derived from displayOrder, which may be stale or
 * inconsistent with this order in existing data.
 */
export const STANDARD_CONCEPT_ORDER = ["FIRST_NAME", "LAST_NAME", "GENDER"] as const;

export type StandardConceptCode = (typeof STANDARD_CONCEPT_ORDER)[number];

export function isStandardAttribute(row: Pick<Attribute, "conceptCode">): boolean {
  return (
    !!row.conceptCode &&
    (STANDARD_CONCEPT_ORDER as readonly string[]).includes(row.conceptCode)
  );
}

/**
 * Splits attributes into the fixed-order standard block and the
 * freely-reorderable custom rest. Standards are always resorted to
 * STANDARD_CONCEPT_ORDER regardless of input order; customs keep the
 * relative order they arrive in (callers sort by displayOrder beforehand).
 */
export function splitStandardAndCustomAttributes<T extends Pick<Attribute, "conceptCode">>(
  rows: readonly T[]
): { standards: T[]; customs: T[] } {
  const standards: T[] = [];
  const customs: T[] = [];

  for (const row of rows) {
    if (isStandardAttribute(row)) standards.push(row);
    else customs.push(row);
  }

  standards.sort(
    (a, b) =>
      STANDARD_CONCEPT_ORDER.indexOf(a.conceptCode as StandardConceptCode) -
      STANDARD_CONCEPT_ORDER.indexOf(b.conceptCode as StandardConceptCode)
  );

  return { standards, customs };
}
