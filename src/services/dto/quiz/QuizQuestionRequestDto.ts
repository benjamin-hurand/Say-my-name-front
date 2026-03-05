import { FollowFilter, FormatMode, QuizFormat } from "./QuizEnums";

export interface QuizQuestionRequestDto {
  options: TrainingOptionsDto;
  formatMode: FormatMode;
  format: QuizFormat | null;
  timed: boolean | null;
  timeLimitMs: number | null;
}

export interface TrainingOptionsDto {
  targetAttributeId: number | null;
  populationScope: FollowFilter | null;
  category: TrainingCategorySelectionDto | null;
  trackKnowledge: boolean | null;
}

export interface TrainingCategorySelectionDto {
  attributeId: number | null;
  value: string | null;
}

const emptyTrainingOptions: TrainingOptionsDto = {
  targetAttributeId: null,
  populationScope: null,
  category: null,
  trackKnowledge: null,
};

export function buildQuizQuestionRequest(
  overrides: Partial<QuizQuestionRequestDto>
): QuizQuestionRequestDto {
  return {
    options: {
      ...emptyTrainingOptions,
      ...(overrides.options ?? {}),
    },
    formatMode: overrides.formatMode ?? "AUTO",
    format: overrides.format ?? null,
    timed: overrides.timed ?? null,
    timeLimitMs: overrides.timeLimitMs ?? null,
  };
}
