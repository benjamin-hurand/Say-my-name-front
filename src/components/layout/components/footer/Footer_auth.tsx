import { IconButton, Menu, MenuItem, Stack } from "@mui/material";
import { Brightness7, Brightness4, Language } from "@mui/icons-material";
import { useThemeContext } from "../../../../ThemeContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const FooterAuth = () => {
	const { toggleTheme, theme: currentTheme } = useThemeContext();
	const { i18n } = useTranslation();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleLanguageChange = (newLang: string) => {
		i18n.changeLanguage(newLang).then(() => {
			console.log("New language set to:", newLang);
			setAnchorEl(null);
		});
	};


	return (
		<div className="footer">
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}> {/* Adjust the height as necessary */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '300px', padding: '10px' }}>
                <IconButton sx={{ boxShadow: `0 0 8px`, transition: 'box-shadow 0.2s ease-in-out',}} aria-label="toggle dark/light mode" onClick={toggleTheme} >
                    {currentTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
                <IconButton
						aria-label="change language"
						onClick={handleLanguageMenu}
                        sx={{ boxShadow: `0 0 8px`, transition: 'box-shadow 0.2s ease-in-out',}}
					>
						<Language />
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
            </Stack>
        </div>
		</div>
	);
};
