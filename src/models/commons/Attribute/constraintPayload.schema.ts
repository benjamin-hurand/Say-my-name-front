import { z } from "zod";
import {
  CONSTRAINT_KINDS,
} from "./Attribute";

/**
 * Schéma Zod du payload de contrainte, aligné sur ton domaine:
 * - Discriminé par `kind` (NONE / REGEX / RANGE / ENUM / SET)
 * - Champs optionnels/marqués nullable pour coller au backend
 */
export const constraintPayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("NONE") }),

  z.object({
    kind: z.literal("RANGE"),
    min: z.string().nullable().optional(),
    max: z.string().nullable().optional(),
    inclusive: z.boolean().nullable().optional(),
    step: z.number().nullable().optional(),
  }),

  z.object({
    kind: z.literal("REGEX"),
    pattern: z.string().nullable().optional(),
    minLength: z.number().int().nullable().optional(),
    maxLength: z.number().int().nullable().optional(),
    caseInsensitive: z.boolean().nullable().optional(),
  }),

  z.object({
    kind: z.literal("SET"),
    values: z.array(z.string()).nullable().optional(),
    strict: z.boolean().nullable().optional(),
  }),

  z.object({
    kind: z.literal("ENUM"),
    allowInactive: z.boolean().nullable().optional(),
    storeCode: z.boolean().nullable().optional(),
  }),
]);

// Type TS dérivé du schéma (Single Source of Truth)
export type ConstraintPayload = z.infer<typeof constraintPayloadSchema>;

// Petite garde en runtime si besoin (optionnelle)
export const isConstraintKind = (k: unknown): k is typeof CONSTRAINT_KINDS[number] =>
  typeof k === "string" && (CONSTRAINT_KINDS as readonly string[]).includes(k);
