export function isIdentitySourceEligible({
  isCustom,
  conceptEligible,
  valueType,
  maxValues,
  conceptCode,
}: {
  isCustom: boolean;
  conceptEligible: boolean;
  valueType: string;
  maxValues: number;
  conceptCode?: string | null;
}): boolean {
  return (
    conceptCode !== "IDENTITY" &&
    valueType === "TEXT" &&
    maxValues === 1 &&
    (isCustom || conceptEligible)
  );
}
