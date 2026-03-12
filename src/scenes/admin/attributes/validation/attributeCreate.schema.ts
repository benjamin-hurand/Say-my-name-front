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

export const AttributeTypeEnum = z.enum(ATTRIBUTE_TYPES);
export const CasingStrategyEnum = z.enum(CASING_STRATEGIES);
export const EditPolicyEnum = z.enum(EDIT_POLICIES);
export const ConstraintKindEnum = z.enum(CONSTRAINT_KINDS);

export const attributeCreateSchema = z.object({
  name: z.string().min(1, "Nom requis"),

  conceptId: z.number().int().positive().nullable().optional(),

  type: AttributeTypeEnum,
  casingStrategy: CasingStrategyEnum.default("NONE"),
  maxValues: z
    .number({ error: "Max values doit être un nombre" })
    .int("Max values doit être un entier")
    .min(0, "Max values doit être supérieur ou égal à 0")
    .default(1),

  primaryField: z.boolean().default(false),
  category: z.boolean().default(false),
  filter: z.boolean().default(false),
  sort: z.boolean().default(false),
  required: z.boolean().default(false),

  editPolicy: EditPolicyEnum.default("FREE"),
  constraintKind: ConstraintKindEnum.default("NONE"),
  constraintPayload: constraintPayloadSchema.optional(),
});

export type AttributeCreateFormInput = z.input<typeof attributeCreateSchema>;
export type AttributeCreateFormOutput = z.output<typeof attributeCreateSchema>;
export type AttributeCreateFormData = z.infer<typeof attributeCreateSchema>;
export type ConstraintPayloadForm = ConstraintPayload;