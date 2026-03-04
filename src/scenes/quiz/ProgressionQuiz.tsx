// src/scenes/courses/ProgressionQuiz.tsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCourse } from "../../contexts/CoursesContext";
import { useOrgData } from "../../contexts/OrgDataContext";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";

import { GameMode } from "../../models/commons/Game/GameMode/GameMode.model";
import { repetitionPatterns } from "../../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { QuizEntry, QuizEntryWithRepetition } from "../../models/commons/Game/QuizEntry";
import { PersonAttributeLiteDto } from "../../services/dto/person/PersonAttributeLiteDto";

import {
  answerCourse,
  continueCourse,
  getTrainingList,
  useHelp as useCourseHelp,
} from "../../services/business/courses/course.service";

import { QuizAnswerRequestDto } from "../../services/dto/quiz/QuizAnswerRequestDto";
import { QuizAnswerResultDto } from "../../services/dto/quiz/QuizAnswerResultDto";
import { buildQuizQuestionRequest } from "../../services/dto/quiz/QuizQuestionRequestDto";
import { QuizAnswerSubmissionDto } from "../../services/dto/quiz/QuizAnswerSubmissionDto";
import { QuizQuestionDto } from "../../services/dto/quiz/QuizQuestionDto";

import { notifyError } from "../../services/notification/toast.service";

import QuizDisplay, { type QuizResultSnapshot } from "../quiz/QuizDisplay";
// Machine à états pour quiz robuste
type QuizState =
  | { type: "loading" }
  | { type: "idle"; question: QuizQuestionDto }
  | { type: "submitting"; question: QuizQuestionDto; submission: QuizAnswerSubmissionDto }
  | { type: "result"; snapshot: QuizResultSnapshot }
  | { type: "error"; question: QuizQuestionDto; submission: QuizAnswerSubmissionDto; errorMessage: string }
  | { type: "exhausted" };

export const ProgressionQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const { selectedCourse } = useCourse();
  const { modes } = useOrgData();

  const { setQuizList, setReviewList, setSessionOptions, setUncheckedNewSession } = useQuizSession();

  const [state, setState] = useState<QuizState>({ type: "loading" });

  useEffect(() => {
    if (!selectedCourse) {
      navigate("/");
      return;
    }

    setState({ type: "loading" });
    continueCourse(selectedCourse.id)
      .then((q) => setState({ type: "idle", question: q }))
      .catch((err) => {
        console.error(err);
        notifyError("Impossible de démarrer le cours");
      });
  }, [selectedCourse, navigate]);

    const handleSubmit = useCallback(
    async (submission: QuizAnswerSubmissionDto) => {
      if (!selectedCourse) return;

      if (state.type !== "idle" && state.type !== "error") return;

      const question = state.question;
      const questionHandle = question.questionHandle;

      if (!questionHandle) {
        console.error("QuizQuestionDto.questionHandle manquant pour une question COURSE", question);
        setState({
          type: "error",
          question,
          submission,
          errorMessage: "Question invalide (questionHandle manquant).",
        });
        return;
      }

      setState({ type: "submitting", question, submission });

      const nextRequest = buildQuizQuestionRequest({});
      const req: QuizAnswerRequestDto = { questionHandle, submission, nextRequest };

      try {
        const res: QuizAnswerResultDto = await answerCourse(selectedCourse.id, req);

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

          // Compat si QuizDisplay l'utilise encore
          correctAnswer,
          userAnswer,
        };

        setState({ type: "result", snapshot });
      } catch (err: any) {
        console.error("[ProgressionQuiz] handleSubmit error", err);
        setState({
          type: "error",
          question,
          submission,
          errorMessage: "Erreur lors de l'envoi de la reponse. Veuillez reessayer.",
        });
      }
    },
    [selectedCourse, state]
  );
const handleNext = useCallback(() => {
    if (state.type !== "result") return;

    const nextQuestion = state.snapshot.nextQuestion;

    if (nextQuestion) {
      setState({ type: "idle", question: nextQuestion });
    } else {
      setState({ type: "exhausted" });
    }
  }, [state]);

  const handleReloadBatch = useCallback(async () => {
    if (!selectedCourse) return;

    setState({ type: "loading" });
    try {
      const next = await continueCourse(selectedCourse.id);
      setState({ type: "idle", question: next });
    } catch (err) {
      console.error(err);
      notifyError("Impossible de charger de nouvelles questions.");
    }
  }, [selectedCourse]);

  const handleRetrySubmit = useCallback(() => {
    if (state.type !== "error") return;
    handleSubmit(state.submission);
  }, [state, handleSubmit]);

  const handleFreeTraining = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      const entries: QuizEntry[] = await getTrainingList(selectedCourse.id);

      const reviewEntries: QuizEntryWithRepetition[] = entries.map((e) => ({
        ...e,
        repetitionData: {
          totalRepetitionCount: 0,
          correctRepetitionCount: 0,
          easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
          interval: repetitionPatterns.optimal.initialInterval,
        },
      }));

      setReviewList(reviewEntries);
      setUncheckedNewSession(true);
      setQuizList(reviewEntries);

      const mode: GameMode | undefined = modes.find((m) => m.id === selectedCourse.gameModeId);
      if (!mode) {
        notifyError("Mode de jeu du cours introuvable.");
        return;
      }

      setSessionOptions({
        mode,
        filters: [],
        sorts: [],
        populationScope: "FOLLOWED",
        repetitionPattern: repetitionPatterns.optimal,
        helps: { typosFriendly: true, initialGiven: true },
      });

      navigate("/training");
    } catch (e) {
      console.error(e);
      notifyError("Impossible de charger la liste d'entraînement.");
    }
  }, [
    selectedCourse,
    modes,
    setReviewList,
    setUncheckedNewSession,
    setQuizList,
    setSessionOptions,
    navigate,
  ]);

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
        showInitials={false}
        onSubmit={() => {}}
        isLoading={false}
        hasFetched
        onFreeTraining={handleFreeTraining}
        onReloadBatch={handleReloadBatch}
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
        showInitials={false}
        useHelp={async () => {
          if (!selectedCourse) return [];
          const courseQuestionId = question.context?.courseQuestionId;
          if (!courseQuestionId) return [];
          const attrs: PersonAttributeLiteDto[] = await useCourseHelp(selectedCourse.id, courseQuestionId);
          return attrs;
        }}
        onSubmit={handleSubmit}
        isResultMode={false}
        errorMessage={state.type === "error" ? state.errorMessage : null}
        onRetrySubmit={state.type === "error" ? handleRetrySubmit : undefined}
        onFreeTraining={handleFreeTraining}
        onReloadBatch={handleReloadBatch}
        onRetry={handleReloadBatch}
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
        showInitials={false}
        onSubmit={() => {}}
        isResultMode
        resultSnapshot={snapshot}
        onNext={handleNext}
        onFreeTraining={handleFreeTraining}
        onReloadBatch={handleReloadBatch}
        onRetry={handleReloadBatch}
      />
    );
  }

  return null;
};

export default ProgressionQuiz;
