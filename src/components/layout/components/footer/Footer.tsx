// Footer.tsx
import React, { useState } from 'react';
import { Stack, IconButton, Menu, MenuItem } from "@mui/material";
import { Settings, Brightness7, Brightness4, Language, Logout, Home } from "@mui/icons-material";
import { useThemeColorContext } from "../../../../contexts/ThemeColorContext";
import { notifySuccess } from "../../../../services/notification/toast.service";
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "../../layout.css"; // Import du CSS

interface FooterProps {
  isMenu?: boolean;
  handleHomeClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ isMenu, handleHomeClick }) => {
  const { color, randomizeColor, toggleTheme, theme: currentTheme } = useThemeColorContext();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMouseEnter = () => randomizeColor();

  const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang).then(() => {
      setAnchorEl(null);
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    notifySuccess('Successfully disconnected.');
    googleLogout();
    navigate('/signin', { replace: true });
  };

  const iconButtonStyle = {
    color: color,
    boxShadow: `0 0 8px ${color}`,
    transition: 'box-shadow 0.2s ease-in-out',
    backdropFilter: 'blur(6px)',
    backgroundColor: currentTheme === 'dark' ? '#24242450' : '#ffffff50',
  };

  return (
    <div className="footer">
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '400px', padding: '5px' }}>
        <IconButton className="menu" style={iconButtonStyle} aria-label="settings" onMouseEnter={handleMouseEnter}>
          <Settings style={{ color }} />
        </IconButton>
        <IconButton className="menu" style={iconButtonStyle} aria-label="toggle dark/light mode" onClick={toggleTheme} onMouseEnter={handleMouseEnter}>
          {currentTheme === 'dark' ? <Brightness7 style={{ color }} /> : <Brightness4 style={{ color }} />}
        </IconButton>
        <IconButton className="menu" style={iconButtonStyle} aria-label="change language" onMouseEnter={handleMouseEnter} onClick={handleLanguageMenu}>
          <Language style={{ color }} />
        </IconButton>
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
          transformOrigin={{ vertical: 'center', horizontal: 'center' }}
        >
          <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
          <MenuItem onClick={() => handleLanguageChange('fr')}>Français</MenuItem>
          <MenuItem onClick={() => handleLanguageChange('es')}>Español</MenuItem>
        </Menu>
        {isMenu ? (
          <IconButton className="menu" style={iconButtonStyle} aria-label="logout" onClick={handleLogout} onMouseEnter={handleMouseEnter}>
            <Logout style={{ color }} />
          </IconButton>
        ) : (
          <IconButton className="menu" style={iconButtonStyle} aria-label="home" onClick={handleHomeClick} onMouseEnter={handleMouseEnter}>
            <Home style={{ color }} />
          </IconButton>
        )}
      </Stack>
    </div>
  );
};

export default Footer;
