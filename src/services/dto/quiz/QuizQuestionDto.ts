import {
  DifficultyLevel,
  PoolType,
  QuizFormat,
  QuizFollowUpReason,
  QuizFollowUpStrategy,
  QuizOrderingRule,
  QuizQuestionSource,
} from "./QuizEnums";
import { WordPuzzleStateDto } from "./QuizMultiStepDto";

export interface QuizQuestionDto {
  questionHandle: string;
  gameModeId: number;
  context: QuizQuestionContextDto;
  format: QuizFormat;
  payload: QuizQuestionPayloadDto;
  hints: QuizQuestionHintsDto | null;
  display: QuizQuestionDisplayDto | null;
  followUp: QuizFollowUpDto | null;
  reasonCode: string | null;
  reasonDetailsJson: string | null;
}

export interface QuizQuestionContextDto {
  source: QuizQuestionSource;
  courseId: number | null;
  courseQuestionId: number | null;
  questionRound: number | null;
  poolType: PoolType | null;
  difficultyLevel: DifficultyLevel | null;
  reducedOptionsId: number | null;
}

export interface QuizQuestionHintsDto {
  initials: string | null;
}

export interface QuizQuestionDisplayDto {
  prompt: string | null;
  subtitle: string | null;
  inputPlaceholder: string | null;
  timed: boolean | null;
  timeLimitMs: number | null;
}

export interface QuizFollowUpDto {
  strategy: QuizFollowUpStrategy;
  reason: QuizFollowUpReason;
}

export interface ChoiceDto {
  id: number;
  label: string | null;
  value: string | null;
  photoUrl: string | null;
  personId: number | null;
}

export interface QuizQuestionPayloadDto {
  textInput: TextInputPayload | null;
  cloze: ClozePayload | null;
  hangman: HangmanPayload | null;
  wordPuzzle: WordPuzzlePayload | null;
  choices: ChoicePayload | null;
  binarySwipe: BinarySwipePayload | null;
  association: AssociationPayload | null;
  ordering: OrderingPayload | null;
}

export interface TextInputPayload {
  targetPersonId: number | null;
  targetPhotoUrl: string | null;
}

export interface ClozePayload {
  targetPersonId: number | null;
  targetPhotoUrl: string | null;
  mask: string | null;
}

export interface HangmanPayload {
  targetPersonId: number | null;
  targetPhotoUrl: string | null;
  mask: string | null;
  maxErrors: number | null;
}

export interface WordPuzzlePayload {
  targetPersonId: number | null;
  targetPhotoUrl: string | null;
  wordLength: number | null;
  maxAttempts: number | null;
  currentState: WordPuzzleStateDto | null;
}

export interface ChoicePayload {
  choices: ChoiceDto[] | null;
  allowMultiple: boolean | null;
  targetPersonId: number | null;
  targetPhotoUrl: string | null;
}

export interface BinarySwipePayload {
  proposition: ChoiceDto | null;
  targetPersonId: number | null;
  targetPhotoUrl: string | null;
}

export interface AssociationPayload {
  items: ItemDto[] | null;
}

export interface OrderingPayload {
  items: ItemDto[] | null;
  orderBy: QuizOrderingRule | null;
}

export interface ItemDto {
  personId: number;
  photoUrl: string | null;
  label: string | null;
}
