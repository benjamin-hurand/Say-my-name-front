import { z } from "zod";
import { CONSTRAINT_KINDS } from "./Attribute";

export const constraintPayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("NONE"),
  }),

  z.object({
    kind: z.literal("RANGE"),
    min: z.string().nullable().optional().default(null),
    max: z.string().nullable().optional().default(null),
    inclusive: z.boolean().nullable().optional().default(true),
    step: z.number().nullable().optional(),
  }),

  z.object({
    kind: z.literal("REGEX"),
    pattern: z.string().nullable().optional().default(null),
    minLength: z.number().int().nullable().optional(),
    maxLength: z.number().int().nullable().optional(),
    caseInsensitive: z.boolean().nullable().optional().default(false),
  }),

]);

export type ConstraintPayload = z.infer<typeof constraintPayloadSchema>;

export const isConstraintKind = (
  k: unknown,
): k is typeof CONSTRAINT_KINDS[number] =>
  typeof k === "string" && (CONSTRAINT_KINDS as readonly string[]).includes(k);