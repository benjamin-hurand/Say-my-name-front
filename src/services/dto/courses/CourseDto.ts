// Types/DTO alignés avec le backend refactor

export type PopulationScope = "FOLLOWED" | "ALL";

// On ne se sert côté UI que de IN_PROGRESS, mais on tolère d'autres valeurs
export type CourseStatus =
  | "IN_PROGRESS"
  | "ARCHIVED";

export interface CourseDto {
  id: number;
  userId: number;
  gameModeId: number;
  status: CourseStatus;
  currentRound: number;
}

// Payload pour créer ou reprendre (le scope est requis à la création)
export interface CreateCourseDto {
  userId: number;
  gameModeId: number;
  populationScope: PopulationScope; // "FOLLOWED" | "ALL"
}
