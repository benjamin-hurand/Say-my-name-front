import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { ChallengeCardDto } from '../../../../services/dto/ChallengeCardDto';
import { useGlobalData } from '../../../../contexts/GlobalDataContext';

// Fonction utilitaire pour formater un temps en millisecondes en "mm:ss"
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const StatusBubble: React.FC<{ challenge: ChallengeCardDto }> = ({ challenge }) => {
  const { seasonPeriod } = useGlobalData();
  const bubbleSize: number = 50;
  const creation: Date = new Date(challenge.challenge.creationDate);
  let content = null;
  let extraOverlay = null;
  let style: any = {
    width: bubbleSize,
    height: bubbleSize,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as 'relative',
  };


  // 0) En attente : création après le début de saison
  if (seasonPeriod && creation > seasonPeriod.start) {
    content = (
      <HourglassEmptyIcon
        sx={{ color: 'white', fontSize: 24, '& path': { strokeWidth: 2 } }}
      />
    );
    style = { ...style, backgroundColor: 'rgba(255,255,255,0.2)', border: '2px dashed gray' };
  }
  else {
    const attempt = challenge.attempt;
    const version = challenge.version;

    // Si l'utilisateur n'a jamais tenté le challenge
    if (attempt.bestQuestionScore === null) {
      style = { ...style, backgroundColor: 'transparent', border: '2px solid gray' };
      content = (
        <ArrowForwardIcon 
          sx={{ color: 'white', fontSize: 24, '& path': { strokeWidth: 2 } }} 
        />
      );
    } 
    // Si l'utilisateur a tenté le challenge mais sans score parfait
    else if (attempt.bestQuestionScore < version.questionCount) {
      const percentage = Math.round((attempt.bestQuestionScore / version.questionCount) * 100);
      const angle = (percentage / 100) * 360;
      style = { 
        ...style, 
        background: `conic-gradient(rgba(110,110,110,0.8) 0deg ${angle}deg, transparent ${angle}deg 360deg)`, 
        border: '2px solid rgba(110,110,110,0.8)',
      };
      content = (
        <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          {`${percentage}%`}
        </Typography>
      );
    } 
    // Si l'utilisateur a réussi le challenge (score parfait)
    else if (attempt.bestQuestionScore === version.questionCount) {
      style = { ...style, backgroundColor: '#fff', border: '2px solid black' };
      content = (
        <Typography sx={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
          {formatTime(attempt.bestTimeMs)}
        </Typography>
      );
      extraOverlay = (
        <Box
          sx={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#fff',
            border: '2px solid black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircleIcon sx={{ color: 'black', fontSize: 20 }} />
        </Box>
      );
    }
  }

  return (
    <Box sx={style}>
      {content}
      {extraOverlay}
    </Box>
  );
};

export default StatusBubble;
