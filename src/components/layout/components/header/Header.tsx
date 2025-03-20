import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface HeaderProps {
  color: string;
  title: string;
  handleHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ color, title, handleHomeClick }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        zIndex: 1000,
      }}
    >
      <IconButton
        onClick={handleHomeClick}
        sx={{
          color: color,
          boxShadow: `0 0 8px ${color}`,
          transition: 'box-shadow 0.2s ease-in-out',
          backdropFilter: 'blur(6px)',
        }}
        aria-label="Back"
      >
        <ArrowBackIcon style={{ color }} />
      </IconButton>
      <Typography variant="h4" sx={{ color: color, textShadow: `0 0 8px ${color}` }}>
        {title}
      </Typography>
      <Box sx={{ width: '40px' }} /> {/* Espace pour équilibrer le layout */}
    </Box>
  );
};

export default Header;
