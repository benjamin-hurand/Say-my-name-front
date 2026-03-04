import "./QuizDisplay.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  TextField,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem as MuiMenuItem,
  Divider,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";

import { PersonAttributeLiteDto } from "../../services/dto/person/PersonAttributeLiteDto";
import {
  QuizAnswerSubmissionDto,
  QuizAssociationPairDto,
  buildQuizAnswerSubmission,
} from "../../services/dto/quiz/QuizAnswerSubmissionDto";
import { PoolType, DifficultyLevel } from "../../services/dto/quiz/QuizEnums";
import { QuizQuestionDto, ItemDto, ChoiceDto } from "../../services/dto/quiz/QuizQuestionDto";
import { ResultAttributeDto, QuizAnswerItemResultDto } from "../../services/dto/quiz/QuizAnswerResultDto";
import { MultiTargetFrontPanel } from "./formats/MultiTargetFrontPanel";
import { SingleTargetPromptOnly } from "./formats/SingleTargetPromptOnly";
import { ClozeBoxes } from "./formats/ClozeBoxes";
import { ResultBanner } from "./formats/ResultBanner";
import { QuizCard } from "./quizCard";
import { getPrimaryPhotoUrl, isMultiTargetFormat } from "./QuizPhoto";
import { HangmanAnswerPanel, HangmanAnswerPanelHandle } from "./formats/HangmanAnswerPanel";
import { WordPuzzleAnswerPanel, WordPuzzleAnswerPanelHandle } from "./formats/WordPuzzleAnswerPanel";

export type QuizResultSnapshot = {
  question: QuizQuestionDto;
  submission: QuizAnswerSubmissionDto;
  itemResults?: QuizAnswerItemResultDto[] | null;
  feedbackMessage?: string | null;
  resultAttributes?: ResultAttributeDto[] | null;
  correct?: boolean | null;
  nextQuestion?: QuizQuestionDto | null;
  correctAnswer?: string | null;
  userAnswer?: string | null;
};

export interface QuizDisplayProps {
  color: string;

  question: QuizQuestionDto | null;

  elapsed?: number;
  progress?: number;

  hasFetched: boolean;
  isLoading: boolean;
  isSubmitting?: boolean;

  poolBadge?: PoolType;
  difficultyBadge?: DifficultyLevel;

  useHelp?: () => Promise<PersonAttributeLiteDto[]>;

  showInitials: boolean;

  onSubmit: (submission: QuizAnswerSubmissionDto) => void | Promise<void>;
  isResultMode?: boolean;
  resultMessage?: string;
  resultAttributes?: ResultAttributeDto[];

  /**
   * IMPORTANT: pour afficher la bonne réponse, il faut itemResults (car resultAttributes ne contient pas correctAnswer).
   * Tu dois le passer depuis la réponse /answer côté Course/Training.
   */
  itemResults?: QuizAnswerItemResultDto[];
  resultSnapshot?: QuizResultSnapshot | null;

  onNext?: () => void;

  openQuizOptions?: () => void;

  onReloadBatch?: () => void;
  onFreeTraining?: () => void;

  onRetry?: () => void;
  hasHistory?: boolean;

  fromReview?: boolean;
  goBackFromReview?: () => void;

  submitLabel?: string;
  nextLabel?: string;

  // Gestion d'erreur
  errorMessage?: string | null;
  onRetrySubmit?: () => void;
}

function formatElapsed(elapsedSeconds: number): string {
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function nowMs(): number {
  return Date.now();
}

function getQuestionInitials(question: QuizQuestionDto | null): string | null {
  return question?.hints?.initials ?? null;
}

function getQuestionTimed(question: QuizQuestionDto | null): { timed: boolean; timeLimitMs: number | null } {
  const timed = Boolean(question?.display?.timed);
  const timeLimitMs = question?.display?.timeLimitMs ?? null;
  return { timed, timeLimitMs };
}

/**
 * Bonne réponse:
 * 1) itemResults[TARGET].correctAnswer (source de vérité, ton JSON l’a)
 * 2) itemResults[0].correctAnswer
 * 3) Si absent: LOG ERROR + afficher message explicite
 */
function computeCorrectAnswerLabel(itemResults?: QuizAnswerItemResultDto[] | null): string | null {
  const items = itemResults ?? [];

  const target = items.find((x) => x?.role === "TARGET");
  if (target?.correctAnswer) return String(target.correctAnswer);

  const first = items[0];
  if (first?.correctAnswer) return String(first.correctAnswer);

  if (items.length > 0) {
    console.error("[QuizDisplay] correctAnswer manquant dans itemResults", { itemResults });
    return "?? Réponse indisponible";
  }

  return null;
}

/**
 * Votre réponse:
 * - priorité: si format MCQ/TAP -> label depuis selectedChoiceId(s)
 */
function computeYourAnswerLabel(params: {
  question?: QuizQuestionDto | null;
  submission?: QuizAnswerSubmissionDto | null;
  itemResults?: QuizAnswerItemResultDto[] | null;
}): string | null {
  const { question, submission, itemResults } = params;
  const format = question?.format ?? null;
  const payload = question?.payload;

  if (format === "MCQ") {
    const allowMultiple = Boolean(payload?.choices?.allowMultiple);
    const choices: ChoiceDto[] = payload?.choices?.choices ?? [];
    const selectedIds =
      submission?.selectedChoiceIds ??
      (submission?.selectedChoiceId != null ? [submission.selectedChoiceId] : []);

    if (allowMultiple) {
      const labels = selectedIds
        .map((id) => choices.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => (c!.label ?? c!.value ?? String(c!.id)) as string);

      return labels.length ? labels.join(", ") : null;
    }

    const singleId = submission?.selectedChoiceId ?? null;
    if (singleId == null) return null;
    const c = choices.find((x) => x.id === singleId);
    return c ? ((c.label ?? c.value ?? String(c.id)) as string) : String(singleId);
  }

  if (format === "CLOZE" || format === "TEXT_INPUT") {
    const v = (submission?.userAnswer ?? "").trim();
    return v.length ? v : null;
  }

  if (format === "HANGMAN") {
    const h = submission?.hangman;
    if (h?.action === "GUESS") return h.letter ?? null;
    if (h?.action === "SOLVE") return h.value ?? null;
  }

  if (format === "BINARY_SWIPE") {
    if (submission?.swipeRight === true) return "Vrai";
    if (submission?.swipeRight === false) return "Faux";
  }

  if (format === "WORD_PUZZLE") {
    return submission?.wordPuzzle?.word ?? null;
  }

  const items = itemResults ?? [];
  const target = items.find((x) => x?.role === "TARGET") ?? items[0];
  const targetAttr = (target?.resultAttributes ?? []).find((a: ResultAttributeDto) => a.target);
  if (targetAttr?.value) return String(targetAttr.value);

  return null;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  color,
  question,
  elapsed,
  progress,
  hasFetched,
  isLoading,
  isSubmitting = false,
  poolBadge,
  difficultyBadge,
  useHelp,
  showInitials,
  onSubmit,
  isResultMode = false,
  resultMessage,
  itemResults,
  resultSnapshot,
  onNext,
  openQuizOptions,
  onReloadBatch,
  onFreeTraining,
  onRetry,
  hasHistory = false,
  fromReview,
  goBackFromReview,
  submitLabel = "Submit",
  nextLabel = "Suivant",
  errorMessage,
  onRetrySubmit,
}) => {
  const activeQuestion = isResultMode && resultSnapshot?.question ? resultSnapshot.question : question;
  const format = activeQuestion?.format ?? null;
  const payload = activeQuestion?.payload;

  const photoUrl = getPrimaryPhotoUrl(activeQuestion);

  const initials = getQuestionInitials(activeQuestion);
  const { timed, timeLimitMs } = getQuestionTimed(activeQuestion);

  const effectivePoolBadge = poolBadge ?? (activeQuestion?.context?.poolType ?? undefined);
  const effectiveDifficultyBadge = difficultyBadge ?? (activeQuestion?.context?.difficultyLevel ?? undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number>(nowMs());
  const pendingSubmissionRef = useRef<QuizAnswerSubmissionDto | null>(null);

  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [helpAttributes, setHelpAttributes] = useState<PersonAttributeLiteDto[] | null>(null);
  const [attributesLoading, setAttributesLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isImportant, setIsImportant] = useState<boolean>(false);
  const [nextRequested, setNextRequested] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shake, setShake] = useState<boolean>(false);
  const canFlip = Boolean(useHelp) && !isResultMode;
  const hangmanRef = useRef<HangmanAnswerPanelHandle>(null);
  const wordPuzzleRef = useRef<WordPuzzleAnswerPanelHandle>(null);

  // Hold-to-flip
  const holdStart = useRef<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [willCancel, setWillCancel] = useState(false);

  // submission states
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<number[]>([]);
  const [swipeRight, setSwipeRight] = useState<boolean | null>(null);
  const [clozeValue, setClozeValue] = useState<string>("");

  const orderingIdsSeed = useMemo<number[]>(() => {
    if (!activeQuestion) return [];
    const items: ItemDto[] | undefined = payload?.ordering?.items ?? undefined;
    if (format === "ORDERING" && items?.length) {
      return items.map((it: ItemDto) => it.personId);
    }
    return [];
  }, [activeQuestion, payload, format]);

  const [orderingIds, setOrderingIds] = useState<number[]>([]);
  const [associationPairs, setAssociationPairs] = useState<QuizAssociationPairDto[]>([]);

  // reset on question change (UNIQUEMENT si question réellement change, pas en mode résultat)
  useEffect(() => {
    if (isResultMode) return;

    startedAtRef.current = nowMs();
    setIsFlipped(false);
    setHelpAttributes(null);
    setHoldProgress(0);
    setWillCancel(false);
    setNextRequested(false);
    setShake(false);

    setTextAnswer("");
    setSelectedChoiceId(null);
    setSelectedChoiceIds([]);
    setSwipeRight(null);
    setOrderingIds(orderingIdsSeed);
    setAssociationPairs([]);
    setClozeValue("");

    setTimeout(() => inputRef.current?.focus(), 0);
  }, [question?.questionHandle, question?.context?.courseQuestionId, isResultMode, orderingIdsSeed]);

  // fetch help attrs on flip
  useEffect(() => {
    const fetchHelpAttributes = async () => {
      if (!helpAttributes && isFlipped && !isResultMode && useHelp) {
        setAttributesLoading(true);
        try {
          const attrs = await useHelp();
          setHelpAttributes(attrs);
        } catch {
          console.error("Erreur chargement des attributs");
        } finally {
          setAttributesLoading(false);
        }
      }
    };
    fetchHelpAttributes();
  }, [helpAttributes, isFlipped, isResultMode, useHelp]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(null);
  };
  const toggleImportant = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsImportant((i) => !i);
  };

  const handleFlip = () => {
    if (isAnimating || !canFlip) return;
    setIsAnimating(true);
    setIsFlipped((f) => !f);
  };

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    if (!isFlipped) {
      onNext?.();
      return;
    }
    setIsAnimating(true);
    setIsFlipped(false);
    setNextRequested(true);
  }, [isAnimating, isFlipped, onNext]);

  const computeTimeMs = () => Math.max(0, nowMs() - startedAtRef.current);

  const buildSubmissionFromState = (timeMs: number | null): QuizAnswerSubmissionDto => {
    switch (format) {
      case "TEXT_INPUT":
        return buildQuizAnswerSubmission({ userAnswer: textAnswer, timeMs });

      case "CLOZE": {
        const rawAnswer = clozeValue?.trim() ? clozeValue.replace(/\s+$/g, "") : textAnswer;
        const normalizedAnswer = rawAnswer
          .split(/\s+/)
          .map((word) => {
            if (!word) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(" ");
        return buildQuizAnswerSubmission({ userAnswer: normalizedAnswer, timeMs });
      }

      case "MCQ":
        return buildQuizAnswerSubmission({
          selectedChoiceId: selectedChoiceId ?? null,
          selectedChoiceIds: selectedChoiceIds.length ? selectedChoiceIds : null,
          timeMs,
        });

      case "BINARY_SWIPE":
        return buildQuizAnswerSubmission({ swipeRight, timeMs });

      case "ORDERING":
        return buildQuizAnswerSubmission({ orderingIds: orderingIds.length ? orderingIds : null, timeMs });

      case "ASSOCIATION":
        return buildQuizAnswerSubmission({ pairs: associationPairs.length ? associationPairs : null, timeMs });

      default:
        return buildQuizAnswerSubmission({ userAnswer: textAnswer, timeMs });
    }
  };

  const buildSubmission = (): QuizAnswerSubmissionDto => {
    const timeMs = computeTimeMs();

    if (format === "HANGMAN") {
      const panel = hangmanRef.current?.getSubmission();
      return panel ? { ...panel, timeMs } : buildQuizAnswerSubmission({ timeMs });
    }

    if (format === "WORD_PUZZLE") {
      const panel = wordPuzzleRef.current?.getSubmission();
      return panel ? { ...panel, timeMs } : buildQuizAnswerSubmission({ timeMs });
    }

    return buildSubmissionFromState(timeMs);
  };

  const isSubmissionValid = (): boolean => {
    switch (format) {
      case "TEXT_INPUT":
        return textAnswer.trim().length > 0;

      case "CLOZE":
        return (clozeValue && clozeValue.trim().length > 0) || textAnswer.trim().length > 0;

      case "HANGMAN":
        return Boolean(hangmanRef.current?.isValid());

      case "WORD_PUZZLE":
        return Boolean(wordPuzzleRef.current?.isValid());

      case "MCQ": {
        const allowMultiple = Boolean(payload?.choices?.allowMultiple);
        return allowMultiple ? selectedChoiceIds.length > 0 : selectedChoiceId !== null;
      }

      case "BINARY_SWIPE":
        return swipeRight !== null;

      case "ORDERING":
        return orderingIds.length > 0;

      case "ASSOCIATION":
        return associationPairs.length > 0;

      default:
        return textAnswer.trim().length > 0;
    }
  };

  const handleSubmit = async () => {
    if (isResultMode || isAnimating || isSubmitting) return;

    if (!isSubmissionValid()) {
      triggerShake();
      if (format === "HANGMAN") hangmanRef.current?.focus();
      else if (format === "WORD_PUZZLE") wordPuzzleRef.current?.focus();
      else inputRef.current?.focus();
      return;
    }

    const submission = buildSubmission();

    if (isFlipped) {
      pendingSubmissionRef.current = submission;
      setIsAnimating(true);
      setIsFlipped(false);
      return;
    }

    await onSubmit(submission);
  };

  // Global typing focus for text formats
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (isResultMode) return;
      const input = inputRef.current;
      if (!input) return;

      const isTextLike = format === "TEXT_INPUT";
      if (!isTextLike) return;

      if (document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        input.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [isResultMode, format]);

  // Enter key: submit / next. Hold Enter: flip.
  useEffect(() => {
    let rafId: number;
    const activatedRef = { current: false };
    const MIN_HOLD = 300;
    const FULL_HOLD = 600;
    const MAX_SUPER_HOLD = 2000;

    const step = () => {
      if (holdStart.current === null) return;
      const elapsedHold = Date.now() - holdStart.current;

      if (elapsedHold > MAX_SUPER_HOLD) {
        setWillCancel(true);
        setHoldProgress(0);
        holdStart.current = null;
        return;
      }

      let prog = 0;
      if (elapsedHold >= MIN_HOLD) prog = Math.min((elapsedHold - MIN_HOLD) / (FULL_HOLD - MIN_HOLD), 1);
      setHoldProgress(prog);

      if (elapsedHold < FULL_HOLD) rafId = requestAnimationFrame(step);
      else activatedRef.current = true;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || isAnimating) return;
      setWillCancel(false);
      setHoldProgress(0);

      if (holdStart.current === null) {
        holdStart.current = Date.now();
        activatedRef.current = false;
        if (canFlip) rafId = requestAnimationFrame(step);
      }
    };

    const onKeyUp = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      const elapsedHold = Date.now() - (holdStart.current || 0);
      cancelAnimationFrame(rafId);

      if (elapsedHold > MAX_SUPER_HOLD) {
        holdStart.current = null;
        return;
      }

      if (isResultMode) {
        setHoldProgress(0);
        holdStart.current = null;
        handleNext();
        return;
      }

      if (elapsedHold < 300) {
        await handleSubmit();
      } else if (activatedRef.current && canFlip) {
        handleFlip();
      } else {
        setHoldProgress(0);
      }

      holdStart.current = null;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(rafId);
    };
  }, [
    isAnimating,
    isResultMode,
    handleNext,
    format,
    textAnswer,
    selectedChoiceId,
    selectedChoiceIds,
    swipeRight,
    orderingIds,
    associationPairs,
    clozeValue,
    canFlip,
  ]);

  const renderBackContent = () => {
    if (attributesLoading) {
      return <Skeleton width="60%" height={40} />;
    }

    return (
      <Box sx={{ color: "common.white", textAlign: "left" }}>
        <Typography variant="overline" sx={{ opacity: 0.8 }}>
          Fiche (aide)
        </Typography>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", my: 1.5 }} />

        {(helpAttributes ?? []).length > 0 ? (
          <Stack spacing={0.6}>
            {(helpAttributes ?? []).map((attr, idx) => (
              <Box key={attr.id ?? attr.attributeId ?? idx} sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                <Typography sx={{ minWidth: 120, opacity: 0.85, fontWeight: 700 }}>
                  {attr.attributeName ?? (attr.attributeId != null ? `Attribut ${attr.attributeId}` : "Attribut")}
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{attr.value}</Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ opacity: 0.85 }}>{useHelp ? "Chargement ou vide." : "Aucune aide disponible."}</Typography>
        )}
      </Box>
    );
  };

  const effectiveItemResults = resultSnapshot?.itemResults ?? itemResults ?? null;
  const resultQuestion = resultSnapshot?.question ?? activeQuestion;
  const resultSubmission = resultSnapshot?.submission ?? buildSubmissionFromState(null);
  const effectiveResultMessage = resultSnapshot?.feedbackMessage ?? resultMessage;

  const correctAnswerLabel = isResultMode ? computeCorrectAnswerLabel(effectiveItemResults) : null;
  const yourAnswerLabel =
    isResultMode && resultQuestion
      ? computeYourAnswerLabel({ question: resultQuestion, submission: resultSubmission, itemResults: effectiveItemResults })
      : null;

  const renderAnswerInput = () => {
    if (!activeQuestion || !format) return null;

    const placeholder = activeQuestion?.display?.inputPlaceholder ?? "Tapez votre reponse ici...";
    const label = showInitials && initials ? `Initiales : ${initials}` : undefined;

    switch (format) {
      case "TEXT_INPUT":
        return (
          <TextField
            inputRef={inputRef}
            variant="outlined"
            color="accent"
            placeholder={placeholder}
            className={shake ? "textField-shake" : undefined}
            label={label}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            onFocus={() => isFlipped && handleFlip()}
            onKeyDown={(e) => isFlipped && e.key !== "Enter" && handleFlip()}
            InputLabelProps={{ shrink: true }}
            sx={{ my: 2, width: "100%" }}
            disabled={isResultMode || isSubmitting}
          />
        );

      case "HANGMAN":
        return (
          <HangmanAnswerPanel
            ref={hangmanRef}
            question={activeQuestion}
            disabled={isResultMode || isSubmitting}
            accentColor={color}
          />
        );

      case "WORD_PUZZLE":
        return (
          <WordPuzzleAnswerPanel
            ref={wordPuzzleRef}
            question={activeQuestion}
            disabled={isResultMode || isSubmitting}
            accentColor={color}
          />
        );

      case "CLOZE": {
        const mask = payload?.cloze?.mask ?? "";
        const canUseBoxes = Boolean(mask && typeof mask === "string" && mask.length > 0);

        if (canUseBoxes) {
          return (
            <Box sx={{ width: "100%", my: 2 }}>
              {label && (
                <Typography variant="subtitle2" sx={{ color: "common.white", opacity: 0.85, mb: 1 }}>
                  {label}
                </Typography>
              )}
              <ClozeBoxes
                mask={mask}
                value={clozeValue}
                onChange={setClozeValue}
                disabled={isResultMode || isSubmitting}
              />
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.75)", display: "block", mt: 1, textAlign: "center" }}
              >
                Remplissez uniquement les cases vides.
              </Typography>
            </Box>
          );
        }

        return (
          <TextField
            inputRef={inputRef}
            variant="outlined"
            color="accent"
            placeholder={placeholder}
            className={shake ? "textField-shake" : undefined}
            label={label}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ my: 2, width: "100%" }}
            disabled={isResultMode || isSubmitting}
          />
        );
      }

      case "MCQ": {
        const allowMultiple = Boolean(payload?.choices?.allowMultiple);
        const choices: ChoiceDto[] = payload?.choices?.choices ?? [];
        if (!choices.length) {
          return <Typography sx={{ color: "error.main", my: 2 }}>Aucune option disponible (choices manquants).</Typography>;
        }

        if (allowMultiple) {
          return (
            <Box sx={{ width: "100%", my: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1, textAlign: "center" }}>
                Choisissez une ou plusieurs reponses
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1,
                  width: "100%",
                  maxWidth: 720,
                  mx: "auto",
                }}
              >
                {choices.map((c) => {
                  const checked = selectedChoiceIds.includes(c.id);
                  return (
                    <Paper
                      key={c.id}
                      onClick={() => {
                        if (isResultMode) return;
                        setSelectedChoiceIds((prev) => (checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]));
                      }}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        cursor: isResultMode ? "default" : "pointer",
                        backgroundColor: checked ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "common.white",
                        userSelect: "none",
                      }}
                    >
                      <FormControlLabel
                        control={<Checkbox checked={checked} disabled={isResultMode || isSubmitting} />}
                        label={
                          <Typography sx={{ color: "common.white", fontWeight: 800 }}>
                            {c.label ?? c.value ?? String(c.id)}
                          </Typography>
                        }
                      />
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          );
        }

        return (
          <Box sx={{ width: "100%", my: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1, textAlign: "center" }}>
              Choisissez une reponse
            </Typography>

            <ToggleButtonGroup
              exclusive
              value={selectedChoiceId}
              onChange={(_, val) => setSelectedChoiceId(val)}
              disabled={isResultMode || isSubmitting}
              sx={{
                width: "100%",
                maxWidth: 720,
                mx: "auto",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
                "& .MuiToggleButtonGroup-grouped": {
                  border: "1px solid rgba(255,255,255,0.16) !important",
                  borderRadius: "14px !important",
                },
              }}
            >
              {choices.map((c) => (
                <ToggleButton
                  key={c.id}
                  value={c.id}
                  sx={{
                    color: "common.white",
                    justifyContent: "center",
                    fontWeight: 900,
                    minHeight: 52,
                    backgroundColor: "rgba(0,0,0,0.25)",
                    "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.16)" },
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
                  }}
                >
                  {c.label ?? c.value ?? String(c.id)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        );
      }

      case "BINARY_SWIPE": {
        const prop = payload?.binarySwipe?.proposition ?? null;
        return (
          <Box sx={{ width: "100%", my: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1, textAlign: "center" }}>
              {prop?.label ?? prop?.value ?? "Choisissez"}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, maxWidth: 720, mx: "auto" }}>
              <Button
                variant={swipeRight === false ? "contained" : "outlined"}
                onClick={() => setSwipeRight(false)}
                disabled={isResultMode || isSubmitting}
                sx={{ minHeight: 52, borderRadius: 2, fontWeight: 900 }}
              >
                Faux
              </Button>
              <Button
                variant={swipeRight === true ? "contained" : "outlined"}
                onClick={() => setSwipeRight(true)}
                disabled={isResultMode || isSubmitting}
                sx={{ minHeight: 52, borderRadius: 2, fontWeight: 900 }}
              >
                Vrai
              </Button>
            </Box>
          </Box>
        );
      }

      case "ORDERING": {
        const items: ItemDto[] = payload?.ordering?.items ?? [];
        if (!items.length) return <Typography sx={{ color: "error.main", my: 2 }}>Aucun item a ordonner.</Typography>;

        const itemById = new Map<number, ItemDto>();
        items.forEach((it) => itemById.set(it.personId, it));

        const move = (from: number, to: number) => {
          setOrderingIds((prev) => {
            const next = [...prev];
            const [x] = next.splice(from, 1);
            next.splice(to, 0, x);
            return next;
          });
        };

        return (
          <Box sx={{ width: "100%", my: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1, textAlign: "center" }}>
              Remettez dans le bon ordre
            </Typography>

            <Stack spacing={1} sx={{ maxWidth: 720, mx: "auto" }}>
              {orderingIds.map((id, idx) => {
                const it = itemById.get(id);
                const safeAlt = it?.label ?? `Item ${id}`;
                return (
                  <Box
                    key={`${id}-${idx}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(0,0,0,0.25)",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", width: 24 }}>{idx + 1}.</Typography>

                    {it?.photoUrl ? (
                      <Box
                        component="img"
                        src={it.photoUrl ?? undefined}
                        alt={safeAlt}
                        sx={{ width: 40, height: 40, borderRadius: 2, objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)" }} />
                    )}

                    <Typography sx={{ color: "common.white", fontWeight: 800, flex: 1 }}>
                      {it?.label ?? `Item ${id}`}
                    </Typography>

                    <Button size="small" variant="outlined" disabled={isResultMode || idx === 0} onClick={() => move(idx, idx - 1)}>
                      Up
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isResultMode || idx === orderingIds.length - 1}
                      onClick={() => move(idx, idx + 1)}
                    >
                      Down
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      }

      case "ASSOCIATION": {
        const items: ItemDto[] = payload?.association?.items ?? [];
        if (!items.length) return <Typography sx={{ color: "error.main", my: 2 }}>Aucun item a associer.</Typography>;

        // ✅ Normalise en string[] (pas de null), et enlève les vides.
        const rightOptions: string[] = items
          .map((it) => (it.label ?? "").trim())
          .filter((s) => s.length > 0);

        const getRightForLeft = (leftId: string) => associationPairs.find((p) => p.leftId === leftId)?.rightId ?? "";

        const setPair = (leftId: string, rightId: string) => {
          setAssociationPairs((prev) => {
            const filtered = prev.filter((p) => p.leftId !== leftId);
            if (!rightId) return filtered;

            const withoutRight = filtered.filter((p) => p.rightId !== rightId);
            return [...withoutRight, { leftId, rightId }];
          });
        };

        return (
          <Box sx={{ width: "100%", my: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1, textAlign: "center" }}>
              Associez chaque personne a son libelle
            </Typography>

            <Stack spacing={1} sx={{ maxWidth: 720, mx: "auto" }}>
              {items.map((it) => {
                const leftId = String(it.personId);
                const safeAlt = (it.label ?? `Person ${it.personId}`).toString();

                return (
                  <Box
                    key={it.personId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(0,0,0,0.25)",
                    }}
                  >
                    {it.photoUrl ? (
                      <Box
                        component="img"
                        src={it.photoUrl ?? undefined}
                        alt={safeAlt}
                        sx={{ width: 44, height: 44, borderRadius: 2, objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)" }} />
                    )}

                    <Typography sx={{ color: "common.white", fontWeight: 800, flex: 1 }}>
                      {it.label ?? `Person ${it.personId}`}
                    </Typography>

                    <Select
                      size="small"
                      value={getRightForLeft(leftId)}
                      onChange={(e) => setPair(leftId, String(e.target.value))}
                      disabled={isResultMode || isSubmitting}
                      sx={{
                        minWidth: 200,
                        color: "common.white",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                        "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
                      }}
                    >
                      <MuiMenuItem value="">
                        <em>-</em>
                      </MuiMenuItem>

                      {rightOptions.map((opt) => (
                        <MuiMenuItem key={opt} value={opt}>
                          {opt}
                        </MuiMenuItem>
                      ))}
                    </Select>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      }

      default:
        return (
          <TextField
            inputRef={inputRef}
            variant="outlined"
            color="accent"
            placeholder={placeholder}
            className={shake ? "textField-shake" : undefined}
            label={label}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ my: 2, width: "100%" }}
            disabled={isResultMode || isSubmitting}
          />
        );
    }
  };

  const showBackToReview = Boolean(fromReview && goBackFromReview);

  const cardFront = (() => {
    if (!activeQuestion) return null;

    if (isMultiTargetFormat(format)) {
      const items: ItemDto[] =
        format === "ASSOCIATION" ? payload?.association?.items ?? [] : payload?.ordering?.items ?? [];

      return (
        <MultiTargetFrontPanel
          color={color}
          items={items}
          prompt={activeQuestion?.display?.prompt}
          subtitle={activeQuestion?.display?.subtitle}
          timed={timed}
          timeLimitMs={timeLimitMs}
        />
      );
    }

    return (
      <SingleTargetPromptOnly
        prompt={activeQuestion?.display?.prompt}
        subtitle={activeQuestion?.display?.subtitle}
        timed={timed}
        timeLimitMs={timeLimitMs}
      />
    );
  })();

  const showBannerOverlay = Boolean(isResultMode);

  return (
    <Box sx={{ position: "relative", p: 2, width: "100%", height: "100%" }}>
      {typeof progress === "number" && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 4,
            zIndex: 10,
            "& .MuiLinearProgress-bar": { backgroundColor: color },
          }}
        />
      )}

      {typeof elapsed === "number" && (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: 8,
            right: 16,
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.4)",
            px: 1,
            borderRadius: 1,
            zIndex: 10,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatElapsed(elapsed)}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        {isLoading || !hasFetched ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={300}
            animation="wave"
            sx={{ backdropFilter: "blur(3px)", backgroundColor: color + "10" }}
          />
        ) : activeQuestion ? (
          <QuizCard
            color={color}
            photoUrl={photoUrl}
            backBackgroundPhotoUrl={photoUrl}
            enableFlip={canFlip}
            isFlipped={isFlipped}
            isAnimating={isAnimating}
            isImportant={isImportant}
            onToggleImportant={toggleImportant}
            onFlip={handleFlip}
            anchorEl={anchorEl}
            onOpenMenu={openMenu}
            onCloseMenu={closeMenu}
            poolBadge={effectivePoolBadge}
            difficultyBadge={effectiveDifficultyBadge}
            front={
              <>
                {cardFront}

                <ResultBanner
                  visible={showBannerOverlay}
                  resultMessage={effectiveResultMessage}
                  yourAnswer={yourAnswerLabel}
                  correctAnswer={correctAnswerLabel}
                  isCorrect={resultSnapshot?.correct ?? undefined}
                />

                {useHelp && !isResultMode && !isFlipped && (
                  <Chip
                    label="Aide"
                    size="small"
                    variant="outlined"
                    className={willCancel ? "chip-shake" : undefined}
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: "50%",
                      transform: "translateX(-50%)",
                      borderColor: "#fff",
                      color: "#fff",
                      zIndex: 7,
                      background: `conic-gradient(
                        ${color} ${holdProgress * 360}deg,
                        rgba(255,255,255,0) 0deg
                      )`,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </>
            }
            back={renderBackContent()}
            onTransitionEnd={(e) => {
              if (e.propertyName !== "transform") return;
              setIsAnimating(false);

              if (pendingSubmissionRef.current && !isFlipped) {
                const pending = pendingSubmissionRef.current;
                pendingSubmissionRef.current = null;
                onSubmit(pending);
              }

              if (nextRequested && !isFlipped) {
                setNextRequested(false);
                onNext?.();
              }
            }}
          />
        ) : (
          <Box
            sx={{
              height: "56vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {(() => {
              const isCourseEnd = Boolean(onReloadBatch && onFreeTraining);
              const isTrainingEnd = Boolean(onReloadBatch && !onFreeTraining);

              if (isCourseEnd) {
                return (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Vous avez appris de nombreux items, voulez-vous continuer le parcours ou passer en entrainement libre ?
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
                      <Button variant="contained" onClick={onReloadBatch}>Continuer le cours</Button>
                      <Button variant="outlined" onClick={onFreeTraining}>Free training</Button>
                    </Box>
                  </>
                );
              }

              if (isTrainingEnd) {
                return (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Plus de questions disponibles dans ce batch.
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>
                      Rechargez pour continuer l'entrainement.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                      <Button variant="contained" onClick={onReloadBatch}>Recharger des questions</Button>
                      {openQuizOptions && <Button variant="outlined" onClick={openQuizOptions}>Modifier les options</Button>}
                    </Box>
                  </>
                );
              }

              if (hasHistory) {
                if (showBackToReview) {
                  return (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Bravo, vous avez termine la revision.
                      </Typography>
                      <Button variant="contained" onClick={goBackFromReview} sx={{ mb: 2 }}>
                        Retour
                      </Button>
                      <br />
                      <Typography variant="subtitle1" gutterBottom>
                        Rester sur l'entrainement ?
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
                        {onRetry && <Button onClick={onRetry}>Recommencer</Button>}
                        {openQuizOptions && <Button onClick={openQuizOptions}>Modifier les options</Button>}
                      </Box>
                    </>
                  );
                }
                return (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Bravo, vous avez fini le quiz.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
                      {onRetry && <Button onClick={onRetry}>Recommencer</Button>}
                      {openQuizOptions && <Button onClick={openQuizOptions}>Modifier les options</Button>}
                    </Box>
                  </>
                );
              }

              return (
                <>
                  <Typography variant="h6" color="error" gutterBottom>
                    Aucun resultat trouve.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
                    {openQuizOptions && <Button onClick={openQuizOptions}>Modifier les options</Button>}
                  </Box>
                </>
              );
            })()}
          </Box>
        )}

        {activeQuestion && (
          <>
            {renderAnswerInput()}

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {errorMessage}
                </Typography>
                {onRetrySubmit && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onRetrySubmit}
                    sx={{ mt: 0.5, borderColor: "error.main", color: "error.main" }}
                  >
                    Réessayer
                  </Button>
                )}
              </Alert>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", gap: 1 }}>
              {!isResultMode && openQuizOptions && (
                <Button variant="outlined" className="menu" onClick={openQuizOptions}>
                  Options
                </Button>
              )}

              {!isResultMode && (
                <Button
                  variant="contained"
                  className="menu"
                  onClick={handleSubmit}
                  disabled={isAnimating || isSubmitting}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 1,
                    px: 3,
                    py: 1.5,
                    fontWeight: 900,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: "inherit" }} />
                      Envoi...
                    </>
                  ) : (
                    submitLabel
                  )}
                  <Box
                    component="span"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 1,
                      boxSizing: "border-box",
                      border: "2px solid rgba(255,255,255,0.5)",
                      transform: `scale(${1 + holdProgress * 0.2})`,
                      opacity: holdProgress,
                      transition: "transform 0.1s linear, opacity 0.1s linear",
                      pointerEvents: "none",
                    }}
                  />
                </Button>
              )}

              {isResultMode && onNext && (
                <Button
                  variant="contained"
                  className="menu"
                  disabled={isAnimating}
                  onClick={handleNext}
                  sx={{ fontWeight: 900 }}
                >
                  {nextLabel}
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default QuizDisplay;
