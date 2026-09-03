import type {
  ValueType,
  CasingStrategy,
  EditPolicy,
  ConstraintKind,
} from "./Attribute";
import type { ConstraintPayload } from "./constraintPayload.schema";

/**
 * Payload de création (côté admin)
 */
export interface CreateAttributePayload {
  name: string;
  type: ValueType;
  conceptId?: number | null;
  casingStrategy?: CasingStrategy;

  maxValues?: number;          // 0 = illimité
  primaryField?: boolean;
  category?: boolean;
  filter?: boolean;
  sort?: boolean;
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
export interface UpdateAttributePayload extends CreateAttributePayload {
  id: number;
  // version?: number; // décommente si tu ajoutes l’ETag côté back
}
