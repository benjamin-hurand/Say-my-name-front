// src/scenes/quiz/TrainingQuiz.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useQuizOptions } from "../../contexts/QuizOptionsContext";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";

import {
  repetitionPatterns,
  SpacedRepetitionData,
} from "../../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { QuizEntryWithRepetition } from "../../models/commons/Game/QuizEntry";
import { QuizHistoryEntry } from "../../models/commons/Game/QuizHistoryEntry";

import { PersonAttributeLiteDto } from "../../services/dto/person/PersonAttributeLiteDto";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../../services/notification/toast.service";

import { QuizQuestionDto } from "../../services/dto/quiz/QuizQuestionDto";
import { QuizAnswerSubmissionDto } from "../../services/dto/quiz/QuizAnswerSubmissionDto";
import { QuizAnswerRequestDto } from "../../services/dto/quiz/QuizAnswerRequestDto";
import { QuizAnswerResultDto } from "../../services/dto/quiz/QuizAnswerResultDto";
import {
  QuizQuestionRequestDto,
  buildQuizQuestionRequest,
} from "../../services/dto/quiz/QuizQuestionRequestDto";

import QuizDisplay, { type QuizResultSnapshot } from "./QuizDisplay";
import {
  continueTraining,
  answerTraining,
} from "../../services/business/quiz/quiz.service";

const MAX_CORRECT_REPETITIONS = 2;
type AnswerQuality = 0 | 5;

// Machine à états pour quiz robuste
type TrainingQuizState =
  | { type: "loading" }
  | { type: "idle"; question: QuizQuestionDto; helpUsed: boolean; batch: QuizQuestionDto[]; batchIndex: number }
  | {
      type: "submitting";
      question: QuizQuestionDto;
      submission: QuizAnswerSubmissionDto;
      helpUsed: boolean;
      batch: QuizQuestionDto[];
      batchIndex: number;
    }
  | { type: "result"; snapshot: QuizResultSnapshot; helpUsed: boolean; batch: QuizQuestionDto[]; batchIndex: number }
  | {
      type: "error";
      question: QuizQuestionDto;
      submission: QuizAnswerSubmissionDto;
      errorMessage: string;
      helpUsed: boolean;
      batch: QuizQuestionDto[];
      batchIndex: number;
    }
  | { type: "exhausted" };

function updateRepetitionData(
  data: SpacedRepetitionData | null,
  quality: AnswerQuality,
  pattern = repetitionPatterns.optimal
): SpacedRepetitionData {
  const d =
    data || {
      totalRepetitionCount: 0,
      correctRepetitionCount: 0,
      easinessFactor: pattern.initialEasinessFactor,
      interval: pattern.initialInterval,
    };

  const newTotal = d.totalRepetitionCount + 1;

  if (quality < 3) {
    return {
      totalRepetitionCount: newTotal,
      correctRepetitionCount: 0,
      easinessFactor: pattern.initialEasinessFactor,
      interval: pattern.initialInterval,
    };
  }

  const newCorrect = d.correctRepetitionCount + 1;

  if (newTotal === 1) {
    return {
      totalRepetitionCount: newTotal,
      correctRepetitionCount: newCorrect,
      easinessFactor: d.easinessFactor,
      interval: -1,
    };
  }

  const newInterval =
    newCorrect === 1 ? pattern.secondInterval : Math.round(d.interval * d.easinessFactor);

  let newEz = d.easinessFactor - 0.8 + 0.28 * quality - 0.02 * quality * quality;
  if (newEz < 1.3) newEz = 1.3;

  return {
    totalRepetitionCount: newTotal,
    correctRepetitionCount: newCorrect,
    easinessFactor: newEz,
    interval: newInterval,
  };
}

function getQuestionHandle(q: QuizQuestionDto): string | null {
  return q.questionHandle ?? null;
}

function getQuestionPersonId(q: QuizQuestionDto): number {
  // Extract personId from payload (multi-format support)
  const p = q.payload;
  if (p?.textInput?.targetPersonId != null) return p.textInput.targetPersonId;
  if (p?.cloze?.targetPersonId != null) return p.cloze.targetPersonId;
  if (p?.hangman?.targetPersonId != null) return p.hangman.targetPersonId;
  if (p?.choices?.targetPersonId != null) return p.choices.targetPersonId;
  if (p?.binarySwipe?.targetPersonId != null) return p.binarySwipe.targetPersonId;
  if (p?.ordering?.items?.[0]?.personId != null) return p.ordering.items[0].personId;
  if (p?.association?.items?.[0]?.personId != null) return p.association.items[0].personId;
  return -1;
}

function getQuestionPhotoUrl(q: QuizQuestionDto): string {
  const p = q.payload;
  if (p?.textInput?.targetPhotoUrl) return p.textInput.targetPhotoUrl;
  if (p?.cloze?.targetPhotoUrl) return p.cloze.targetPhotoUrl;
  if (p?.hangman?.targetPhotoUrl) return p.hangman.targetPhotoUrl;
  if (p?.choices?.targetPhotoUrl) return p.choices.targetPhotoUrl;
  if (p?.binarySwipe?.targetPhotoUrl) return p.binarySwipe.targetPhotoUrl;
  if (p?.ordering?.items?.[0]?.photoUrl) return p.ordering.items[0].photoUrl;
  if (p?.association?.items?.[0]?.photoUrl) return p.association.items[0].photoUrl;
  return "";
}

function getQuestionInitials(q: QuizQuestionDto): string {
  return q.hints?.initials ?? "";
}

export const TrainingQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();

  const {
    quizList,
    setQuizList,
    quizHistory,
    setQuizHistory,
    reviewList,
    sessionOptions,
    setSessionOptions,
    uncheckedNewSession,
    setUncheckedNewSession,
    resetSession,
  } = useQuizSession();
  const {
    selectedPopulationScope,
    setSelectedPopulationScope,
    targetAttributes,
    selectedTargetAttribute,
    setSelectedTargetAttribute,
    selectedFilters,
    setSelectedFilters,
    selectedSortingMethods,
    setSelectedSortingMethods,
    selectedRepetitionPattern,
    setSelectedRepetitionPattern,
    selectedHelps,
    setSelectedHelps,
    saveProgress,
    selectedFormat,
    setHasUncheckedCriticalChanges,
    hasUncheckedCriticalChanges,
    hasCriticalChanges,
  } = useQuizOptions();

  const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);
  const [state, setState] = useState<TrainingQuizState>({ type: "loading" });

  // Race condition protection
  const runIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const effectivePattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;

  const buildTrainingRequest = useCallback((): QuizQuestionRequestDto => {
    const mode = selectedTargetAttribute ?? targetAttributes?.[0] ?? null;
    const scope = selectedPopulationScope ?? "ALL";
    const formatMode = selectedFormat === "AUTO" ? "AUTO" : "FORCED";
    const format = selectedFormat === "AUTO" ? null : selectedFormat;
    const firstFilter = selectedFilters?.[0] ?? null;

    return buildQuizQuestionRequest({
      options: {
        targetAttributeId: mode?.id ?? null,
        populationScope: scope ?? null,
        category: firstFilter
          ? { attributeId: firstFilter.attribute.id, value: firstFilter.minValue }
          : null,
        trackKnowledge: saveProgress,
      },
      formatMode,
      format,
      timed: null,
      timeLimitMs: null,
    });
  }, [
    selectedTargetAttribute,
    targetAttributes,
    selectedPopulationScope,
    selectedFilters,
    selectedFormat,
    saveProgress,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.debug("[TrainingQuiz] UNMOUNT - cleaning up session");
      resetSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repetition pattern change
  useEffect(() => {
    if (backupQuizList.length === 0 || state.type === "loading") return;

    const pattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;

    const resetList = backupQuizList.map((item) => ({
      ...item,
      repetitionData: {
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: pattern.initialEasinessFactor,
        interval: pattern.initialInterval,
      },
    }));
    setBackupQuizList(resetList);

    const baseList = resetList.slice(quizHistory.length);
    const newQuizList: QuizEntryWithRepetition[] = [...baseList];

    if (pattern.initialInterval !== -1) {
      quizHistory.forEach((historyEntry) => {
        if (!historyEntry.isCorrect) {
          const insertionIndex =
            pattern.initialInterval < newQuizList.length
              ? pattern.initialInterval
              : newQuizList.length;
          newQuizList.splice(insertionIndex, 0, {
            ...historyEntry,
            repetitionData: {
              ...historyEntry.repetitionData,
              interval: pattern.initialInterval,
            },
          });
        }
      });
    }

    setQuizList(newQuizList);
    notifySuccess("Le pattern de repetition a ete mis a jour.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepetitionPattern]);

  // Fetch questions from backend
  const fetchQuestions = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;

    console.debug("[TrainingQuiz] fetchQuestions START", {
      runId: currentRunId,
      mode: selectedTargetAttribute?.id,
      scope: selectedPopulationScope,
      format: selectedFormat,
      filters: selectedFilters?.map((f) => f.id),
      sorts: selectedSortingMethods?.map((s) => s.id),
    });

    setState({ type: "loading" });

    if (!selectedTargetAttribute || !targetAttributes || targetAttributes.length === 0) {
      setSelectedPopulationScope("ALL");
      if (targetAttributes && targetAttributes.length > 0) setSelectedTargetAttribute(targetAttributes[0]);
      setSelectedRepetitionPattern(repetitionPatterns.optimal);
      setSelectedHelps({ initialGiven: true, typosFriendly: true });
      setSelectedFilters([]);
      setSelectedSortingMethods([]);
    }

    try {
      const targetAttribute = selectedTargetAttribute ?? targetAttributes?.[0];
      if (!targetAttribute) {
        notifyError("Aucun objectif disponible.");
        setQuizList([]);
        setBackupQuizList([]);
        setState({ type: "exhausted" });
        return;
      }

      const scope = selectedPopulationScope ?? "ALL";
      const pattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;
      const req = buildTrainingRequest();
      const question = await continueTraining(req);
      const questions: QuizQuestionDto[] = question ? [question] : [];

      if (currentRunId !== runIdRef.current) {
        console.debug("[TrainingQuiz] fetchQuestions STALE - ignoring response", {
          currentRunId,
          latestRunId: runIdRef.current,
        });
        return;
      }

      if (controller.signal.aborted) {
        console.debug("[TrainingQuiz] fetchQuestions ABORTED", { runId: currentRunId });
        return;
      }

      console.debug("[TrainingQuiz] fetchQuestions SUCCESS", {
        runId: currentRunId,
        questionCount: questions.length,
      });

      if (!questions.length) {
        notifyWarning("Aucun resultat trouve pour les options selectionnees.");
        setQuizList([]);
        setBackupQuizList([]);
        setState({ type: "exhausted" });
      } else {
        const enriched: QuizEntryWithRepetition[] = questions.map((q) => ({
          photoUrl: getQuestionPhotoUrl(q),
          personId: getQuestionPersonId(q),
          initials: getQuestionInitials(q) || "",
          repetitionData: {
            totalRepetitionCount: 0,
            correctRepetitionCount: 0,
            easinessFactor: pattern.initialEasinessFactor,
            interval: pattern.initialInterval,
          },
        }));

        setQuizList(enriched);
        setBackupQuizList(enriched);

        setSessionOptions({
          targetAttribute,
          filters: selectedFilters ?? [],
          sorts: selectedSortingMethods ?? [],
          populationScope: scope,
          repetitionPattern: pattern,
          helps: {
            typosFriendly: selectedHelps.typosFriendly,
            initialGiven: selectedHelps.initialGiven,
          },
        });

        console.debug("[TrainingQuiz] Storing batch of questions", { batchSize: questions.length });
        setState({ type: "idle", question: questions[0], helpUsed: false, batch: questions, batchIndex: 0 });
      }
    } catch (e: any) {
      if (e.name === "AbortError" || controller.signal.aborted) {
        console.debug("[TrainingQuiz] fetchQuestions ABORTED by exception", { runId: currentRunId });
        return;
      }

      console.error("[TrainingQuiz] fetchQuestions ERROR", { runId: currentRunId, error: e });
      notifyError("Erreur lors du chargement du training.");
      setState({ type: "exhausted" });
      setQuizList([]);
      setBackupQuizList([]);
    }
  }, [
    targetAttributes,
    selectedPopulationScope,
    selectedTargetAttribute,
    selectedFilters,
    selectedSortingMethods,
    selectedRepetitionPattern,
    selectedHelps,
    selectedFormat,
    buildTrainingRequest,
    setSelectedPopulationScope,
    setSelectedTargetAttribute,
    setSelectedRepetitionPattern,
    setSelectedHelps,
    setSelectedFilters,
    setSelectedSortingMethods,
    setSessionOptions,
    setQuizList,
  ]);
// INIT logic
  useEffect(() => {
    console.debug("[TrainingQuiz] INIT useEffect", {
      reviewListLength: reviewList.length,
      uncheckedNewSession,
      hasUncheckedCriticalChanges,
      hasCriticalChanges,
      quizListLength: quizList?.length ?? 0,
      historyLength: quizHistory.length,
    });

    if (reviewList.length > 0 && sessionOptions && uncheckedNewSession) {
      console.debug("[TrainingQuiz] INIT - restoring from reviewList");
      setSelectedRepetitionPattern(repetitionPatterns.optimal);
      setSelectedPopulationScope(sessionOptions.populationScope);
      setSelectedTargetAttribute(sessionOptions.targetAttribute);
      setSelectedFilters(sessionOptions.filters);

      setSelectedHelps({
        typosFriendly: Boolean(sessionOptions.helps?.typosFriendly),
        initialGiven: Boolean(sessionOptions.helps?.initialGiven),
      });

      const filtered = reviewList.filter((e) => e.repetitionData.correctRepetitionCount === 0);
      setQuizList(filtered);
      setBackupQuizList(filtered);

      const historyEntries: QuizHistoryEntry[] = reviewList.map((e) => ({
        photoUrl: e.photoUrl,
        personId: e.personId,
        initials: e.initials ?? "",
        isCorrect: e.repetitionData.correctRepetitionCount > 0,
        repetitionData: e.repetitionData,
      }));

      setQuizHistory(historyEntries);
      setUncheckedNewSession(false);

      fetchQuestions();
      return;
    }

    if (hasUncheckedCriticalChanges || hasCriticalChanges) {
      console.debug("[TrainingQuiz] INIT - critical changes detected, refetching");
      setHasUncheckedCriticalChanges(false);
      fetchQuestions();
      return;
    }

    if (!quizList || quizList.length === 0) {
      if (quizHistory.length > 0) {
        console.debug("[TrainingQuiz] INIT - quiz exhausted (empty list but has history)");
        setState({ type: "exhausted" });
        return;
      }
      console.debug("[TrainingQuiz] INIT - fetching initial questions");
      fetchQuestions();
      return;
    }

    console.debug("[TrainingQuiz] INIT - quiz already loaded, setting exhausted");
    setState({ type: "exhausted" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit answer through backend
  const handleSubmit = useCallback(
    async (submission: QuizAnswerSubmissionDto) => {
      if (state.type !== "idle" && state.type !== "error") {
        console.debug("[TrainingQuiz] handleSubmit - invalid state", { currentState: state.type });
        return;
      }

      const question = state.question;
      const helpUsed = state.helpUsed;
      const batch = state.batch;
      const batchIndex = state.batchIndex;

      const questionHandle = getQuestionHandle(question);
      if (!questionHandle) {
        console.error("[TrainingQuiz] handleSubmit - missing questionHandle", { question });
        setState({
          type: "error",
          question,
          submission,
          errorMessage: "Erreur: questionHandle manquant (DTO).",
          helpUsed,
          batch,
          batchIndex,
        });
        return;
      }

      console.debug("[TrainingQuiz] handleSubmit START", {
        questionHandle,
        helpUsed,
        batchIndex,
        batchSize: batch.length,
        quizListLength: quizList?.length ?? 0,
        historyLength: quizHistory.length,
      });

      setState({ type: "submitting", question, submission, helpUsed, batch, batchIndex });

      try {
        const nextRequest = buildTrainingRequest();
        const req: QuizAnswerRequestDto = {
          questionHandle,
          submission,
          nextRequest,
        };

        const res: QuizAnswerResultDto = await answerTraining(req);

        const effectiveCorrect = Boolean(res.correct) && !helpUsed;
        const quality: AnswerQuality = effectiveCorrect ? 5 : 0;

        const currentEntry = quizList?.[0];
        const currentRep: SpacedRepetitionData =
          currentEntry?.repetitionData ?? {
            totalRepetitionCount: 0,
            correctRepetitionCount: 0,
            easinessFactor: effectivePattern.initialEasinessFactor,
            interval: effectivePattern.initialInterval,
          };

        const updatedRep = updateRepetitionData(currentRep, quality, effectivePattern);

        const personId = getQuestionPersonId(question);
        const photoUrl = getQuestionPhotoUrl(question);
        const initials = getQuestionInitials(question) || "";

        setQuizHistory((prev) => {
          const entry: QuizHistoryEntry = {
            photoUrl,
            personId,
            initials,
            isCorrect: effectiveCorrect,
            repetitionData: updatedRep,
          };
          const exists = prev.find((e) => e.personId === personId);
          return exists
            ? prev.map((e) => (e.personId === personId ? { ...e, ...entry } : e))
            : [...prev, entry];
        });

        setQuizList((prev) => {
          if (!prev || prev.length === 0) return prev;

          const [first, ...rest] = prev;

          if (
            updatedRep.correctRepetitionCount < MAX_CORRECT_REPETITIONS &&
            ((effectiveCorrect && updatedRep.totalRepetitionCount > 1) || !effectiveCorrect) &&
            updatedRep.interval !== -1
          ) {
            const idx = Math.min(updatedRep.interval, rest.length);
            const nextFirst = { ...first, repetitionData: updatedRep };
            rest.splice(idx, 0, nextFirst);
            return rest;
          }

          return rest;
        });

        // ✅ Nouveau modèle : tout est dans itemResults
        const targetItem =
          res.itemResults?.find((it) => it.role === "TARGET") ?? res.itemResults?.[0] ?? null;

        const attrs = targetItem?.resultAttributes ?? null;
        const correctAnswer = targetItem?.correctAnswer ?? null;
        const userAnswer = targetItem?.userAnswerNormalized ?? null;

        const snapshot: QuizResultSnapshot = {
          question,
          submission,
          itemResults: res.itemResults ?? null,
          feedbackMessage: res.feedbackMessage ?? null,
          resultAttributes: attrs,
          correct: Boolean(res.correct),
          nextQuestion: res.nextQuestion ?? null,

          // Compat si ton QuizDisplay l'utilise encore
          correctAnswer,
          userAnswer,
        };

        console.debug("[TrainingQuiz] handleSubmit SUCCESS", {
          correct: res.correct,
          effectiveCorrect,
          hasNextQuestion: Boolean(res.nextQuestion),
          updatedRepetition: updatedRep,
          batchIndex,
          batchSize: batch.length,
        });

        setState({ type: "result", snapshot, helpUsed, batch, batchIndex });
      } catch (e) {
        console.error("[TrainingQuiz] handleSubmit ERROR", { questionHandle, error: e });

        setState({
          type: "error",
          question,
          submission,
          errorMessage: "Erreur lors de l'envoi de la réponse. Veuillez réessayer.",
          helpUsed,
          batch,
          batchIndex,
        });
      }
    },
    [state, effectivePattern, quizList, quizHistory.length, setQuizHistory, setQuizList, buildTrainingRequest]
  );

  const handleNext = useCallback(async () => {
    if (state.type !== "result") {
      console.debug("[TrainingQuiz] handleNext - invalid state", { currentState: state.type });
      return;
    }

    const { batch, batchIndex } = state;
    const nextIndex = batchIndex + 1;

    console.debug("[TrainingQuiz] handleNext", {
      currentBatchIndex: batchIndex,
      nextIndex,
      batchSize: batch.length,
      quizListLength: quizList?.length ?? 0,
      historyLength: quizHistory.length,
    });

    // Si on a encore des questions dans le batch local
    if (nextIndex < batch.length) {
      console.debug("[TrainingQuiz] handleNext - moving to batch[%d]", nextIndex);
      setState({ type: "idle", question: batch[nextIndex], helpUsed: false, batch, batchIndex: nextIndex });
      return;
    }

    // Fin du batch : refetch automatiquement
    console.debug("[TrainingQuiz] handleNext - batch exhausted, auto-refetching new batch");
    setState({ type: "loading" });

    // Lance fetchQuestions en arrière-plan
    setTimeout(() => {
      fetchQuestions();
    }, 0);
  }, [state, quizList, quizHistory.length, fetchQuestions]);

  const handleRetrySubmit = useCallback(() => {
    if (state.type !== "error") return;
    const { submission } = state;
    handleSubmit(submission);
  }, [state, handleSubmit]);

  const handleUseHelp = useCallback(async (): Promise<PersonAttributeLiteDto[]> => {
    if (state.type === "idle" || state.type === "error") {
      const { question, batch, batchIndex } = state;
      setState({
        ...state,
        helpUsed: true,
        question,
        batch,
        batchIndex
      });
    }
    return [];
  }, [state]);

  const openQuizOptions = () => navigate("/training/options", { replace: true });
  const fromReview = reviewList.length > 0;

  if (state.type === "loading") {
    return (
      <QuizDisplay
        color={color}
        question={null}
        showInitials={false}
        onSubmit={() => {}}
        isLoading
        hasFetched={false}
      />
    );
  }

  if (state.type === "exhausted") {
    return (
      <QuizDisplay
        color={color}
        question={null}
        showInitials={selectedHelps.initialGiven}
        openQuizOptions={openQuizOptions}
        onSubmit={() => {}}
        isLoading={false}
        hasFetched
        hasHistory={quizHistory.length > 0}
        onRetry={fetchQuestions}
        fromReview={fromReview}
        goBackFromReview={() => navigate("/menu")}
      />
    );
  }

  if (state.type === "idle" || state.type === "submitting" || state.type === "error") {
    const question = state.question;

    return (
      <QuizDisplay
        color={color}
        question={question}
        hasFetched
        isLoading={false}
        isSubmitting={state.type === "submitting"}
        showInitials={selectedHelps.initialGiven}
        openQuizOptions={openQuizOptions}
        onSubmit={handleSubmit}
        isResultMode={false}
        errorMessage={state.type === "error" ? state.errorMessage : null}
        onRetrySubmit={state.type === "error" ? handleRetrySubmit : undefined}
        hasHistory={quizHistory.length > 0}
        onRetry={fetchQuestions}
        fromReview={fromReview}
        goBackFromReview={() => navigate("/menu")}
        useHelp={handleUseHelp}
      />
    );
  }

  if (state.type === "result") {
    const snapshot = state.snapshot;

    return (
      <QuizDisplay
        color={color}
        question={snapshot.question}
        hasFetched
        isLoading={false}
        isSubmitting={false}
        showInitials={selectedHelps.initialGiven}
        openQuizOptions={openQuizOptions}
        onSubmit={() => {}}
        isResultMode
        resultSnapshot={snapshot}
        onNext={handleNext}
        hasHistory={quizHistory.length > 0}
        onRetry={fetchQuestions}
        fromReview={fromReview}
        goBackFromReview={() => navigate("/menu")}
      />
    );
  }

  return null;
};

export default TrainingQuiz;
