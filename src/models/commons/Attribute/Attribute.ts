// types/attributes.ts
import type { ConstraintPayload } from "./constraintPayload.schema";

/** ---- Listes canoniques ---- */
export const ATTRIBUTE_TYPES = [
  "TEXT", "NUMBER", "ENUM", "DATE", "DATETIME", "BOOLEAN", "URL", "EMAIL",
] as const;

export const CONSTRAINT_KINDS = [
  "NONE", "REGEX", "RANGE", "ENUM", "SET",
] as const;

export const CASING_STRATEGIES = [
  "NONE", "TITLE_CASE", "UPPERCASE", "SENTENCE_PRESERVE",
] as const;

export const EDIT_POLICIES = [
  "FREE", "RESTRICTED", "DERIVED",
] as const;

/** ---- Types dérivés (Single Source of Truth) ---- */
export type AttributeType   = typeof ATTRIBUTE_TYPES[number];
export type ConstraintKind  = typeof CONSTRAINT_KINDS[number];
export type CasingStrategy  = typeof CASING_STRATEGIES[number];
export type EditPolicy      = typeof EDIT_POLICIES[number];

/** ---- DTOs existants (inchangés) ---- */
export interface RangeConstraintDto {
  min?: string | null;
  max?: string | null;
  inclusive?: boolean | null;
  step?: number | null;
}
export interface RegexConstraintDto {
  pattern?: string | null;
  minLength?: number | null;
  maxLength?: number | null;
  caseInsensitive?: boolean | null;
}
export interface SetConstraintDto {
  values?: string[] | null;
  strict?: boolean | null;
}
export interface EnumConstraintDto {
  allowInactive?: boolean | null;
  storeCode?: boolean | null;
}
export interface ConstraintDto {
  kind: ConstraintKind;
  range?: RangeConstraintDto | null;
  regex?: RegexConstraintDto | null;
  set?: SetConstraintDto | null;
  enumRule?: EnumConstraintDto | null;
}

export interface AttributeStatsDto {
  observedMin: string | null;
  observedMax: string | null;
}
export interface AttributeEnumOptionDto {
  id: number;
  attributeId: number;
  code: string;
  label: string;
  orderIndex: number;
  active: boolean;
}
export type ConceptValueType = "TEXT" | "ENUM" | "DATETIME" | "NUMBER" | "BOOLEAN";
export type ConceptPortabilityKind = "NONE" | "VALUE_ONLY" | "WITH_CONTEXT";

export interface Attribute {
  id: number;

  conceptId?: number | null;
  conceptCode?: string | null;
  conceptValueType?: ConceptValueType | null;
  conceptDerived?: boolean | null;
  conceptPortabilityKind?: ConceptPortabilityKind | null;
  identityComponentEligible?: boolean | null;

  name: string;
  displayOrder?: number | null;
  identitySource?: boolean | null;
  category?: boolean | null;
  maxValues?: number | null;
  filter?: boolean | null;
  sort?: boolean | null;
  required?: boolean | null;
  type?: AttributeType | null;
  editPolicy?: EditPolicy | null;
  casingStrategy?: CasingStrategy | null;
  constraintKind?: ConstraintKind | null;
  constraintPayload?: ConstraintPayload | null;
  constraint?: ConstraintDto | null;
  stats?: AttributeStatsDto | null;
  options?: AttributeEnumOptionDto[] | null;
}

/** ---- Helpers optionnels ---- */
export const isRange = (c?: ConstraintDto | null): c is ConstraintDto & { range: RangeConstraintDto } =>
  !!c && c.kind === "RANGE" && !!c.range;
export const isRegex = (c?: ConstraintDto | null): c is ConstraintDto & { regex: RegexConstraintDto } =>
  !!c && c.kind === "REGEX" && !!c.regex;
export const isSet = (c?: ConstraintDto | null): c is ConstraintDto & { set: SetConstraintDto } =>
  !!c && c.kind === "SET" && !!c.set;
export const isEnumRule = (c?: ConstraintDto | null): c is ConstraintDto & { enumRule: EnumConstraintDto } =>
  !!c && c.kind === "ENUM" && !!c.enumRule;

/** (facultatif) Libellés UI centralisés */
export const CONSTRAINT_KIND_LABELS: Record<ConstraintKind, string> = {
  NONE: "Aucune",
  REGEX: "Expression régulière",
  RANGE: "Plage (nombre/date/datetime)",
  ENUM: "Règles ENUM",
  SET: "Liste de valeurs",
};
