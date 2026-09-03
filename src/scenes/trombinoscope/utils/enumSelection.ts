export type EnumSelectionMode = "single" | "multiple";

export function resolveEnumSelectionMode(maxValues?: number | null): EnumSelectionMode {
  return maxValues === 1 ? "single" : "multiple";
}
