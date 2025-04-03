export interface ChallengeFilters {
  gameModeIds: number[];
  userPerformances: string[];
  attributeFilter: ChallengeAttributeFilterDto | null;
  participantsRangeMin: number | null;
  participantsRangeMax: number | null;
  questionsRangeMin: number | null;
  questionsRangeMax: number | null;
  dateRangeMin: string | null; // format ISO (ex: "2025-04-01")
  dateRangeMax: string | null;
}

export interface ChallengeAttributeFilterDto {
  attributeId: number;
  minValue: string;
  maxValue: string;
}

// Vous pouvez ensuite définir votre objet initial :
export const initialFilters: ChallengeFilters = {
  gameModeIds: [],
  userPerformances: [],
  attributeFilter: null,
  participantsRangeMin: null,
  participantsRangeMax: null,
  questionsRangeMin: null,
  questionsRangeMax: null,
  dateRangeMin: null,
  dateRangeMax: null,
};
