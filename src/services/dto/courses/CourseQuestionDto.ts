// src/dto/course/CourseQuestionDto.ts
export interface CourseQuestionDto {
  id: number;
  questionRound: number;
  personId: number;
  photoUrl: string;
  poolType: PoolType;
  difficultyLevel: DifficultyLevel;
}

export enum PoolType {
  ERROR_RECENT = 'ERROR_RECENT',
  NEW = 'NEW',
  NOT_SO_NEW = 'NOT_SO_NEW',
  SRS_DUE = 'SRS_DUE',
  RAPID_CHECK = 'RAPID_CHECK',
  DIFFICULT = 'DIFFICULT',
  LONG_TERM = 'LONG_TERM',
  RANDOM = 'RANDOM',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}
