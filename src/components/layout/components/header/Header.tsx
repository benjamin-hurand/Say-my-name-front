// Header.tsx
import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate } from 'react-router-dom';
import "../../layout.css";

interface HeaderProps {
  color: string;
  title: string;
  tooltip?: string;
  onBack?: string;
}

const Header: React.FC<HeaderProps> = ({ color, title, tooltip, onBack }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const onBackState = typeof state?.onBack === "string"
    ? state.onBack
    : undefined;

  const handleBack = () => {
    if (onBackState) {
      navigate(onBackState, { replace: true });
    } else if (onBack) {
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
        {tooltip ? (
          <Tooltip title={tooltip} arrow>
            <span>
              <Typography variant="h4" sx={{ color, textShadow: `0 0 8px ${color}` }}>
                {title}
              </Typography>
            </span>
          </Tooltip>
        ) : (
          <Typography variant="h4" sx={{ color, textShadow: `0 0 8px ${color}` }}>
            {title}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Header;
