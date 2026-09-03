import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import {
  QuizAnswerSubmissionDto,
  buildQuizAnswerSubmission,
} from "../../../services/dto/quiz/QuizAnswerSubmissionDto";
import { QuizQuestionDto } from "../../../services/dto/quiz/QuizQuestionDto";
import { LetterFeedback } from "../../../services/dto/quiz/QuizEnums";

export type WordPuzzleAnswerPanelHandle = {
  getSubmission: () => QuizAnswerSubmissionDto;
  isValid: () => boolean;
  focus: () => void;
};

type Props = {
  question: QuizQuestionDto;
  disabled?: boolean;
  accentColor: string;
};

function canonicalWord(v: string): string {
  return (v ?? "").trim().toUpperCase();
}

function isAlphaNum(ch: string): boolean {
  return /^[A-Z0-9]$/i.test(ch);
}

function padToLength(word: string, n: number): string[] {
  const chars = word.split("").slice(0, n);
  while (chars.length < n) chars.push("");
  return chars;
}

export const WordPuzzleAnswerPanel = forwardRef<WordPuzzleAnswerPanelHandle, Props>(function WordPuzzleAnswerPanel(
  { question, disabled = false },
  ref
) {
  const payload = question.payload?.wordPuzzle;
  const currentState = payload?.currentState;

  const inputRef = useRef<HTMLInputElement>(null);

  const wordLength = payload?.wordLength ?? 5;
  const maxAttempts = payload?.maxAttempts ?? 6;

  const attempts = currentState?.attempts ?? [];
  const attemptsRemaining = currentState?.attemptsRemaining ?? Math.max(0, maxAttempts - attempts.length);
  const solved = Boolean(currentState?.solved);
  const failed = Boolean(currentState?.failed);

  const isLocked = disabled || solved || failed;

  const [guess, setGuess] = useState<string>("");

  // If question token changes, reset local input only (state comes from backend anyway)
  useEffect(() => {
    setGuess("");
  }, [question.questionHandle]);

  const guessCanon = canonicalWord(guess);

  const isValidGuess = useMemo(() => {
    if (isLocked) return false;
    if (!guessCanon) return false;
    if (guessCanon.length !== wordLength) return false;
    // optional strictness: only alphanum
    if (!guessCanon.split("").every(isAlphaNum)) return false;
    return true;
  }, [isLocked, guessCanon, wordLength]);

  useImperativeHandle(ref, () => ({
    getSubmission: () => {
      return buildQuizAnswerSubmission({ wordPuzzle: { word: guessCanon } });
    },
    isValid: () => isValidGuess,
    focus: () => inputRef.current?.focus(),
  }));

  const renderBoard = () => {
    // Board rows: existing attempts + remaining empty rows (maxAttempts)
    const rows = [];
    for (let i = 0; i < maxAttempts; i++) {
      const attempt = attempts[i];
      const word = attempt?.word ?? "";
      const fb: LetterFeedback[] = attempt?.feedback ?? [];
      const cells = padToLength(word, wordLength).map((ch, idx) => {
        const f = fb[idx] as LetterFeedback | undefined;

        // We do not hardcode colors; we use semantic backgrounds derived from MUI defaults.
        // If you want explicit colors, pass them via theme or props.
        const bg =
          f === "EXACT"
            ? "rgba(0, 200, 83, 0.35)"
            : f === "PRESENT"
            ? "rgba(255, 214, 0, 0.30)"
            : f === "ABSENT"
            ? "rgba(255,255,255,0.10)"
            : "rgba(0,0,0,0.22)";

        const border =
          f === "EXACT"
            ? "1px solid rgba(0,200,83,0.5)"
            : f === "PRESENT"
            ? "1px solid rgba(255,214,0,0.45)"
            : f === "ABSENT"
            ? "1px solid rgba(255,255,255,0.12)"
            : "1px solid rgba(255,255,255,0.10)";

        return (
          <Box
            key={`${i}-${idx}`}
            sx={{
              width: { xs: 38, sm: 44 },
              height: { xs: 44, sm: 52 },
              borderRadius: 2,
              border,
              backgroundColor: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              fontWeight: 900,
              fontSize: { xs: 16, sm: 18 },
              userSelect: "none",
            }}
          >
            {(ch ?? "").toUpperCase()}
          </Box>
        );
      });

      rows.push(
        <Box key={`row-${i}`} sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          {cells}
        </Box>
      );
    }

    return <Stack spacing={1}>{rows}</Stack>;
  };

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Stack spacing={1.5} sx={{ maxWidth: 760, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "common.white", opacity: 0.9 }}>
            Word Puzzle
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={`Essais restants: ${attemptsRemaining}`}
              sx={{ color: "common.white", backgroundColor: "rgba(0,0,0,0.25)" }}
            />
            <Chip
              size="small"
              label={`Longueur: ${wordLength}`}
              sx={{ color: "common.white", backgroundColor: "rgba(0,0,0,0.25)" }}
            />
          </Stack>
        </Box>

        {renderBoard()}

        {(solved || failed) && (
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
            {solved ? "Bravo, trouvé." : "Échec. Plus d’essais."}
          </Typography>
        )}

        <TextField
          inputRef={inputRef}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={`Propose un mot (${wordLength} lettres)`}
          disabled={isLocked}
          inputProps={{ maxLength: wordLength }}
          sx={{ width: "100%" }}
        />

        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
          EXACT = bonne lettre, bonne position. PRESENT = bonne lettre, mauvaise position. ABSENT = lettre absente.
        </Typography>
      </Stack>
    </Box>
  );
});
