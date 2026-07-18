import type {
  CasingStrategy,
  ConstraintKind,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";

type ConstraintPayloadValue = AttributeCreateFormInput["constraintPayload"];

type ConfigValues = Pick<
  AttributeCreateFormInput,
  "casingStrategy" | "constraintKind" | "constraintPayload" | "enumOptions"
>;

export type SanitizedAttributeConfig = Partial<ConfigValues>;

type SanitizeConfigForValueTypeArgs = {
  previousValueType?: ValueType | null;
  nextValueType: ValueType;
  values: Partial<ConfigValues>;
};

const NONE_CONSTRAINT: ConstraintPayloadValue = { kind: "NONE" };

function resetConstraint(patch: SanitizedAttributeConfig): void {
  patch.constraintKind = "NONE";
  patch.constraintPayload = NONE_CONSTRAINT;
}

function isRangeCapableType(type: ValueType): boolean {
  return type === "NUMBER" || type === "DATE" || type === "DATETIME";
}

function isConstraintKindCompatible(type: ValueType, kind?: ConstraintKind | null): boolean {
  if (!kind || kind === "NONE") return true;
  if (kind === "REGEX") return type === "TEXT";
  if (kind === "RANGE") return isRangeCapableType(type);
  return false;
}

function isRangePayload(
  payload: unknown,
): payload is Extract<ConstraintPayloadValue, { kind: "RANGE" }> {
  return (
    !!payload &&
    typeof payload === "object" &&
    (payload as { kind?: unknown }).kind === "RANGE"
  );
}

function isFiniteNumberLike(value: unknown): boolean {
  if (value == null || value === "") return true;
  return Number.isFinite(Number(value));
}

function toNullableString(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function toDateTimeValue(value: unknown): string | null {
  const raw = toNullableString(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0, 16);
  return raw;
}

function toDateValue(value: unknown): string | null {
  const raw = toNullableString(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return raw;
}

function normalizeRangeConstraint(
  previousValueType: ValueType | null | undefined,
  nextValueType: ValueType,
  payload: ConstraintPayloadValue | undefined,
): ConstraintPayloadValue | null {
  if (!isRangePayload(payload)) return null;

  if (nextValueType === "NUMBER") {
    if (!isFiniteNumberLike(payload.min) || !isFiniteNumberLike(payload.max)) return null;

    return {
      ...payload,
      min: toNullableString(payload.min),
      max: toNullableString(payload.max),
      inclusive: payload.inclusive ?? true,
    };
  }

  if (nextValueType === "DATETIME") {
    const shouldConvertFromDate = previousValueType === "DATE";

    return {
      ...payload,
      min: shouldConvertFromDate ? toDateTimeValue(payload.min) : toNullableString(payload.min),
      max: shouldConvertFromDate ? toDateTimeValue(payload.max) : toNullableString(payload.max),
      inclusive: payload.inclusive ?? true,
    };
  }

  if (nextValueType === "DATE") {
    const shouldConvertFromDateTime = previousValueType === "DATETIME";

    return {
      ...payload,
      min: shouldConvertFromDateTime ? toDateValue(payload.min) : toNullableString(payload.min),
      max: shouldConvertFromDateTime ? toDateValue(payload.max) : toNullableString(payload.max),
      inclusive: payload.inclusive ?? true,
    };
  }

  return null;
}

function shouldResetCasing(nextValueType: ValueType, current?: CasingStrategy | null): boolean {
  return nextValueType !== "TEXT" && current != null && current !== "NONE";
}

export function sanitizeConfigForValueType({
  previousValueType,
  nextValueType,
  values,
}: SanitizeConfigForValueTypeArgs): SanitizedAttributeConfig {
  const patch: SanitizedAttributeConfig = {};

  if (
    nextValueType !== "ENUM" &&
    Array.isArray(values.enumOptions) &&
    values.enumOptions.length > 0
  ) {
    patch.enumOptions = [];
  }

  if (shouldResetCasing(nextValueType, values.casingStrategy)) {
    patch.casingStrategy = "NONE";
  }

  const currentKind = values.constraintKind ?? values.constraintPayload?.kind ?? "NONE";

  if (!isConstraintKindCompatible(nextValueType, currentKind)) {
    resetConstraint(patch);
    return patch;
  }

  if (currentKind === "RANGE") {
    const nextPayload = normalizeRangeConstraint(
      previousValueType,
      nextValueType,
      values.constraintPayload,
    );

    if (!nextPayload) {
      resetConstraint(patch);
      return patch;
    }

    patch.constraintKind = "RANGE";
    patch.constraintPayload = nextPayload;
  }

  if (currentKind === "REGEX" && values.constraintPayload?.kind !== "REGEX") {
    resetConstraint(patch);
  }

  return patch;
}
