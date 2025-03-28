import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import "../../layout.css";

interface HeaderProps {
  color: string;
  title: string;
  onBack?: string;
}

const Header: React.FC<HeaderProps> = ({ color, title, onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      navigate(onBack, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <Box className="header" sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton onClick={handleBack} aria-label="Back">
        <ArrowBackIcon style={{ color }} />
      </IconButton>
      <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
        <Typography variant="h4" sx={{ color, textShadow: `0 0 8px ${color}` }}>
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

export default Header;
