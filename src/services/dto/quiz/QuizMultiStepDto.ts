import { LetterFeedback } from "./QuizEnums";

export interface HangmanStateDto {
  mask: string | null;
  maxErrors: number | null;
  errorsCount: number | null;
  triedLetters: string[] | null;
  wrongLetters: string[] | null;
}

export interface WordPuzzleAttemptDto {
  word: string | null;
  feedback: LetterFeedback[] | null;
  position: number | null;
}

export interface WordPuzzleStateDto {
  attempts: WordPuzzleAttemptDto[] | null;
  attemptsRemaining: number | null;
  solved: boolean | null;
  failed: boolean | null;
}

export type MultiStepStateDto = HangmanStateDto | WordPuzzleStateDto;
