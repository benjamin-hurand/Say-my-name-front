import type {
  CasingStrategy,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";

type ResolveSuggestedCasingStrategyArgs = {
  recommendedStrategy: CasingStrategy | null | undefined;
  currentValue: CasingStrategy;
  isCustomized: boolean;
  valueType: ValueType;
};

export function resolveSuggestedCasingStrategy({
  recommendedStrategy,
  currentValue,
  isCustomized,
  valueType,
}: ResolveSuggestedCasingStrategyArgs): CasingStrategy {
  if (valueType !== "TEXT") return "NONE";
  if (isCustomized) return currentValue;
  return recommendedStrategy ?? "NONE";
}

export function isCasingApplicable(valueType: ValueType, isDerived: boolean): boolean {
  return valueType === "TEXT" && !isDerived;
}

export function applyCasingPreview(
  source: string,
  strategy: CasingStrategy,
): string {
  const normalized = source.trim().replace(/\s+/g, " ");

  switch (strategy) {
    case "NONE":
      return normalized;
    case "SENTENCE_PRESERVE":
      return capitalizeFirstLetterPreserveRest(normalized);
    case "TITLE_CASE":
      return normalized.split(" ").map(capitalizeToken).join(" ");
    case "UPPERCASE":
      return normalized.toLocaleUpperCase("fr-FR");
    default:
      return normalized;
  }
}

function capitalizeFirstLetterPreserveRest(value: string): string {
  const characters = Array.from(value);
  const letterIndex = characters.findIndex((character) => /\p{L}/u.test(character));
  if (letterIndex < 0) return value;

  characters[letterIndex] = characters[letterIndex].toLocaleUpperCase("fr-FR");
  return characters.join("");
}

function capitalizeToken(token: string): string {
  return token
    .split(/([-'])/)
    .map((part) => {
      if (part === "-" || part === "'" || !part) return part;

      const [first, ...rest] = Array.from(part);
      return (
        first.toLocaleUpperCase("fr-FR") +
        rest.join("").toLocaleLowerCase("fr-FR")
      );
    })
    .join("");
}
