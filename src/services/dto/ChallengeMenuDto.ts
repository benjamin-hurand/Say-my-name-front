import { ChallengeFiltersDto } from "./ChallengeFiltersDto";
import { ChallengeSortCriterionDto } from "./ChallengeSortCriterionDto";

export interface ChallengeMenuDto {
    userId: number;
    seasonStart: string; // Format ISO (ex: "2025-04-01T00:00:00")
    search: string;
    filters: ChallengeFiltersDto;
    sorts: ChallengeSortCriterionDto[];
  }