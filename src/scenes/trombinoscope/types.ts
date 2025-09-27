export type SortValue =
  | { kind: "ATTRIBUTE"; attributeId: number; direction: "ASC" | "DESC" }
  | { kind: "FIELD"; field: string; direction: "ASC" | "DESC" };
