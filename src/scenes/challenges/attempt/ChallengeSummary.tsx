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
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAttempt } from "../../../contexts/ChallengeAttemptContext";
import { useThemeColorContext } from "../../../contexts/ThemeColorContext";
import { useQuizSession } from "../../../contexts/QuizSessionContext";
import { evaluateChallengeAttempt } from "../../../services/business/challenges/challenge.service";
import {
  ChallengeEvaluationRequestDto,
  ChallengeQuestionDto,
  CorrectionEntryDto,
} from "../../../services/dto/ChallengeAttemptDto";
import { ChallengeHistoryEntry, QuizHistoryEntry } from "../../../models/commons/Game/QuizHistoryEntry";
import { QuizEntryWithRepetition } from "../../../models/commons/Game/QuizEntry";
import { repetitionPatterns } from "../../../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";
import { useGlobalData } from "../../../contexts/GlobalDataContext";
import { notifyError } from "../../../services/notification/toast.service";
import { Attribute } from "../../../models/commons/Attribute";
import { GameSortBy } from "../../../models/commons/Game/GameOptions/GameSortBy.model";
import { GameFilter } from "../../../models/commons/Game/GameOptions/GameFilter.model";

const ChallengeSummary: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const { attemptId } = useParams<{ attemptId: string }>();
  const { attempt, history, resetHistory, evaluationResults, setEvaluationResults, challengeCardDto } = useAttempt();
  const { setQuizList, setQuizHistory, setReviewList, setSessionOptions, setUncheckedNewSession } = useQuizSession();
  const { filters, modes, sorts } = useGlobalData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challHistory, setChallHistory] = useState<ChallengeHistoryEntry[]>([]);

  useEffect(() => {
    if (!attemptId || !attempt) return;

    const payload: ChallengeEvaluationRequestDto = { history };

    evaluateChallengeAttempt(attemptId, payload)
      .then((dto) => {
        console.log("ChallengeEvaluationDto", dto);
        setEvaluationResults(dto);
        console.log("history", history);
        setChallHistory(history);
        resetHistory();
      })
      .catch(() => setError("Impossible de récupérer la correction."))
      .finally(() => setLoading(false));
  }, [attemptId, attempt]);

  const handleStartTraining = () => {
    if (!evaluationResults || !attempt) return;

    // Convert summary entries into QuizEntryWithRepetition format
    // Convert summary entries into QuizEntryWithRepetition format with SpacedRepetitionData
    const reviewEntries: QuizEntryWithRepetition[] =
      evaluationResults.entries.map((e: CorrectionEntryDto) => {
        const questionDto: ChallengeQuestionDto = attempt.challengeEntries[e.questionNumber - 1];
        return {
          ...questionDto,
          repetitionData: {
            totalRepetitionCount: 1,
            correctRepetitionCount: e.isCorrect ? 1 : 0,
            easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
            interval: repetitionPatterns.optimal.initialInterval,
          },
        } as QuizEntryWithRepetition;
      });

        // Build QuizHistoryEntry list from ChallengeHistoryEntry
    const historyEntries: QuizHistoryEntry[] = challHistory.map((h) => {
      const questionDto = attempt.challengeEntries[h.questionNumber - 1];
      const seData = reviewEntries.find((rq) => rq.personId === h.personId)?.repetitionData;
      return {
        photoUrl: questionDto.photoUrl,
        personId: h.personId,
        initials: "Coming soon",
        isCorrect: evaluationResults.entries.find((e) => e.questionNumber === h.questionNumber)?.isCorrect || false,
        repetitionData: seData || {
          totalRepetitionCount: 1,
          correctRepetitionCount: evaluationResults.entries.find((e) => e.questionNumber === h.questionNumber)?.isCorrect ? 1 : 0,
          easinessFactor: repetitionPatterns.never.initialEasinessFactor,
          interval: repetitionPatterns.never.initialInterval,
        },
      };
    });

    // Update quiz session context
    setReviewList(reviewEntries);
    setUncheckedNewSession(true);
    setQuizList(reviewEntries);
    
    // Verification usuelle
    if(challengeCardDto === undefined || challengeCardDto === null) {
      setError("Challenge introuvable.");
      notifyError("Challenge introuvable.");
      return;
    }
    // Trouver le mode de jeu correspondant au challenge terminé: 
    const mode: GameMode | undefined = modes.find(
      (m) => m.id === challengeCardDto.challenge.gameMode.id
    );
    if (!mode) {
      setError("Mode de jeu du challenge introuvable.");
      notifyError("Mode de jeu du challenge introuvable.");
      return;
    }

    // Trouver le filtre correspondant au challenge terminé:
    const filterAttribute: Attribute | undefined = filters.find(
      (f) => f.id === challengeCardDto.challenge.filter.attributeId
    );
    if (!filterAttribute) {
      setError("Filtre du challenge introuvable.");
      notifyError("Filtre du challenge introuvable.");
      return;
    }
    const gameFilter: GameFilter = { id: 0, attribute: filterAttribute, minValue: challengeCardDto.challenge.filter.minValue, maxValue: challengeCardDto.challenge.filter.maxValue };

    setSessionOptions({
      mode: mode,
      filters: [gameFilter],
      sorts: [],
      repetitionPattern: repetitionPatterns.optimal,
      helps: { typoFriendly: true },
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

  const results = evaluationResults.entries.map((e: CorrectionEntryDto) => {
    const questionDto = attempt.challengeEntries[e.questionNumber - 1];
    const userEntry = challHistory.find(
      (h) => h.questionNumber === e.questionNumber
    );

    return {
      questionNumber: e.questionNumber,
      photoUrl: questionDto.photoUrl,
      userAnswer: userEntry?.answer || "—",
      correctAnswer: e.correctAnswer || "—",
      isCorrect: e.isCorrect,
    };
  });

  return (
    <Box sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h4" sx={{ mb: 2, color }}>
        Récapitulatif du Challenge
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Score : {evaluationResults.totalCorrect} / {attempt.challengeEntries.length}
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
              <TableCell sx={{ backgroundColor: "background.paper" }}>#</TableCell>
              <TableCell sx={{ backgroundColor: "background.paper" }}>Question</TableCell>
              <TableCell sx={{ backgroundColor: "background.paper" }}>Votre réponse</TableCell>
              <TableCell sx={{ backgroundColor: "background.paper" }}>Bonne réponse</TableCell>
              <TableCell sx={{ backgroundColor: "background.paper" }}>Résultat</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.questionNumber}>
                <TableCell>{r.questionNumber}</TableCell>
                <TableCell>
                  <Avatar
                    src={`/photos/${r.photoUrl}`}
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
        <Button variant="contained" onClick={() => navigate("/", { replace: true })}>
          Retour au menu
        </Button>
      </Box>
    </Box>
  );
};

export default ChallengeSummary;
