export type ConceptValueType = "TEXT" | "ENUM" | "DATETIME" | "NUMBER" | "BOOLEAN";
export type ConceptPortabilityKind = "NONE" | "VALUE_ONLY" | "WITH_CONTEXT";

export interface Concept {
  id: number;
  code: string;
  valueType: ConceptValueType;
  derived: boolean;
  portabilityKind: ConceptPortabilityKind;
  identityComponentEligible: boolean;
}