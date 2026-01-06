import type {
  AttributeType,
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
  type: AttributeType;
  casingStrategy?: CasingStrategy;

  maxValues?: number;          // 0 = illimité
  primaryField?: boolean;
  category?: boolean;
  filter?: boolean;
  sort?: boolean;
  required?: boolean;
  initializable?: boolean;

  editPolicy?: EditPolicy;

  constraintKind?: ConstraintKind;
  constraintPayload?: ConstraintPayload | null;

  displayOrder?: number | null;
}

/**
 * Payload de mise à jour
 */
export interface UpdateAttributePayload extends CreateAttributePayload {
  id: number;
  // version?: number; // décommente si tu ajoutes l’ETag côté back
}

/** (optionnel) DTO d’usage pour affichage d’impacts avant suppression */
export interface AttributeUsageDto {
  persons: number;
  gamemodes: number;
}
