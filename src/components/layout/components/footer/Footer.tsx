import React, { useState } from 'react';
import { IconButton, Stack, Menu, MenuItem } from "@mui/material";
import { Settings, Brightness7, Brightness4, Language, Logout, Home } from "@mui/icons-material";
import { useThemeColorContext } from "../../../../contexts/ThemeColorContext";
import { notifySuccess } from "../../../../services/notification/toast.service";
import { googleLogout } from "@react-oauth/google";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export const Footer = ({ isMenu }: { isMenu: boolean }) => {
	const { color, randomizeColor, toggleTheme, theme: currentTheme } = useThemeColorContext();
	const { i18n } = useTranslation();
	const navigate: NavigateFunction = useNavigate();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleMouseEnter = () => randomizeColor();

	const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleLanguageChange = (newLang: string) => {
		i18n.changeLanguage(newLang).then(() => {
			console.log("New language set to:", newLang);
			setAnchorEl(null);
		});
	};

	const handleHomeClick = () => {
        navigate('/', { replace: true });
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
		<div className="footer" style={{height: '12vh'}}>
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '300px', padding: '10px' }}>
					<IconButton className="menu" style={iconButtonStyle} aria-label="settings" onMouseEnter={handleMouseEnter}>
						<Settings style={{ color }} />
					</IconButton>
					<IconButton className="menu" style={iconButtonStyle} aria-label="toggle dark/light mode" onClick={toggleTheme} onMouseEnter={handleMouseEnter}>
						{currentTheme === 'dark' ? <Brightness7 style={{ color }} /> : <Brightness4 style={{ color }} />}
					</IconButton>
					<IconButton
						className="menu" style={iconButtonStyle}
						aria-label="change language"
						onMouseEnter={handleMouseEnter}
						onClick={handleLanguageMenu}
					>
						<Language style={{ color }} />
					</IconButton>
					<Menu
						id="language-menu"
						anchorEl={anchorEl}
						open={Boolean(anchorEl)}
						onClose={() => setAnchorEl(null)}
						anchorOrigin={{
							vertical: 'center', // Align the top of the menu with the bottom of the button
							horizontal: 'center', // Align the right of the menu with the right of the button
						}}
						transformOrigin={{
							vertical: 'center', // Menu grows downward
							horizontal: 'center', // Menu grows rightward
						}}
						>

						<MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
						<MenuItem onClick={() => handleLanguageChange('fr')}>Français</MenuItem>
						<MenuItem onClick={() => handleLanguageChange('es')}>Español</MenuItem>
						{/* Add more languages as needed */}
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
		</div>
	);
};
