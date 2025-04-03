export interface ChallengeSortCriterionDto {
    type: "CREATION_DATE" | "POPULARITY" | "LENGTH" | "PERFORMANCE";
    order: "asc" | "desc";
  }