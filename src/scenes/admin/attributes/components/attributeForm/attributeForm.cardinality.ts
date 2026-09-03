export type ConceptMaxValuesState = {
  value: number;
  locked: boolean;
};

export function resolveConceptMaxValues(
  requiredMaxValues: number | null | undefined,
  currentMaxValues: number,
): ConceptMaxValuesState {
  if (requiredMaxValues == null) {
    return { value: currentMaxValues, locked: false };
  }

  return { value: requiredMaxValues, locked: true };
}
