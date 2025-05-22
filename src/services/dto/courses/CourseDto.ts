import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";
import { ReducedGameModeDto } from "../ReducedGameOptionsDto";

// src/dto/course/CourseDto.ts
export interface CourseDto {
  id: number;
  userId: number;
  gameModeId: number;
  sortingMethodAttributeId: number;
  sortingMethodOrder: 'ASC' | 'DESC';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'PAUSED' | 'CANCELLED';
  populationIds: number[];
}
