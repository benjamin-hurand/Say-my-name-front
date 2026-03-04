export type AnswerDto =
  | { type: "TEXT_INPUT"; text: string }
  | { type: "MCQ"; selectedChoiceIds: string[] }
  | { type: "BINARY_SWIPE"; yes: boolean }
  | { type: "HANGMAN"; guessedLetters: string[]; finalText?: string | null }
  | { type: "ASSOCIATION"; mapping: Record<number, string> }
  | { type: "ORDERING"; orderedLabelIds: string[] };
