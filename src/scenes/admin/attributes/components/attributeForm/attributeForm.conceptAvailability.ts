import type { Attribute } from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type {
  ConfiguredConceptItem,
  ConceptLabelGetter,
} from "./attributeForm.types";

export type ConceptAvailability = {
  available: boolean;
  usedByAttributeId?: number;
  usedByAttributeName?: string;
};

export function resolveConceptAvailability(
  concepts: readonly Pick<Concept, "id">[],
  attributes: readonly Pick<Attribute, "id" | "conceptId" | "name">[],
  currentAttributeId?: number | null,
): Map<number, ConceptAvailability> {
  const availabilityByConceptId = new Map<number, ConceptAvailability>(
    concepts.map((concept) => [concept.id, { available: true }]),
  );

  for (const attribute of attributes) {
    if (attribute.id === currentAttributeId || attribute.conceptId == null) {
      continue;
    }

    if (!availabilityByConceptId.has(attribute.conceptId)) {
      continue;
    }

    availabilityByConceptId.set(attribute.conceptId, {
      available: false,
      usedByAttributeId: attribute.id,
      usedByAttributeName: attribute.name,
    });
  }

  return availabilityByConceptId;
}

export function filterAvailableConcepts<T extends Pick<Concept, "id">>(
  concepts: readonly T[],
  availabilityByConceptId: ReadonlyMap<number, ConceptAvailability>,
): T[] {
  return concepts.filter(
    (concept) =>
      availabilityByConceptId.get(concept.id)?.available !== false,
  );
}

export function resolveConfiguredConceptItems(
  concepts: readonly Concept[],
  attributes: readonly Attribute[],
  availabilityByConceptId: ReadonlyMap<number, ConceptAvailability>,
  getConceptLabel: ConceptLabelGetter,
): ConfiguredConceptItem[] {
  const attributesById = new Map(
    attributes.map((attribute) => [attribute.id, attribute]),
  );

  return concepts.flatMap((concept) => {
    const availability = availabilityByConceptId.get(concept.id);
    if (availability?.available !== false) {
      return [];
    }

    const attributeId = availability.usedByAttributeId ?? null;
    const attribute =
      attributeId == null ? undefined : attributesById.get(attributeId);

    return [{
      conceptId: concept.id,
      conceptLabel: getConceptLabel(concept),
      attributeId,
      attributeName:
        attribute?.name ?? availability.usedByAttributeName ?? "",
      attribute,
    }];
  });
}
