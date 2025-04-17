import { ChallengeHistoryEntry } from "../../models/commons/Game/QuizHistoryEntry";

export interface AddChallengeAttemptDto {
  userId: number;
  challengeVersionId: number;
}

export interface ChallengeQuestionDto {
  personId: number;
  photoUrl: string;
}

export interface CreatedChallengeAttemptDto {
  id: number;
  userId: number;
  challengeVersionId: number;
  challengeEntries: ChallengeQuestionDto[];
}

export interface ChallengeEvaluationRequestDto {
  history: ChallengeHistoryEntry[];
}

export interface CorrectionEntryDto {
  questionNumber: number;
  correctAnswer: string;
  correct: boolean;
}

export interface ChallengeEvaluationDto {
  totalCorrect: number;
  entries: CorrectionEntryDto[];
}  