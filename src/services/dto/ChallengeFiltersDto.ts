import { ChallengeAttributeFilterDto } from "./ChallengeAttributeFilterDto";

export interface ChallengeFiltersDto {
    gameModeIds: number[];
    userPerformances: string[]; // par exemple, les clés de l'enum UserPerformance
    attributeFilter?: ChallengeAttributeFilterDto | null;
    participantsRangeMin?: number | null;
    participantsRangeMax?: number | null;
    questionsRangeMin?: number | null;
    questionsRangeMax?: number | null;
    dateRangeMin?: string | null; // Format ISO (ex: "2025-04-01")
    dateRangeMax?: string | null;
  }