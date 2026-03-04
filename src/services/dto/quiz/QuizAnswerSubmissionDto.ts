export interface QuizAssociationPairDto {
  leftId: string;
  rightId: string;
}

export type HangmanAction = "GUESS" | "SOLVE";

export interface HangmanSubmissionDto {
  action: HangmanAction;
  letter: string | null;
  value: string | null;
}

export interface WordPuzzleSubmissionDto {
  word: string | null;
}

export interface QuizAnswerSubmissionDto {
  userAnswer: string | null;
  selectedChoiceId: number | null;
  selectedChoiceIds: number[] | null;
  swipeRight: boolean | null;
  orderingIds: number[] | null;
  pairs: QuizAssociationPairDto[] | null;
  timeMs: number | null;
  hangman: HangmanSubmissionDto | null;
  wordPuzzle: WordPuzzleSubmissionDto | null;
}

const emptySubmission: QuizAnswerSubmissionDto = {
  userAnswer: null,
  selectedChoiceId: null,
  selectedChoiceIds: null,
  swipeRight: null,
  orderingIds: null,
  pairs: null,
  timeMs: null,
  hangman: null,
  wordPuzzle: null,
};

export function buildQuizAnswerSubmission(
  overrides: Partial<QuizAnswerSubmissionDto>
): QuizAnswerSubmissionDto {
  return { ...emptySubmission, ...overrides };
}
