import { PopulationScope } from "./CourseDto";

// src/dto/courses/CourseStatsDto.ts
export interface CourseStatsDto {
  // Meta
  courseId: number;
  userId: number;
  gameModeId: number;
  populationScope: PopulationScope;

  // Répartition
  unknown: number;
  discovered: number;
  learned: number;
  mastered: number;
  createdTotal: number;

  // Candidats & univers
  totalCandidates: number;
  universeEligible: number;

  // Dérivés UI
  knownTotal: number;
  remainingUnseen: number;
  progressPercent: number;
  createdCoverageRatio: number; // 0..1
  masteredRatio: number;        // 0..1
  finished: boolean;

  // Activité
  totalAnswers: number;
  answersToday: number;
  lastActivity: string | null; // ISO date string
  currentRound: number;

  // Optionnel
  dueNow?: number | null;
  canGrowBy: number;
}
