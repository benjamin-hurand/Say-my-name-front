import { QuizQuestionDto } from "./QuizQuestionDto";
import { MultiStepStateDto } from "./QuizMultiStepDto";

export type QuizQuestionItemRole = "TARGET" | "DISTRACTOR";

export interface QuizAnswerItemResultDto {
  position: number | null;
  role: QuizQuestionItemRole | null;
  knowledgeId: number | null;
  personId: number | null;
  correct: boolean | null;
  userAnswerNormalized: string | null;
  correctAnswer: string | null;
  resultAttributes: ResultAttributeDto[] | null;
}

export interface ResultAttributeDto {
  attributeId: number;
  attributeName: string;
  value: string;
  correct: boolean;
  target: boolean;
}

export interface XpAwardDto {
  deltaXp: number;
  eventKeys: string[] | null;
}

export interface QuizAnswerResultDto {
  correct: boolean;
  feedbackMessage: string | null;
  nextQuestion: QuizQuestionDto | null;
  itemResults: QuizAnswerItemResultDto[] | null;
  isComplete: boolean | null;
  currentState: MultiStepStateDto | null;
  xpAward: XpAwardDto | null;
}
