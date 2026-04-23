import { z } from "zod";
import {
  ATTRIBUTE_TYPES,
  CASING_STRATEGIES,
  EDIT_POLICIES,
  CONSTRAINT_KINDS,
  type ValueType,
  type ConstraintKind,
} from "../../../../models/commons/Attribute/Attribute";
import {
  constraintPayloadSchema,
  type ConstraintPayload,
} from "../../../../models/commons/Attribute/constraintPayload.schema";

export const ValueTypeEnum = z.enum(ATTRIBUTE_TYPES);
export const CasingStrategyEnum = z.enum(CASING_STRATEGIES);
export const EditPolicyEnum = z.enum(EDIT_POLICIES);
export const ConstraintKindEnum = z.enum(CONSTRAINT_KINDS);

function isConstraintKindCompatibleWithType(
  type: ValueType,
  constraintKind: ConstraintKind,
): boolean {
  switch (constraintKind) {
    case "NONE":
      return true;
    case "RANGE":
      return type === "NUMBER" || type === "DATE" || type === "DATETIME";
    case "REGEX":
      return type === "TEXT";
    default:
      return true;
  }
}

export const attributeCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Nom requis"),

    conceptId: z.number().int().positive().nullable().default(null),

    type: ValueTypeEnum.default("TEXT"),
    casingStrategy: CasingStrategyEnum.default("NONE"),

    maxValues: z
      .number({ error: "Le nombre maximal de valeurs doit être un nombre" })
      .int("Le nombre maximal de valeurs doit être un entier")
      .min(1, "Le nombre maximal de valeurs doit être supérieur ou égal à 1")
      .default(1),

    primaryField: z.boolean().default(false),
    category: z.boolean().default(false),
    filter: z.boolean().default(false),
    sort: z.boolean().default(false),
    required: z.boolean().default(false),

    editPolicy: EditPolicyEnum.default("FREE"),
    constraintKind: ConstraintKindEnum.default("NONE"),
    constraintPayload: constraintPayloadSchema.default({ kind: "NONE" }),
    enumOptions: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.constraintPayload.kind !== data.constraintKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["constraintPayload"],
        message: "Le payload de contrainte ne correspond pas au type de contrainte sélectionné.",
      });
    }

    if (!isConstraintKindCompatibleWithType(data.type, data.constraintKind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["constraintKind"],
        message: "Cette contrainte n’est pas compatible avec le type de donnée sélectionné.",
      });
    }

    if (
      (data.type === "DATE" || data.type === "DATETIME" || data.type === "NUMBER") &&
      data.constraintKind === "RANGE" &&
      data.constraintPayload.kind === "RANGE"
    ) {
      const { min, max } = data.constraintPayload;

      if (
        data.type === "NUMBER" &&
        min != null &&
        max != null &&
        Number(min) > Number(max)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["constraintPayload", "max"],
          message: "La valeur maximale doit être supérieure ou égale à la valeur minimale.",
        });
      }
    }
  });

export type AttributeCreateFormInput = z.input<typeof attributeCreateSchema>;
export type AttributeCreateFormOutput = z.output<typeof attributeCreateSchema>;
export type AttributeCreateFormData = z.infer<typeof attributeCreateSchema>;
export type ConstraintPayloadForm = ConstraintPayload;