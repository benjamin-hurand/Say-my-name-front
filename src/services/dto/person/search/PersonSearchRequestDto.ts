// src/services/dto/person/search/PersonSearchRequestDto.ts
export type FollowFilter = "ALL" | "FOLLOWED" | "UNFOLLOWED";

export interface AttributeFilterDto {
  attributeId: number;          // ex: 4 (promo)
  operator?: "IN" | "LIKE" | "RANGE";
  values?: string[];            // IN/LIKE: ["2024", "2023"] ; RANGE: ["min","max"]
}

export interface SortDirectiveDto {
  kind: "ATTRIBUTE" | "FIELD";
  attributeId?: number;         // requis si kind="ATTRIBUTE"
  field?: string;               // ex: "id"
  direction?: "ASC" | "DESC";
}

export interface PersonSearchRequestDto {
  filters?: AttributeFilterDto[];
  sort?: SortDirectiveDto[];
  followFilter?: FollowFilter;
  includeContextAttributes?: boolean; // pour remonter extraAttributes
}
