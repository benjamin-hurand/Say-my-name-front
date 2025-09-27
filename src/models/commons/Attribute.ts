// types/attributes.ts

export type EditPolicy = 'FREE' | 'RESTRICTED';

export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'ENUM'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'URL'
  | 'EMAIL';

export type ConstraintKind = 'NONE' | 'REGEX' | 'RANGE' | 'ENUM' | 'SET';

/** ---- Constraint DTOs (typés) ---- */

export interface RangeConstraintDto {
  min?: string | null;        // "1970", "2000-01-01", etc.
  max?: string | null;        // "2050", "2030-12-31", etc.
  inclusive?: boolean | null; // défaut true côté back
  step?: number | null;       // pas numérique optionnel
}

export interface RegexConstraintDto {
  pattern?: string | null;
  minLength?: number | null;
  maxLength?: number | null;
  caseInsensitive?: boolean | null;
}

export interface SetConstraintDto {
  values?: string[] | null;   // petite liste inline
  strict?: boolean | null;    // défaut true côté back
}

export interface EnumConstraintDto {
  allowInactive?: boolean | null; // défaut false
  storeCode?: boolean | null;     // défaut true
}

export interface ConstraintDto {
  kind: ConstraintKind;
  range?: RangeConstraintDto | null;
  regex?: RegexConstraintDto | null;
  set?: SetConstraintDto | null;
  enumRule?: EnumConstraintDto | null;
}

/** ---- Stats observées (pour sliders) ---- */
export interface AttributeStatsDto {
  observedMin: string | null;
  observedMax: string | null;
}

/** ---- Options ENUM ---- */
export interface AttributeEnumOptionDto {
  id: number;
  attributeId: number;
  code: string;
  label: string;
  orderIndex: number;
  active: boolean;
}

/** ---- DTO principal renvoyé par le backend ---- */
export interface Attribute {
  id: number;
  name: string;

  displayOrder?: number | null;
  primaryField?: boolean | null;
  category?: boolean | null;

  maxValues?: number | null;
  filter?: boolean | null;
  sort?: boolean | null;
  initializable?: boolean | null;
  required?: boolean | null;

  type?: AttributeType | null;
  editPolicy?: EditPolicy | null;

  constraintKind?: ConstraintKind | null;
  constraintPayload?: Record<string, unknown> | null; // optionnel (debug/transparence)
  constraint?: ConstraintDto | null;                  // bloc typé pour l’UI

  stats?: AttributeStatsDto | null;                   // si expand=stats
  options?: AttributeEnumOptionDto[] | null;          // si expand=options (ou inclus sur /attributes)
}

/** ---- Helpers optionnels ---- */
export const isRange = (c?: ConstraintDto | null): c is ConstraintDto & { range: RangeConstraintDto } =>
  !!c && c.kind === 'RANGE' && !!c.range;

export const isRegex = (c?: ConstraintDto | null): c is ConstraintDto & { regex: RegexConstraintDto } =>
  !!c && c.kind === 'REGEX' && !!c.regex;

export const isSet = (c?: ConstraintDto | null): c is ConstraintDto & { set: SetConstraintDto } =>
  !!c && c.kind === 'SET' && !!c.set;

export const isEnumRule = (c?: ConstraintDto | null): c is ConstraintDto & { enumRule: EnumConstraintDto } =>
  !!c && c.kind === 'ENUM' && !!c.enumRule;
