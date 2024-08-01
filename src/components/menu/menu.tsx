import { useState } from 'react';
import { Button, IconButton, Stack, Box } from '@mui/material';
import { Settings, Language, Logout , Brightness4, Brightness7} from '@mui/icons-material';
import SvgLogo from './components/svg/logoSvg';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { neonColors } from '../../models/commons/NeonColors';
import { useNavigate } from 'react-router-dom';
import { notifySuccess } from '../../services/notification/toast.service';
import { googleLogout } from '@react-oauth/google';
import { useThemeContext } from '../../ThemeContext';

const Menu = () => {
    // const theme = useTheme();
    const { toggleTheme, theme: currentTheme } = useThemeContext();
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
        googleLogout();
        navigate('/signin', { replace: true });
    }

    const iconButtonStyle = {
        color: color,
        boxShadow: `0 0 8px ${color}`,  // Apply neon glow only
        transition: 'box-shadow 0.2s ease-in-out', // Transition only for neon glow
    };

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
        color: "#242424", // oppositeColors[color], // Set text color to the opposite color
        boxShadow: `0 0 30px ${color}`, // Increased shadow on hover
        transition: 'background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out, color 0.5s ease-in-out', // Smooth transition for background-color, box-shadow, and text color
    };

    return (
        <div style={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center'}}>
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
                    className="menu"
                >
                    TRAINING
                </Button>
                <Button
                    variant={hoveredButton === 'RANKED' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'RANKED' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('RANKED')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="menu"
                >
                    RANKED
                </Button>
                <Button
                    variant={hoveredButton === 'PROFILE' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'PROFILE' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('PROFILE')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="menu"
                >
                    PROFILE
                </Button>
                <Button
                    variant={hoveredButton === 'SETTINGS' ? 'contained' : 'outlined'}
                    style={hoveredButton === 'SETTINGS' ? hoveredButtonStyle : buttonStyle}
                    onMouseEnter={() => setHoveredButton('SETTINGS')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="menu"
                >
                    SETTINGS
                </Button>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '300px', padding: '10px' }}>
                    <IconButton style={iconButtonStyle} className='menu' aria-label="settings" onMouseEnter={handleMouseEnter}>
                        <Settings className='menu' style={{ color }} />
                    </IconButton>
                    <IconButton style={iconButtonStyle} className='menu' aria-label="toggle dark/light mode" onClick={toggleTheme} onMouseEnter={handleMouseEnter}>
                        {currentTheme === 'dark' ? <Brightness7 className='menu' style={{ color }} /> : <Brightness4 className='menu' style={{ color }} />}
                    </IconButton>
                    <IconButton style={iconButtonStyle} className='menu' aria-label="change language" onMouseEnter={handleMouseEnter}>
                        <Language className='menu' style={{ color }} />
                    </IconButton>
                    <IconButton style={iconButtonStyle} className='menu' aria-label="logout" onClick={handleLogout} onMouseEnter={handleMouseEnter}>
                        <Logout className='menu' style={{ color }} />
                    </IconButton>
                </Stack>
            </Stack>
        </div>
    );
};

export default Menu;
