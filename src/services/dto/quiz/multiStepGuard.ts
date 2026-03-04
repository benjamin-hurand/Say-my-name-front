// src/api/dto/quiz/multiStepGuards.ts
import { HangmanStateDto, MultiStepStateDto, WordPuzzleStateDto } from "./QuizMultiStepDto";

export function isHangmanState(state: MultiStepStateDto | null | undefined): state is HangmanStateDto {
  return !!state && "wrongLetters" in state && "triedLetters" in state && "errorsCount" in state;
}

export function isWordPuzzleState(state: MultiStepStateDto | null | undefined): state is WordPuzzleStateDto {
  return !!state && "attempts" in state && "attemptsRemaining" in state;
}
