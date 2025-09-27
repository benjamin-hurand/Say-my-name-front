export type PopulationScope = "FOLLOWED" | "ALL";

// Nouveau DTO côté front, aligné avec le back refactor
export type CourseStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'PAUSED'
  | 'CANCELLED';

export interface CourseDto {
  id: number;
  userId: number;
  gameModeId: number;
  status: CourseStatus;
  currentRound: number;
  populationScope: PopulationScope;
  createdAt?: string;   // optionnel si exposé par le back
  updatedAt?: string;   // optionnel si exposé par le back
}



export interface CreateCourseDto {
  userId: number;
  gameModeId: number;
  populationScope: PopulationScope; // ex: "FOLLOWED"
}
