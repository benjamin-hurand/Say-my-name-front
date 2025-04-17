// src/scenes/challenges/summary/ChallengeSummary.tsx
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
import { useAttempt } from "../../../contexts/ChallengeAttemptContext";
import { useThemeColorContext } from "../../../contexts/ThemeColorContext";
import { evaluateChallengeAttempt } from "../../../services/business/challenges/challenge.service";
import {
  ChallengeEvaluationDto,
  ChallengeEvaluationRequestDto,
  CorrectionEntryDto,
} from "../../../services/dto/ChallengeAttemptDto";

const ChallengeSummary: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const { attemptId } = useParams<{ attemptId: string }>();
  const { attempt, history, resetHistory } = useAttempt();

  const [data, setData] = useState<ChallengeEvaluationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nouveau : on capture la history ici avant de la vider
  const [userHistory, setUserHistory] = useState<typeof history>([]);

  useEffect(() => {
    if (!attemptId || !attempt) return;

    const payload: ChallengeEvaluationRequestDto = { history };

    evaluateChallengeAttempt(attemptId, payload)
      .then((dto) => {
        setData(dto);
        setUserHistory(history);  // on copie la history actuelle
        resetHistory();          // puis on la vide pour la prochaine session
      })
      .catch(() => setError("Impossible de récupérer la correction."))
      .finally(() => setLoading(false));
  }, [attemptId, attempt]);

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

  if (!data || !attempt) return null;

  // Fusion front/back : on utilise maintenant `userHistory`
  const results = data.entries.map((e: CorrectionEntryDto) => {
    const questionDto = attempt.challengeEntries[e.questionNumber - 1];
    const userEntry = userHistory.find(
      (h) => h.questionNumber === e.questionNumber
    );

    return {
      questionNumber: e.questionNumber,
      photoUrl: questionDto.photoUrl,
      userAnswer: userEntry?.answer || "—",
      correctAnswer: e.correctAnswer || "—",
      isCorrect: e.correct,
    };
  });

  return (
    <Box sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h4" sx={{ mb: 2, color }}>
        Récapitulatif du Challenge
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Score : {data.totalCorrect} / {attempt.challengeEntries.length}
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
        <Button
          variant="outlined"
          onClick={() => navigate(`/challenges/${attempt.id}`, { replace: true })}
        >
          Revoir le quiz
        </Button>
        <Button variant="contained" onClick={() => navigate("/", { replace: true })}>
          Retour au menu
        </Button>
      </Box>
    </Box>
  );
};

export default ChallengeSummary;
