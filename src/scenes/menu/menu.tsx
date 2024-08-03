import React from 'react';
import { Button, Stack, Box } from '@mui/material';
import SvgLogo from './components/svg/logoSvg';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useColor } from '../../contexts/ColorContext';
import { useTranslation } from 'react-i18next';

const Menu: React.FC = () => {
    const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);
    const { color } = useColor();
	const navigate: NavigateFunction = useNavigate();
    const { t } = useTranslation();

    const svgStyle = {
        filter: `drop-shadow(0 0 8px ${color})`, // Neon effect for the SVG
        transition: 'filter 0.5s ease-in-out', // Smooth transition for the filter effect
    };

    const buttonStyle = {
        fontSize: '1.2rem', // Make the font size larger
        color: color,
        borderColor: color,
        maxWidth: '300px',
        width: '100%',
        boxShadow: `0 0 8px ${color}`,
        textShadow: `0 0 8px ${color}`,
        transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
    };

    const hoveredButtonStyle = {
        ...buttonStyle, // Inherit the regular button style
        backgroundColor: color,
        color: "#242424",
        boxShadow: `0 0 30px ${color}`, // Increased shadow on hover
        transition: 'background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out, color 0.5s ease-in-out', // Smooth transition for background-color, box-shadow, and text color
    };

    return (
        <div style={{ width: '100%', overflow: 'visible' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <SvgLogo color={color} style={svgStyle} />
            </Box>
            <Stack
                spacing={2}
                direction="column"
                alignItems="center"
                justifyContent="center"
            >   
                <Button
                    variant={hoveredButton === 'TRAINING' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'TRAINING' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('TRAINING')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => navigate('/quiz', { replace: false })}
                >
                    {t('TRAINING')}
                </Button>
                <Button
                    variant={hoveredButton === 'RANKED' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'RANKED' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('RANKED')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => navigate('/quiz', { replace: false })}
                >
                    {t('RANKED')}
                </Button>
                <Button
                    variant={hoveredButton === 'PROFILE' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'PROFILE' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('PROFILE')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => navigate('/profile', { replace: false })}
                >
                    {t('PROFILE')}
                </Button>
                <Button
                    variant={hoveredButton === 'SETTINGS' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'SETTINGS' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('SETTINGS')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => navigate('/profile', { replace: true })}
                >
                    {t('SETTINGS')}
                </Button>
            </Stack>
        </div>
    );
};

export default Menu;
