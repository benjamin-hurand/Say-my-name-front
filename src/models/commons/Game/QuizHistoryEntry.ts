import { SpacedRepetitionData } from "./GameOptions/GameRepetitionPattern.model";

export interface QuizHistoryEntry {
    photoUrl: string;
    personId: number;
    initials: string;
    isCorrect: boolean;
    repetitionData: SpacedRepetitionData;
  }

export interface ChallengeHistoryEntry {
  questionNumber: number;
  personId: number;
  answer: string;
}
  