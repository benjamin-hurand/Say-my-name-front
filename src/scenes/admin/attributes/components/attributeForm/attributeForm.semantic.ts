import type {
  Attribute,
  CasingStrategy,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import {
  getConceptCode,
  isConceptDerived,
  isIdentityComponentEligible,
} from "./attributeForm.helpers";
import { isCasingApplicable } from "./attributeForm.casing";

export const DEFAULT_CUSTOM_VALUE_TYPE: ValueType = "TEXT";

export type FieldSemanticContext = {
  isCustom: boolean;
  concept: Concept | null;
  semanticPresetCode: string | null;
  effectiveValueType: ValueType;
  lockedValueType: ValueType | null;
  isDerived: boolean;
  identityComponentEligible: boolean;
  defaultCasingStrategy: CasingStrategy | null;
  casingApplicable: boolean;
  requiredMaxValues: number | null;
};

type GetEffectiveValueTypeArgs = {
  concept?: Concept | null;
  formType?: ValueType | null;
  initial?: Attribute;
  fallback?: ValueType;
};

type ResolveFieldSemanticContextArgs = {
  conceptOptions: Concept[];
  conceptId?: number | null;
  formType?: ValueType | null;
  initial?: Attribute;
  fallbackValueType?: ValueType;
};

export function isCustomConcept(conceptId?: number | null): boolean {
  return conceptId == null;
}

export function getEffectiveValueType({
  concept,
  formType,
  initial,
  fallback = DEFAULT_CUSTOM_VALUE_TYPE,
}: GetEffectiveValueTypeArgs): ValueType {
  return concept?.valueType ?? formType ?? initial?.type ?? fallback;
}

export function resolveFieldSemanticContext({
  conceptOptions,
  conceptId,
  formType,
  initial,
  fallbackValueType = DEFAULT_CUSTOM_VALUE_TYPE,
}: ResolveFieldSemanticContextArgs): FieldSemanticContext {
  const concept = conceptOptions.find((option) => option.id === conceptId) ?? null;
  const custom = isCustomConcept(conceptId);
  const semanticPresetCode = concept?.code ?? (!custom ? getConceptCode(initial) : null);
  const lockedValueType = concept?.valueType ?? null;
  const effectiveValueType = getEffectiveValueType({
    concept,
    formType,
    initial,
    fallback: fallbackValueType,
  });
  const derived = concept?.derived ?? (!custom ? isConceptDerived(initial) : false);

  return {
    isCustom: custom,
    concept,
    semanticPresetCode,
    effectiveValueType,
    lockedValueType,
    isDerived: derived,
    identityComponentEligible:
      concept?.identityComponentEligible ??
      (!custom ? isIdentityComponentEligible(initial) : false),
    defaultCasingStrategy: concept?.defaultCasingStrategy ?? null,
    casingApplicable: isCasingApplicable(effectiveValueType, derived),
    requiredMaxValues: concept?.requiredMaxValues ?? null,
  };
}
