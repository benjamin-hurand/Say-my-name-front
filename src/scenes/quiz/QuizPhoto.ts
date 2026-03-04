import { QuizFormat } from "../../services/dto/quiz/QuizEnums";
import { QuizQuestionDto } from "../../services/dto/quiz/QuizQuestionDto";

/**
 * Retourne l'URL "principale" à afficher dans la carte (face avant / fond face arrière).
 * - TEXT_INPUT / CLOZE / HANGMAN => payload.*.targetPhotoUrl
 * - MCQ => payload.choices.targetPhotoUrl
 * - BINARY_SWIPE => payload.binarySwipe.targetPhotoUrl
 * - ASSOCIATION / ORDERING => null (multi-target; la face avant affiche une grille/list)
 */
export function getPrimaryPhotoUrl(question: QuizQuestionDto | null): string | null {
  if (!question) return null;
  const p = question.payload;
  return (
    p?.textInput?.targetPhotoUrl ??
    p?.cloze?.targetPhotoUrl ??
    p?.hangman?.targetPhotoUrl ??
    p?.choices?.targetPhotoUrl ??
    p?.binarySwipe?.targetPhotoUrl ??
    null
  );
}

export function isMultiTargetFormat(format: QuizFormat | null | undefined): boolean {
  return format === "ASSOCIATION" || format === "ORDERING";
}
