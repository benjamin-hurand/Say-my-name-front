// Footer.tsx
import React, { useState } from 'react';
import { Stack, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { Settings, Brightness7, Brightness4, Language, Logout, Home, Business } from "@mui/icons-material";
import { useThemeColorContext } from "../../../../contexts/ThemeColorContext";
import { notifySuccess } from "../../../../services/notification/toast.service";
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "../../layout.css"; // Import du CSS
import { useAuth } from '../../../../contexts/AuthContext';

interface FooterProps {
  isMenu?: boolean;
  handleHomeClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ isMenu, handleHomeClick }) => {
  const {
    color,
    randomizeColor,
    toggleTheme,
    theme: currentTheme,
    accentMode,
  } = useThemeColorContext();

  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const { organizations, activeOrganization, switchOrganization } = useAuth();
  const [orgAnchorEl, setOrgAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenOrgMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (organizations.length > 1) {
      setOrgAnchorEl(event.currentTarget);
    }
  };

  const handleCloseOrgMenu = () => setOrgAnchorEl(null);

  const handleSwitchOrg = (orgId: number) => {
    switchOrganization(orgId);
    handleCloseOrgMenu();
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMouseEnter = () => {
    // Randomize only if user selected "random-hover"
    if (accentMode === 'random-hover') randomizeColor();
  };

  const handleOpenLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang).then(() => setAnchorEl(null));
  };

  const handleLogout = () => {
    localStorage.clear();
    notifySuccess('Successfully disconnected.');
    googleLogout();
    navigate('/signin', { replace: true });
  };

  const handleGoSettings = () => {
    navigate('/settings');
  };

  const iconButtonStyle = {
    color: color,
    boxShadow: `0 0 8px ${color}`,
    transition: 'box-shadow 0.2s ease-in-out',
    backdropFilter: 'blur(6px)',
    backgroundColor: currentTheme === 'dark' ? '#24242450' : '#ffffff50',
  } as const;

  return (
    <div className="footer">
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '400px', padding: '5px' }}>
        <Tooltip
          title={
            activeOrganization
              ? `Organization: ${activeOrganization.organizationName}`
              : "No organization"
          }
          arrow
        >
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="organization"
            onClick={handleOpenOrgMenu}
            onMouseEnter={handleMouseEnter}
          >
            <Business style={{ color }} />
          </IconButton>
        </Tooltip>

        <Menu
          id="org-menu"
          anchorEl={orgAnchorEl}
          open={Boolean(orgAnchorEl)}
          onClose={handleCloseOrgMenu}
          anchorOrigin={{ vertical: "center", horizontal: "center" }}
          transformOrigin={{ vertical: "center", horizontal: "center" }}
        >
          {organizations.map((org) => (
            <MenuItem
              key={org.organizationId}
              selected={org.organizationId === activeOrganization?.organizationId}
              onClick={() => handleSwitchOrg(org.organizationId)}
            >
              {org.organizationName} ({org.role})
            </MenuItem>
          ))}
        </Menu>
        <Tooltip title="Settings" arrow>
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="settings"
            onMouseEnter={handleMouseEnter}
            onClick={handleGoSettings}
          >
            <Settings style={{ color }} />
          </IconButton>
        </Tooltip>

        <Tooltip title={currentTheme === 'dark' ? 'Light mode' : 'Dark mode'} arrow>
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="toggle dark/light mode"
            onClick={toggleTheme}
            onMouseEnter={handleMouseEnter}
          >
            {currentTheme === 'dark' ? <Brightness7 style={{ color }} /> : <Brightness4 style={{ color }} />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Language" arrow>
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="change language"
            onMouseEnter={handleMouseEnter}
            onClick={handleOpenLanguageMenu}
          >
            <Language style={{ color }} />
          </IconButton>
        </Tooltip>

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
          <Tooltip title="Logout" arrow>
            <IconButton
              className="menu"
              style={iconButtonStyle}
              aria-label="logout"
              onClick={handleLogout}
              onMouseEnter={handleMouseEnter}
            >
              <Logout style={{ color }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Home" arrow>
            <IconButton
              className="menu"
              style={iconButtonStyle}
              aria-label="home"
              onClick={handleHomeClick}
              onMouseEnter={handleMouseEnter}
            >
              <Home style={{ color }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </div>
  );
};

export default Footer;
