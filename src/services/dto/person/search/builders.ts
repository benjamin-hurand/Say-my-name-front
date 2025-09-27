// src/services/dto/person/search/builders.ts
import { AttributeFilterDto, SortDirectiveDto } from "./PersonSearchRequestDto";

export const filterIn = (attributeId: number, ...values: (string | number)[]): AttributeFilterDto => ({
  attributeId,
  operator: "IN",
  values: values.map(String),
});

export const filterLike = (attributeId: number, pattern: string): AttributeFilterDto => ({
  attributeId,
  operator: "LIKE",
  values: [pattern],
});

export const filterRange = (attributeId: number, min?: string | number, max?: string | number): AttributeFilterDto => ({
  attributeId,
  operator: "RANGE",
  values: [
    min == null ? "" : String(min),
    max == null ? "" : String(max),
  ],
});

export const sortByAttribute = (
  attributeId: number,
  direction: "ASC" | "DESC" = "ASC"
): SortDirectiveDto => ({
  kind: "ATTRIBUTE",
  attributeId,
  direction,
});

export const sortByField = (
  field: string,
  direction: "ASC" | "DESC" = "ASC"
): SortDirectiveDto => ({
  kind: "FIELD",
  field,
  direction,
});
