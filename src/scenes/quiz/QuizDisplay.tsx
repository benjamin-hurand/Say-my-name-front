// QuizDisplay.tsx

import React from 'react';
import { Button, Box, TextField, Typography, IconButton, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export interface QuizDisplayProps {
  color: string;
  photoUrl: string | null;
  initials: string | null;
  showInitials: boolean;          // <-- new prop to control display
  answer: string;
  handleAnswerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateAnswer: () => void;
  toggleOptions: () => void;
  goBackToMenu: () => void;
  isLoading: boolean;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  color,
  photoUrl,
  initials,
  showInitials,
  answer,
  handleAnswerChange,
  validateAnswer,
  toggleOptions,
  goBackToMenu,
  isLoading
}) => {
  return (
    <div className="quiz" style={{ padding: '20px', width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '1vh',
          }}
        >
          <IconButton
            onClick={goBackToMenu}
            sx={{
              color: color,
              boxShadow: `0 0 8px ${color}`,
              transition: 'box-shadow 0.2s ease-in-out',
              backdropFilter: 'blur(6px)',
            }}
            aria-label="Back to menu"
          >
            <ArrowBackIcon style={{ color }} />
          </IconButton>
          <Typography variant="h4" style={{ color: color, textShadow: `0 0 8px ${color}` }}>
            Hello Quiz
          </Typography>
        </Box>

        {/* Photo or skeleton */}
        {isLoading ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={300}
            animation="wave"
            style={{ backdropFilter: 'blur(3px)', backgroundColor: color + '10' }}
          />
        ) : photoUrl ? (
          <img
            src={`photos/${photoUrl}`}
            alt="Quiz"
            style={{
              width: 'auto',
              height: '56vh',
              zIndex: 1,
              boxShadow: `0 0 20px ${color}`,
            }}
          />
        ) : (
          // Outer container that preserves the overall "photo" space
          <Box
            sx={{
              height: '56vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Inner box wrapping only the text with a semi-transparent background and border */}
            <Box
              sx={{
                backgroundColor: 'rgba(128, 128, 128, 0.5)',
                border: '1px solid rgba(128, 128, 128, 0.7)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <Typography variant="h6" color="error">
                Aucun résultat trouvé.
              </Typography>
            </Box>
          </Box>
        )}


        <TextField
          variant="outlined"
          placeholder="Type your answer here..."
          label={showInitials && initials ? `Initials: ${initials}` : ''}
          value={answer}
          onChange={handleAnswerChange}
          InputLabelProps={{ shrink: true }}
          sx={{ margin: '20px 0', width: '100%' }}
        />


        {/* Buttons row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '7vh' }}>
          <Button variant="outlined" className="menu nobg" onClick={toggleOptions} sx={{ marginRight: '1vw' }}>
            Options
          </Button>
          <Button variant="contained" className="menu" onClick={validateAnswer}>
            Submit Answer
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default QuizDisplay;
