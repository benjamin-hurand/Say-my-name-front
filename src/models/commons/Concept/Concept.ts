import { ValueType } from "../Attribute/Attribute";

export type ConceptPortabilityKind = "NONE" | "VALUE_ONLY" | "WITH_CONTEXT";
export type ConceptTenantUsagePolicy = "SINGLE" | "MULTIPLE";
export type ConceptDefaultCasingStrategy =
  | "NONE"
  | "TITLE_CASE"
  | "UPPERCASE"
  | "SENTENCE_PRESERVE";

export interface Concept {
  id: number;
  code: string;
  iconKey: string | null;
  valueType: ValueType;
  derived: boolean;
  portabilityKind: ConceptPortabilityKind;
  identityComponentEligible: boolean;
  tenantUsagePolicy: ConceptTenantUsagePolicy;
  defaultCasingStrategy: ConceptDefaultCasingStrategy | null;
}
