export type QuizFormat =
  | "TEXT_INPUT"
  | "CLOZE"
  | "HANGMAN"
  | "MCQ"
  | "BINARY_SWIPE"
  | "ASSOCIATION"
  | "ORDERING"
  | "WORD_PUZZLE";

export type QuizPreferredFormat = "AUTO" | QuizFormat;

export type FormatMode = "AUTO" | "FORCED";

export type QuizOrderingRule =
  | "NONE"
  | "ALPHABETICAL"
  | "RANDOM"
  | "DIFFICULTY_ASC"
  | "DIFFICULTY_DESC";

export type QuizFollowUpStrategy = "NONE" | "FORCE_TEXT_INPUT" | "SUGGEST_TEXT_INPUT";
export type QuizFollowUpReason = "AMBIGUOUS_SWIPE" | "LUCKY_GUESS" | "USER_UNCERTAIN" | "LOW_CONFIDENCE_SIGNAL";

export type PoolType = "ERROR_RECENT" | "NEW" | "DISCOVERED" | "SRS_DUE" | "REVISION";
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export type QuizQuestionSource = "TRAINING" | "COURSE" | "REVIEW";

export type FollowFilter = "ALL" | "FOLLOWED" | "UNFOLLOWED";

export type LetterFeedback = "EXACT" | "PRESENT" | "ABSENT";
