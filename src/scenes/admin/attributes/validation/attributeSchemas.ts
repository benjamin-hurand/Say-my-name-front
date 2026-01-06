import { z } from "zod";

// Enums alignés domaine
const AttributeTypeEnum = z.enum([
  "TEXT",
  "NUMBER",
  "ENUM",
  "DATE",
  "DATETIME",
  "BOOLEAN",
  "URL",
  "EMAIL",
]);

const CasingStrategyEnum = z.enum([
  "NONE",
  "TITLE_CASE",
  "UPPERCASE",
  "SENTENCE_PRESERVE",
]);

const EditPolicyEnum = z.enum(["FREE", "RESTRICTED"]);

const ConstraintKindEnum = z.enum(["NONE", "REGEX", "RANGE", "ENUM", "SET"]);

// Payloads de contrainte alignés domaine
export const constraintUnion = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("NONE") }),

  // RANGE: min/max string (nombre OU date), inclusive?, step?
  z.object({
    kind: z.literal("RANGE"),
    min: z.string().nullable().optional(),
    max: z.string().nullable().optional(),
    inclusive: z.boolean().nullable().optional(),
    step: z.number().nullable().optional(),
  }),

  // REGEX: pattern?, minLength?, maxLength?, caseInsensitive?
  z.object({
    kind: z.literal("REGEX"),
    pattern: z.string().nullable().optional(),
    minLength: z.number().int().nullable().optional(),
    maxLength: z.number().int().nullable().optional(),
    caseInsensitive: z.boolean().nullable().optional(),
  }),

  // SET: values[], strict?
  z.object({
    kind: z.literal("SET"),
    values: z.array(z.string()).nullable().optional(),
    strict: z.boolean().nullable().optional(),
  }),

  // ENUM: flags optionnels
  z.object({
    kind: z.literal("ENUM"),
    allowInactive: z.boolean().nullable().optional(),
    storeCode: z.boolean().nullable().optional(),
  }),
]);

export const attributeCreateSchema = z.object({
  name: z.string().min(1),
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

  // ⚠️ Aligné: plus de ENUM_VALUES / NUMBER_RANGE / DATE_RANGE / LENGTH / UNIQUE
  constraintKind: ConstraintKindEnum.default("NONE"),
  constraintPayload: constraintUnion.optional(),
});
