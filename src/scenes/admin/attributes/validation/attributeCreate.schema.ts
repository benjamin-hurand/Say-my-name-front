import { z } from "zod";
import {
  ATTRIBUTE_TYPES,
  CASING_STRATEGIES,
  EDIT_POLICIES,
  CONSTRAINT_KINDS,
} from "../../../../models/commons/Attribute/Attribute";
import {
  constraintPayloadSchema,
  type ConstraintPayload,
} from "../../../../models/commons/Attribute/constraintPayload.schema";

// Zod enums générés depuis les constantes du modèle (SSOT)
export const AttributeTypeEnum     = z.enum(ATTRIBUTE_TYPES);
export const CasingStrategyEnum    = z.enum(CASING_STRATEGIES);
export const EditPolicyEnum        = z.enum(EDIT_POLICIES);
export const ConstraintKindEnum    = z.enum(CONSTRAINT_KINDS);

/**
 * Schéma de création/édition aligné sur le domaine
 */
export const attributeCreateSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: AttributeTypeEnum,
  casingStrategy: CasingStrategyEnum.default("NONE"),
  maxValues: z.number().int().min(0).default(1),

  primaryField: z.boolean().default(false),
  category: z.boolean().default(false),
  filter: z.boolean().default(false),
  sort: z.boolean().default(false),
  required: z.boolean().default(false),
  initializable: z.boolean().default(false),

  editPolicy: EditPolicyEnum.default("FREE"),
  constraintKind: ConstraintKindEnum.default("NONE"),

  // On réutilise le schéma du modèle → zéro drift
  constraintPayload: constraintPayloadSchema.optional(),
});

export type AttributeCreateFormData = z.infer<typeof attributeCreateSchema>;
export type ConstraintPayloadForm = ConstraintPayload; // alias pratique si tu veux
