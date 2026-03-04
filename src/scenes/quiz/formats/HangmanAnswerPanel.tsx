import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Divider, Stack, TextField, Typography } from "@mui/material";
import {
  QuizAnswerSubmissionDto,
  buildQuizAnswerSubmission,
} from "../../../services/dto/quiz/QuizAnswerSubmissionDto";
import { QuizQuestionDto } from "../../../services/dto/quiz/QuizQuestionDto";

export type HangmanAnswerPanelHandle = {
  getSubmission: () => QuizAnswerSubmissionDto;
  isValid: () => boolean;
  focus: () => void;
};

type Props = {
  question: QuizQuestionDto;
  disabled?: boolean;
  accentColor: string;
};

function canonicalLetter(v: string): string {
  const s = (v ?? "").trim();
  if (!s) return "";
  // take first grapheme-ish char
  return s[0].toUpperCase();
}

function canonicalText(v: string): string {
  return (v ?? "").trim();
}

export const HangmanAnswerPanel = forwardRef<HangmanAnswerPanelHandle, Props>(function HangmanAnswerPanel(
  { question, disabled = false, accentColor },
  ref
) {
  const payload = question.payload?.hangman;
  const inputRef = useRef<HTMLInputElement>(null);

  // Local UI state
  const [mode, setMode] = useState<"GUESS" | "SOLVE">("GUESS");
  const [letter, setLetter] = useState("");
  const [solveValue, setSolveValue] = useState("");

  // Derived state displayed
  const mask = payload?.mask ?? "";
  const maxErrors = payload?.maxErrors ?? 6;
  const errorsCount = 0;
  const triedLetters: string[] = [];
  const wrongLetters: string[] = [];
  const solved = false;
  const failed = false;

  // If backend sends updated state on same token, keep local inputs but update display.
  useEffect(() => {
    // no-op here; we simply read currentState from question
  }, [question.questionHandle, mask, errorsCount, solved, failed]);

  const remaining = Math.max(0, maxErrors - errorsCount);

  const isLocked = disabled || solved || failed;

  const canSubmitGuess = useMemo(() => {
    if (isLocked) return false;
    if (mode === "GUESS") return canonicalLetter(letter).length === 1;
    return canonicalText(solveValue).length > 0;
  }, [isLocked, mode, letter, solveValue]);

  useImperativeHandle(ref, () => ({
    getSubmission: () => {
      if (mode === "GUESS") {
        return buildQuizAnswerSubmission({
          hangman: {
            action: "GUESS",
            letter: canonicalLetter(letter),
            value: null,
          },
        });
      }
      return buildQuizAnswerSubmission({
        hangman: {
          action: "SOLVE",
          letter: null,
          value: canonicalText(solveValue),
        },
      });
    },
    isValid: () => canSubmitGuess,
    focus: () => inputRef.current?.focus(),
  }));

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Stack spacing={1.5} sx={{ maxWidth: 760, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "common.white", opacity: 0.9 }}>
            Hangman
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={`Erreurs: ${errorsCount}/${maxErrors}`}
              sx={{ color: "common.white", backgroundColor: "rgba(0,0,0,0.25)" }}
            />
            <Chip
              size="small"
              label={`Restant: ${remaining}`}
              sx={{ color: "common.white", backgroundColor: "rgba(0,0,0,0.25)" }}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "rgba(0,0,0,0.22)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "common.white",
              letterSpacing: 4,
              fontWeight: 900,
              fontVariantNumeric: "tabular-nums",
              userSelect: "none",
              wordBreak: "break-word",
            }}
          >
            {mask || "—"}
          </Typography>

          {(solved || failed) && (
            <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.85)" }}>
              {solved ? "Résolu." : "Échec. Nombre maximal d'erreurs atteint."}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {(triedLetters ?? []).slice(0, 40).map((l) => {
            const isWrong = (wrongLetters ?? []).includes(l);
            return (
              <Chip
                key={l}
                size="small"
                label={l}
                sx={{
                  color: "common.white",
                  backgroundColor: isWrong ? "rgba(255,0,0,0.18)" : "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontWeight: 900,
                }}
              />
            );
          })}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant={mode === "GUESS" ? "contained" : "outlined"}
            onClick={() => setMode("GUESS")}
            disabled={isLocked}
            sx={{ fontWeight: 900 }}
          >
            Lettre
          </Button>
          <Button
            size="small"
            variant={mode === "SOLVE" ? "contained" : "outlined"}
            onClick={() => setMode("SOLVE")}
            disabled={isLocked}
            sx={{ fontWeight: 900 }}
          >
            Mot complet
          </Button>
        </Box>

        {mode === "GUESS" ? (
          <TextField
            inputRef={inputRef}
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            placeholder="Tape une lettre"
            disabled={isLocked}
            inputProps={{ maxLength: 2, style: { textTransform: "uppercase" } }}
            sx={{ width: "100%" }}
          />
        ) : (
          <TextField
            inputRef={inputRef}
            value={solveValue}
            onChange={(e) => setSolveValue(e.target.value)}
            placeholder="Propose le mot complet"
            disabled={isLocked}
            sx={{ width: "100%" }}
          />
        )}

        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
          Conseil UX: affiche ce panneau “stateful” en gardant le même token tant que la question n’est pas complète.
        </Typography>
      </Stack>
    </Box>
  );
});
