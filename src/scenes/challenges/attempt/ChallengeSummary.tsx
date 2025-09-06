import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useAttempt } from "../../../contexts/ChallengeAttemptContext";
import { useThemeColorContext } from "../../../contexts/ThemeColorContext";
import { useQuizSession } from "../../../contexts/QuizSessionContext";
import { evaluateChallengeAttempt } from "../../../services/business/challenges/challenge.service";
import {
  ChallengeEvaluationRequestDto,
  ChallengeQuestionDto,
  CorrectionEntryDto,
} from "../../../services/dto/ChallengeAttemptDto";
import { ChallengeHistoryEntry } from "../../../models/commons/Game/QuizHistoryEntry";
import { QuizEntryWithRepetition } from "../../../models/commons/Game/QuizEntry";
import { repetitionPatterns } from "../../../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";
import { useGlobalData } from "../../../contexts/GlobalDataContext";
import { notifyError } from "../../../services/notification/toast.service";
import { Attribute } from "../../../models/commons/Attribute";
import { GameFilter } from "../../../models/commons/Game/GameOptions/GameFilter.model";

const ChallengeSummary: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const {
    attempt,
    history,
    resetHistory,
    evaluationResults,
    setEvaluationResults,
    challengeCardDto,
  } = useAttempt();
  const {
    setQuizList,
    setQuizHistory,
    setReviewList,
    setSessionOptions,
    setUncheckedNewSession,
  } = useQuizSession();
  const { filters, modes } = useGlobalData();

  const [loading, setLoading] = useState(true);
  const { attemptId } = useParams<{ attemptId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [challHistory, setChallHistory] = useState<ChallengeHistoryEntry[]>(
    []
  );


  // 🚩 redirection si pas d'attempt
  useEffect(() => {
    if (!attempt) {
      // Si on a un attemptId dans l'URL, on essaie de le charger
      if (attemptId) {
        const raw = localStorage.getItem(`challenge-summary-${attemptId}`);
        if (raw) {
          const { evalResults, history: savedHistory } = JSON.parse(raw);
          setEvaluationResults(evalResults);
          setChallHistory(savedHistory);
          setLoading(false);
          return; // On a trouvé une tentative dans le localStorage
        }
      }
      // Aucune tentative trouvée on redirige
      notifyError("Tututut ! Rien à voir ici ! C'est pour les winners !");
      navigate("/challenges", { replace: true });
    }
  }, [attempt, navigate, attemptId, setEvaluationResults, setChallHistory, setLoading]);

  // protection unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // récupération de la correction
  useEffect(() => {
    if (!attempt) return;

    const payload: ChallengeEvaluationRequestDto = { history };
    evaluateChallengeAttempt(attempt.id, payload)
      .then((dto) => {
        localStorage.setItem(`challenge-summary-${attempt.id}`, JSON.stringify({ evalResults: dto, history }));
        setEvaluationResults(dto);
        setChallHistory(history);
        resetHistory();
      })
      .catch(() => setError("Impossible de récupérer la correction."))
      .finally(() => setLoading(false));
  }, [attempt, resetHistory, setEvaluationResults, setChallHistory]);

  const handleStartTraining = () => {
    if (!evaluationResults || !attempt) return;

    // préparation des entrées pour entraînement
    const reviewEntries: QuizEntryWithRepetition[] =
      evaluationResults.entries.map((e: CorrectionEntryDto) => {
        const q: ChallengeQuestionDto =
          attempt.challengeEntries[e.questionNumber - 1];
        return {
          ...q,
          repetitionData: {
            totalRepetitionCount: 1,
            correctRepetitionCount: e.isCorrect ? 1 : 0,
            easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
            interval: repetitionPatterns.optimal.initialInterval,
          },
        } as QuizEntryWithRepetition;
      });

    setReviewList(reviewEntries);
    setUncheckedNewSession(true);
    setQuizList(reviewEntries);

    if (!challengeCardDto) {
      setError("Challenge introuvable.");
      notifyError("Challenge introuvable.");
      return;
    }

    const mode: GameMode | undefined = modes.find(
      (m) => m.id === challengeCardDto.challenge.gameMode.id
    );
    if (!mode) {
      setError("Mode de jeu du challenge introuvable.");
      notifyError("Mode de jeu du challenge introuvable.");
      return;
    }

    const filterAttribute: Attribute | undefined = filters.find(
      (f) => f.id === challengeCardDto.challenge.filter.attributeId
    );
    if (!filterAttribute) {
      setError("Filtre du challenge introuvable.");
      notifyError("Filtre du challenge introuvable.");
      return;
    }
    const gameFilter: GameFilter = {
      id: 0,
      attribute: filterAttribute,
      minValue: challengeCardDto.challenge.filter.minValue,
      maxValue: challengeCardDto.challenge.filter.maxValue,
    };

    setSessionOptions({
      mode,
      filters: [gameFilter],
      sorts: [],
      repetitionPattern: repetitionPatterns.optimal,
      helps: { typosFriendly: true, initialGiven: true },
    });

    navigate("/training");
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </Box>
    );
  }

  if (!evaluationResults || !attempt) return null;

  // ——— Nouveau : on sécurise la lecture de photoUrl ———
  const results = evaluationResults.entries.map(
    (e: CorrectionEntryDto) => {
      const questionDto = attempt.challengeEntries?.[
        e.questionNumber - 1
      ];
      if (!questionDto) {
        console.warn(
          `Question #${e.questionNumber} introuvable dans attempt.challengeEntries`
        );
      }
      return {
        questionNumber: e.questionNumber,
        // fallback vers 'fallback.png' si undefined
        photoUrl: questionDto?.photoUrl ?? "fallback.png",
        userAnswer:
          challHistory.find((h) => h.questionNumber === e.questionNumber)
            ?.answer ?? "—",
        correctAnswer: e.correctAnswer ?? "—",
        isCorrect: e.isCorrect,
      };
    }
  );

  return (
    <Box
      sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h4" sx={{ mb: 2, color }}>
        Récapitulatif du Challenge
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Score : {evaluationResults.totalCorrect} /{" "}
        {attempt.challengeEntries.length}
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 1,
          mb: 2,
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: color,
            borderRadius: "4px",
            border: "2px solid transparent",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          scrollbarWidth: "thin",
          scrollbarColor: `${color} transparent`,
        }}
      >
        <Table stickyHeader aria-label="Résumé">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Question</TableCell>
              <TableCell>Votre réponse</TableCell>
              <TableCell>Bonne réponse</TableCell>
              <TableCell>Résultat</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.questionNumber}>
                <TableCell>{r.questionNumber}</TableCell>
                <TableCell>
                  <Avatar
                    src={r.photoUrl}
                    alt={`Q${r.questionNumber}`}
                    variant="rounded"
                    sx={{ width: 80, height: 80 }}
                  />
                </TableCell>
                <TableCell>{r.userAnswer}</TableCell>
                <TableCell>{r.correctAnswer}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ color: r.isCorrect ? "green" : "red" }}
                  >
                    {r.isCorrect ? "✔️" : "❌"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<LeaderboardIcon />}
            sx={{
              color: "#0ff",
              borderColor: "#0ff",
              boxShadow: "0 0 5px #0ff, 0 0 20px #0ff",
              "&:hover": { boxShadow: "0 0 10px #0ff, 0 0 30px #0ff" },
            }}
          >
            Leaderboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartTraining}
            sx={{
              color: "#f0f",
              borderColor: "#f0f",
              boxShadow: "0 0 5px #f0f, 0 0 20px #f0f",
              "&:hover": { boxShadow: "0 0 10px #f0f, 0 0 30px #f0f" },
            }}
          >
            Entraînement
          </Button>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate("/", { replace: true })}
        >
          Retour au menu
        </Button>
      </Box>
    </Box>
  );
};

export default ChallengeSummary;
