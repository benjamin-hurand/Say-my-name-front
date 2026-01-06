import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { getPreviousRoute } from '../../hooks/usePreviousRoute';
import './header.css'; // <-- s'assure d'importer le CSS (ajouts ci-dessous)

interface HeaderProps {
  color: string;
  title: string;
  tooltip?: string;
  onBack?: string; // fallback forcé optionnel
  /** NEW: variante d’affichage. Par défaut = "default" (sans background) */
  variant?: 'default' | 'glass';
  /** Optionnel: classe supplémentaire si besoin */
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ color, title, tooltip, onBack, variant = 'default', className }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const navType = useNavigationType();

  const onBackState = typeof state?.onBack === "string" ? state.onBack : undefined;

  const sameOriginReferrer = (() => {
    try {
      const ref = document.referrer;
      if (!ref) return null;
      const url = new URL(ref);
      return url.origin === window.location.origin ? (url.pathname + url.search + url.hash) : null;
    } catch {
      return null;
    }
  })();

  const handleBack = () => {
    const idx = (window.history.state && (window.history.state as any).idx) ?? 0;
    if (idx > 0 && navType !== "REPLACE") {
      navigate(-1);
      return;
    }
    const prevFromState = onBackState;
    const prevFromStorage = getPreviousRoute();
    const prevFromReferrer = sameOriginReferrer;

    const target =
      onBack ||
      prevFromState ||
      prevFromStorage ||
      prevFromReferrer ||
      "/";

    navigate(target, { replace: true });
  };

  return (
    <Box
      className={[
        'header',
        variant === 'glass' ? 'header--glass' : '',
        className || ''
      ].join(' ')}
      sx={{ display: 'flex', alignItems: 'center' }}
    >
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
