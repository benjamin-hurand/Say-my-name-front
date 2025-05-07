import React from 'react';
import { Button, Box, TextField, Typography, Skeleton, LinearProgress } from '@mui/material';

export interface QuizDisplayProps {
  color: string;
  photoUrl: string | null;
  initials: string | null;
  showInitials: boolean;
  answer: string;
  handleAnswerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateAnswer: () => void;
  openQuizOptions?: () => void;
  goBackToMenu: () => void;
  isLoading: boolean;
  hasFetched: boolean;

  // Nouveautés pour le cas "aucun résultat"
  onRetry?: () => void;
  onCreateChallenge?: () => void;
  hasHistory?: boolean;

  // Chrono et progression
  elapsed?: number;        // en secondes
  progress?: number;       // 0 à 100
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  color,
  photoUrl,
  initials,
  showInitials,
  answer,
  handleAnswerChange,
  validateAnswer,
  openQuizOptions,
  goBackToMenu,
  isLoading,
  hasFetched,
  onRetry,
  onCreateChallenge,
  hasHistory = false,
  elapsed,
  progress,
}) => {
  const assetBase = import.meta.env.BASE_URL || '/';

  return (
    <Box sx={{ position: 'relative', padding: '20px', width: '100%', height: '100%' }}>
      {/* Barre de progression discrète en haut */}
      {typeof progress === 'number' && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 4,
            zIndex: 10,
            '& .MuiLinearProgress-bar': { backgroundColor: color },
          }}
        />
      )}

      {/* Chrono en direct */}
      {typeof elapsed === 'number' && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 8,
            right: 16,
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.4)',
            px: 1,
            borderRadius: 1,
            zIndex: 10,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* IMAGE / SQUELETTE / MESSAGE "Aucun résultat trouvé" */}
        {(isLoading || !hasFetched) ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={300}
            animation="wave"
            sx={{ backdropFilter: 'blur(3px)', backgroundColor: color + '10' }}
          />
        ) : photoUrl ? (
          <Box
            component="img"
            src={`${assetBase}photos/${photoUrl}`}
            alt="Quiz"
            sx={{
              maxWidth: '100%',
              height: '56vh',
              zIndex: 1,
              boxShadow: `0 0 20px ${color}`,
            }}
          />
        ) : (
          <Box
            sx={{
              height: '56vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              {hasHistory
                ? 'Bravo, vous avez fini le quiz.'
                : 'Aucun résultat trouvé.'}
            </Typography>

            {/* BLOC DE BOUTONS UX/UI POUR AUCUN RÉSULTAT */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {hasHistory && onRetry && (
                <Button variant="outlined" onClick={onRetry}>
                  Recommencer le quiz
                </Button>
              )}
              {openQuizOptions && (
                <Button variant="outlined" onClick={openQuizOptions}>
                  Modifier les options
                </Button>
              )}
              {onCreateChallenge && (
                <Button variant="contained" onClick={onCreateChallenge}>
                  Créer un challenge
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* CHAMPS DE SAISIE */}
        <TextField
          variant="outlined"
          placeholder="Tapez votre réponse ici…"
          label={showInitials && initials ? `Initiales : ${initials}` : ''}
          value={answer}
          onChange={handleAnswerChange}
          InputLabelProps={{ shrink: true }}
          sx={{ margin: '20px 0', width: '100%' }}
        />

        {/* BOUTONS EN BAS */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: openQuizOptions ? 'space-between' : 'flex-end',
            width: '100%',
            height: '7vh',
          }}
        >
          {openQuizOptions && (
            <Button
              variant="outlined"
              className="menu nobg"
              onClick={openQuizOptions}
              sx={{ marginRight: '1vw' }}
            >
              Options
            </Button>
          )}
          <Button variant="contained" className="menu" onClick={validateAnswer}>
            Submit Answer
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default QuizDisplay;
