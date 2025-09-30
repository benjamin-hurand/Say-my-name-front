// DTO minimal, exactement comme renvoyé par le back

export interface CourseStatsDto {
  courseId: number;
  gameModeId: number;

  totalCandidates: number;
  universeEligible: number;

  unknown: number;
  discovered: number;
  learned: number;
  mastered: number;

  totalAnswers: number;
  answersToday: number;
  lastActivity: string | null; // ISO string
  currentRound: number;

  dueNow: number; // non-null côté back
}
