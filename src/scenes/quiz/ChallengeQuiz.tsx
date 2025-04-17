// src/scenes/quiz/ChallengeQuiz.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import QuizDisplay from "./QuizDisplay";
import { useAttempt } from "../../contexts/ChallengeAttemptContext";
import { startChallengeAttempt, stopChallengeAttempt } from "../../services/business/challenges/challenge.service";
import { Box, Typography } from "@mui/material";

export const ChallengeQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const { attemptId } = useParams<{ attemptId: string }>();
  const { attempt, loadAttempt, history, addHistoryEntry } = useAttempt();

  const [questions, setQuestions] = useState(attempt?.challengeEntries || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [countdownLabel, setCountdownLabel] = useState("3");
  const [started, setStarted] = useState(false);

  // Charger ou recharger la tentative
  useEffect(() => {
    const id = Number(attemptId);
    if (!attempt || attempt.id !== id) {
      setIsLoading(true);
      loadAttempt(id);
    }
  }, [attemptId, attempt, loadAttempt]);

  // Initialiser questions + fin du chargement
  useEffect(() => {
    if (attempt) {
      setQuestions(attempt.challengeEntries);
      setCurrentIndex(0);
      setIsLoading(false);
    }
  }, [attempt]);

  // Countdown + démarrage
  useEffect(() => {
    if (!isLoading && questions.length > 0 && !started) {
      const timers = [
        setTimeout(() => setCountdownLabel("3"), 0),
        setTimeout(() => setCountdownLabel("2"), 1000),
        setTimeout(() => setCountdownLabel("1"), 2000),
        setTimeout(async () => {
          setCountdownLabel("GO");
          await startChallengeAttempt(attempt!.id);
          setStarted(true);
          setTimeout(() => setCountdownLabel(""), 500);
        }, 3000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isLoading, questions, started, attempt]);

  const current = questions[currentIndex];

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAnswer(e.target.value);

  const validateAnswer = useCallback(() => {
    if (!started || !current) return;
    addHistoryEntry({
      questionNumber: history.length + 1,
      personId: current.personId,
      answer,
    });
    setAnswer("");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      stopChallengeAttempt(attempt!.id)
        .catch((e) => console.error("Stop API error", e))
        .finally(() =>
          navigate(`/challenges/${attempt!.id}/summary`, { replace: true })
        );
    }
  }, [
    answer,
    current,
    currentIndex,
    history.length,
    questions.length,
    addHistoryEntry,
    navigate,
    started,
    attempt,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      e.key === "Enter" && validateAnswer();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [validateAnswer]);

  if (isLoading) {
    return (
      <QuizDisplay
        color={color}
        photoUrl=""
        initials={null}
        showInitials={false}
        answer={answer}
        handleAnswerChange={handleAnswerChange}
        validateAnswer={validateAnswer}
        goBackToMenu={() => navigate("/challenges", { replace: true })}
        isLoading
        hasFetched={false}
      />
    );
  }

  if (!started) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h1" sx={{ color, fontSize: "5rem" }}>
          {countdownLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <QuizDisplay
      color={color}
      photoUrl={current.photoUrl}
      initials={null}
      showInitials={false}
      answer={answer}
      handleAnswerChange={handleAnswerChange}
      validateAnswer={validateAnswer}
      goBackToMenu={() => navigate("/challenges", { replace: true })}
      isLoading={false}
      hasFetched
    />
  );
};
