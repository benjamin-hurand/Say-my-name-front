import { SpacedRepetitionData } from "./GameOptions/GameRepetitionPattern.model";

export interface QuizEntry {
  photoUrl: string;
  personId: number;
  initials: string;
}

export interface QuizEntryWithRepetition extends QuizEntry {
  repetitionData: SpacedRepetitionData;
}