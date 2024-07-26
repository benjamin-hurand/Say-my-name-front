import { useState } from 'react';
import { Button, IconButton, Stack, Box } from '@mui/material';
import { Settings, Language, GitHub, LinkedIn, Logout } from '@mui/icons-material';
import SvgLogo from './components/svg/logoSvg';
import { neonColors, oppositeColors } from '../../models/commons/NeonColors';
import { useNavigate } from 'react-router-dom';
import { notifySuccess } from '../../services/notification/toast.service';

const Menu = () => {
    const [color, setColor] = useState<string>(neonColors[0]); // Start with a default neon color
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

    const navigate = useNavigate();

    const getRandomColor = () => {
        const index = Math.floor(Math.random() * neonColors.length);
        return neonColors[index];
    };

    const handleMouseEnter = () => {
        setColor(getRandomColor());
    };

    const handleLogout = () => {
        localStorage.clear();
        notifySuccess('Successfully disconnected.');
        navigate('/signin', { replace: true });
    }

    const iconStyle = {
        color: color,
        boxShadow: `0 0 8px ${color}`,  // Apply neon glow only
        transition: 'box-shadow 0.2s ease-in-out', // Transition only for neon glow
    };

    const svgStyle = {
        filter: `drop-shadow(0 0 8px ${color})`, // Neon effect for the SVG
        transition: 'filter 0.5s ease-in-out', // Smooth transition for the filter effect
    };

    const buttonStyle = {
        fontFamily: 'Titillium Web, sans-serif', // Apply the Titillium Web font
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
        color: oppositeColors[color], // Set text color to the opposite color
        boxShadow: `0 0 30px ${color}`, // Increased shadow on hover
        transition: 'background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out, color 0.5s ease-in-out', // Smooth transition for background-color, box-shadow, and text color
    };

    return (
        <div style={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: -6, mb: -9 }}>
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
                >
                    TRAINING
                </Button>
                <Button
                    variant={hoveredButton === 'RANKED' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'RANKED' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('RANKED')}
                    onMouseLeave={() => setHoveredButton(null)}
                >
                    RANKED
                </Button>
                <Button
                    variant={hoveredButton === 'PROFILE' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'PROFILE' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('PROFILE')}
                    onMouseLeave={() => setHoveredButton(null)}
                >
                    PROFILE
                </Button>
                <Button
                    variant={hoveredButton === 'SETTINGS' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'SETTINGS' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('SETTINGS')}
                    onMouseLeave={() => setHoveredButton(null)}
                >
                    SETTINGS
                </Button>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '300px', padding: '10px' }}>
                    <IconButton style={iconStyle} aria-label="github" onMouseEnter={handleMouseEnter}>
                        <GitHub />
                    </IconButton>
                    <IconButton style={iconStyle} aria-label="linkedin" onMouseEnter={handleMouseEnter}>
                        <LinkedIn />
                    </IconButton>
                    <IconButton style={iconStyle} aria-label="logout" onClick={handleLogout} onMouseEnter={handleMouseEnter}>
                        <Logout />
                    </IconButton>
                    <IconButton style={iconStyle} aria-label="settings" onMouseEnter={handleMouseEnter}>
                        <Settings />
                    </IconButton>
                    <IconButton style={iconStyle} aria-label="change language" onMouseEnter={handleMouseEnter}>
                        <Language />
                    </IconButton>
                </Stack>
            </Stack>
        </div>
    );
};

export default Menu;
