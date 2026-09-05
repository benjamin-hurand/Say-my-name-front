import type { ConstraintPayload } from "./constraintPayload.schema";

/** ---- Listes canoniques ---- */
export const ATTRIBUTE_TYPES = [
  "TEXT",
  "NUMBER",
  "ENUM",
  "DATE",
  "DATETIME",
  "BOOLEAN",
] as const;

export const CONSTRAINT_KINDS = [
  "NONE",
  "REGEX",
  "RANGE",
] as const;

export const CASING_STRATEGIES = [
  "NONE",
  "TITLE_CASE",
  "UPPERCASE",
  "SENTENCE_PRESERVE",
] as const;

export const EDIT_POLICIES = [
  "FREE",
  "RESTRICTED",
  "DERIVED",
] as const;

/** ---- Types dérivés ---- */
export type ValueType = typeof ATTRIBUTE_TYPES[number];
export type ConstraintKind = typeof CONSTRAINT_KINDS[number];
export type CasingStrategy = typeof CASING_STRATEGIES[number];
export type EditPolicy = typeof EDIT_POLICIES[number];

/** ---- Types liés aux concepts ---- */
export type ConceptPortabilityKind = "NONE" | "VALUE_ONLY" | "WITH_CONTEXT";

/** ---- DTOs de contraintes legacy/back ---- */
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

export interface ConstraintDto {
  kind: ConstraintKind;
  range?: RangeConstraintDto | null;
  regex?: RegexConstraintDto | null;
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

/** Impact de suppression d'un attribut, calculé côté backend (admin uniquement). */
export interface AttributeDeletionImpact {
  factCount: number;
  personCount: number;
  courseCount: number;
  pendingChangeRequestCount: number;
  canDelete: boolean;
}

/** ---- Modèle principal ---- */
export interface Attribute {
  id: number;

  /** Concept lié */
  conceptId?: number | null;
  conceptCode?: string | null;
  conceptValueType?: ValueType | null;
  conceptDerived?: boolean | null;
  conceptPortabilityKind?: ConceptPortabilityKind | null;
  identityComponentEligible?: boolean | null;

  /** Configuration locale */
  name: string;
  displayOrder?: number | null;
  identitySource?: boolean | null;
  maxValues?: number | null;
  filter?: boolean | null;
  sort?: boolean | null;
  required?: boolean | null;
  type?: ValueType | null;
  editPolicy?: EditPolicy | null;
  casingStrategy?: CasingStrategy | null;

  /** Contraintes */
  constraintKind?: ConstraintKind | null;
  constraintPayload?: ConstraintPayload | null;

  /**
   * Legacy / compat read-side éventuelle.
   * À supprimer plus tard si tout le front passe sur constraintPayload.
   */
  constraint?: ConstraintDto | null;

  /** Données auxiliaires */
  stats?: AttributeStatsDto | null;
  options?: AttributeEnumOptionDto[] | null;
  deletionImpact?: AttributeDeletionImpact | null;
}

/** ---- Helpers optionnels ---- */
export const isRange = (
  c?: ConstraintDto | null,
): c is ConstraintDto & { range: RangeConstraintDto } =>
  !!c && c.kind === "RANGE" && !!c.range;

export const isRegex = (
  c?: ConstraintDto | null,
): c is ConstraintDto & { regex: RegexConstraintDto } =>
  !!c && c.kind === "REGEX" && !!c.regex;

/** ---- Libellés UI centralisés ---- */
export const CONSTRAINT_KIND_LABELS: Record<ConstraintKind, string> = {
  NONE: "Aucune",
  REGEX: "Expression régulière",
  RANGE: "Plage",
};
