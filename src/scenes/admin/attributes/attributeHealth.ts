import type { Attribute, ValueType } from "../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../models/commons/Concept/Concept";

/**
 * Every tag here is a real, backend-verifiable configuration problem the
 * admin can act on -- never a usage suggestion (e.g. "not filterable/sortable").
 * A concept-valid field like GENDER, which only feeds distractor selection
 * and exposes no filter/sort/required toggle, must never surface here.
 */
export type AttributeIssueTag = "concept-type-mismatch" | "enum-without-options";

export const ATTRIBUTE_ISSUE_SEVERITY: Record<AttributeIssueTag, "warning" | "error"> = {
  "concept-type-mismatch": "error",
  "enum-without-options": "warning",
};

export function getConceptId(a: Attribute): number | null {
  return a.conceptId ?? null;
}

export function getConceptCode(a: Attribute): string | null {
  return a.conceptCode ?? null;
}

export function getValueType(a: Attribute): ValueType | null {
  return a.type ?? null;
}

export function getOptionsCount(a: Attribute): number {
  return Array.isArray(a.options) ? a.options.length : 0;
}

export function getConceptValueType(
  attribute: Attribute,
  conceptsById: Map<number, Concept>,
  conceptsByCode: Map<string, Concept>,
): ValueType | null {
  const conceptId = getConceptId(attribute);
  if (conceptId != null) {
    return conceptsById.get(conceptId)?.valueType ?? null;
  }

  const conceptCode = getConceptCode(attribute);
  if (conceptCode) {
    return conceptsByCode.get(conceptCode)?.valueType ?? null;
  }

  return null;
}

export function isValueTypeCompatibleWithConcept(
  attribute: Attribute,
  conceptsById: Map<number, Concept>,
  conceptsByCode: Map<string, Concept>,
): boolean {
  const attributeType = getValueType(attribute);
  const conceptValueType = getConceptValueType(attribute, conceptsById, conceptsByCode);

  if (!conceptValueType || !attributeType) {
    return true;
  }

  return attributeType === conceptValueType;
}

export function computeAttributeIssueTags(
  attribute: Attribute,
  conceptsById: Map<number, Concept>,
  conceptsByCode: Map<string, Concept>,
): AttributeIssueTag[] {
  const tags: AttributeIssueTag[] = [];

  if (!isValueTypeCompatibleWithConcept(attribute, conceptsById, conceptsByCode)) {
    tags.push("concept-type-mismatch");
  }

  if (getValueType(attribute) === "ENUM" && getOptionsCount(attribute) === 0) {
    tags.push("enum-without-options");
  }

  return tags;
}
