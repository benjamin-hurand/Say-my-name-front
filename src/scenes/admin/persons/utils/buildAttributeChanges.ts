// src/scenes/admin/persons/utils/buildAttributeChanges.ts
import { AttributeChanges } from "../../../../models/commons/Profile/AttributesChanges";

export type ExistingValue = { id: number; value: string };

export function buildAttributeChanges(
  existing: ExistingValue[],
  nextValues: string[],
  maxValues?: number | null
): AttributeChanges {
  const cleaned = nextValues.map((v) => v.trim()).filter((v) => v.length > 0);

  const uniqueOrdered: string[] = [];
  const seen = new Set<string>();
  for (const v of cleaned) {
    if (!seen.has(v)) {
      seen.add(v);
      uniqueOrdered.push(v);
    }
  }

  const limit = maxValues && maxValues > 0 ? maxValues : undefined;
  const normalizedNext = limit ? uniqueOrdered.slice(0, limit) : uniqueOrdered;

  const byValue = new Map(existing.map((v) => [v.value, v]));
  const keptIds = new Set<number>();

  const create: AttributeChanges["create"] = [];
  for (const val of normalizedNext) {
    const match = byValue.get(val);
    if (match) keptIds.add(match.id);
    else create.push({ value: val });
  }

  const del: AttributeChanges["delete"] = existing
    .filter((v) => !keptIds.has(v.id))
    .map((v) => ({ id: v.id }));

  return { create, update: [], delete: del };
}
