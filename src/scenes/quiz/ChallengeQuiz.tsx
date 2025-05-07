import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import QuizDisplay from "./QuizDisplay";
import { useAttempt } from "../../contexts/ChallengeAttemptContext";
import { startChallengeAttempt, stopChallengeAttempt, verifyUserCanAttempt } from "../../services/business/challenges/challenge.service";
import { Box, Typography } from "@mui/material";
import { notifyError } from "../../services/notification/toast.service";
import { ChallengeAlreadyStartedError, AttemptNotFoundError } from "../../errors/ApiErrors";
import { useAuth } from "../../contexts/AuthContext";

export const ChallengeQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const { attempt, loadAttempt, history, addHistoryEntry } = useAttempt();
  const { user } = useAuth()

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answer, setAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [countdownLabel, setCountdownLabel] = useState<string>("3");
  const [started, setStarted] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);

  const progress = questions.length
    ? (history.length / questions.length) * 100
    : 0;

  // 1️⃣ Charger la tentative
  useEffect(() => {
    if (!attempt) {
      notifyError("Tututut ! Rien à voir ici !");
      navigate("/challenges", { replace: true });

    } else {
      console.log("tentative ok !", attempt);
      setIsLoading(false);
    }
  }, [attempt, loadAttempt, navigate]);

  // 2️⃣ Initialiser questions et sessionStorage quand la tentative est chargée
  useEffect(() => {
    if (!attempt || !user) return;
    console.log("init attempt");

    const init = async () => {
      // ❌ Ne pas continuer si ce n’est pas votre user
      if (attempt.userId !== user.id) {
        notifyError("Tentative introuvable ou non autorisée.");
        navigate("/challenges", { replace: true });
        return;
      }

      // ✅ Tout est ok : on initialise le quiz
      setQuestions(attempt.challengeEntries);
      setCurrentIndex(0);
      setIsLoading(false);
    };

    init();
  }, [attempt, user, navigate]);
  
  // 3️⃣ Countdown
  useEffect(() => {
    if (!isLoading && questions.length > 0 && !started) {
      const timers = [
        setTimeout(() => setCountdownLabel("3"), 0),
        setTimeout(() => setCountdownLabel("2"), 1000),
        setTimeout(() => setCountdownLabel("1"), 2000),
        setTimeout(async () => {
          setCountdownLabel("GO");
          try {
            await startChallengeAttempt(attempt!.id);
            setStarted(true);
            setTimeout(() => setCountdownLabel(""), 500);
          } catch (err) {
            console.error("Erreur démarrage attempt:", err);
            if (err instanceof ChallengeAlreadyStartedError) {
              notifyError("Ce challenge a déjà été démarré.");
            } else if (err instanceof AttemptNotFoundError) {
              notifyError("Tentative introuvable.");
            } else {
              console.error("Erreur démarrage attempt:", err);
              notifyError("Erreur inattendue, retour au menu.");
            }
            navigate("/challenges", { replace: true });
          }
        }, 3000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isLoading, questions, started, attempt]);

  // 4️⃣ Chrono
  useEffect(() => {
    if (started) {
      const intervalId = window.setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(intervalId);
    }
  }, [started]);

  // 5️⃣ Before unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!attempt) return; // Si pas d’attempt, l'autre useEffect nav vers le menu
      e.preventDefault(); // Empêche le message de confirmation de s'afficher
      // navigator.sendBeacon garantit l’envoi même si la page se ferme.
      const url = `/api/attempts/${attempt.id}/abandon`;
      navigator.sendBeacon(url);
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [attempt?.id]);

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
          navigate(`/challenges/summary`, { replace: true })
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
    const handler = (e: KeyboardEvent) => e.key === "Enter" && validateAnswer();
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
      elapsed={elapsed}
      progress={progress}
    />
  );
};
