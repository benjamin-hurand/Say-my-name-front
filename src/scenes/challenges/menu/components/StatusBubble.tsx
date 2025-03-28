import React from 'react';
import { Box, Typography } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Challenge {
  id: number;
  title: string;
  mode: string;
  participants: number;
  status: string;
  period: string;
  numQuestions: number;
  details: string;
  userCompleted: boolean;
  userScore: number | null;
  userTimeScore: string | null;
  // createdAt peut être ajouté si nécessaire
}

const StatusBubble: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const bubbleSize = 50;
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

  if (challenge.status === 'En attente') {
    // Fond transparent, bordure grise et icône sablier grisée
    style = { ...style, backgroundColor: 'transparent', border: '2px solid gray' };
    content = (
      <HourglassEmptyIcon 
        sx={{ color: 'gray', fontSize: 24, '& path': { strokeWidth: 2 } }} 
      />
    );
  } else if (challenge.status === 'Validé' && !challenge.userCompleted) {
    // Fond transparent, bordure blanche et icône flèche blanche
    style = { ...style, backgroundColor: 'transparent', border: '2px solid white' };
    content = (
      <ArrowForwardIcon 
        sx={{ color: 'white', fontSize: 24, '& path': { strokeWidth: 2 } }} 
      />
    );
  } else if (
    challenge.status === 'Validé' &&
    challenge.userCompleted &&
    challenge.userScore !== null &&
    challenge.userScore < 100
  ) {
    // Style "camembert" : remplissage en gris semi-transparent selon le pourcentage
    const angle = (challenge.userScore / 100) * 360;
    style = { 
      ...style, 
      background: `conic-gradient(rgba(110, 110, 110, 0.8) 0deg ${angle}deg, transparent ${angle}deg 360deg)`, 
      border: '2px solid rgba(110, 110, 110, 0.8)',
    };
    content = (
      <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
        {`${challenge.userScore}%`}
      </Typography>
    );
  } else if (
    challenge.status === 'Validé' &&
    challenge.userCompleted &&
    challenge.userScore === 100
  ) {
    // Challenge réussi avec chrono : fond blanc, bordure noire, texte en gras
    style = { ...style, backgroundColor: '#fff', border: '2px solid black' };
    content = (
      <Typography sx={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
        {challenge.userTimeScore}
      </Typography>
    );
    // Marqueur de réussite : petit check en surimpression
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
        <CheckCircleIcon 
          sx={{ color: 'black', fontSize: 20, '& path': { strokeWidth: 2 } }} 
        />
      </Box>
    );
  }

  return (
    <Box sx={style}>
      {content}
      {extraOverlay}
    </Box>
  );
};

export default StatusBubble;
