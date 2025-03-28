// FilterAndSortBar.types.ts
export interface ChallengeFilters {
    mode: string[];
    performance: string[];
    participantsRange: { min: number; max: number } | null;
    questionsRange: { min: number; max: number } | null;
    panel: string[];
    dateRange: { start: string; end: string } | null;
  }
  
  export const defaultFilters: ChallengeFilters = {
    mode: [],
    performance: [],
    participantsRange: null,
    questionsRange: null,
    panel: [],
    dateRange: null,
  };
  