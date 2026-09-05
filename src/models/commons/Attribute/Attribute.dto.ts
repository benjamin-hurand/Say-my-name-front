import type {
  ValueType,
  CasingStrategy,
  EditPolicy,
  ConstraintKind,
} from "./Attribute";
import type { ConstraintPayload } from "./constraintPayload.schema";

/**
 * Payload de création (côté admin).
 *
 * `filter`/`sort` sont volontairement absents : ces capacités sont dérivées
 * du type par le backend (voir AttributeCapabilities), l'admin ne les
 * choisit plus champ par champ.
 */
export interface CreateAttributePayload {
  name: string;
  type: ValueType;
  conceptId?: number | null;
  casingStrategy?: CasingStrategy;

  maxValues?: number;
  identitySource?: boolean;
  required?: boolean;

  editPolicy?: EditPolicy;

  constraintKind?: ConstraintKind;
  constraintPayload?: ConstraintPayload | null;

  /** Options initiales pour les attributs de type ENUM (à la création) */
  enumOptions?: string[];

  displayOrder?: number | null;
}

/**
 * Payload de mise à jour
 */
export type UpdateAttributePayload = CreateAttributePayload;
