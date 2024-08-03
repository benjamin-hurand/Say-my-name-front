import React, { useState, MouseEvent } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

interface I18nIconProps {
  color: string; // This allows the color to be dynamic based on the parent component
  classNames: string;
}

const I18nIcon: React.FC<I18nIconProps> = ({ color, classNames }) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLanguageMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang).then(() => {
      console.log("New language set to:", newLang);
      console.log("Couleur: " + color);
      setAnchorEl(null);
    });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const iconButtonStyle = {
    color: color,
    boxShadow: `0 0 8px ${color}`,
    transition: 'box-shadow 0.2s ease-in-out',
  };

  return (
    <>
      <IconButton
        style={iconButtonStyle}
        aria-label="change language"
        onClick={handleLanguageMenu}
        className={classNames}
      >
        <LanguageIcon className={classNames}/>
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
        <MenuItem onClick={() => handleLanguageChange('fr')}>Français</MenuItem>
        <MenuItem onClick={() => handleLanguageChange('es')}>Español</MenuItem>
        {/* Add more languages as needed */}
      </Menu>
    </>
  );
};

export default I18nIcon;
