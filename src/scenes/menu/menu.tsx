import React from 'react';
import { Button, Stack, Box } from '@mui/material';
import SvgLogo from './components/svg/logoSvg';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';

const Menu: React.FC = () => {
    const { color } = useThemeColorContext();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const svgStyle = {
        filter: `drop-shadow(0 0 8px ${color})`, // Neon effect for the SVG
        transition: 'filter 0.5s ease-in-out', // Smooth transition for the filter effect
        width: 'auto',
        height: '33vh' // Sets height relative to the viewport height
    };

    return (
        <div style={{
            width: '100%',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column', // Stack children vertically
            overflow: 'clip',
        }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: '33vh', // Minimum height to ensure the logo is visible
                padding: '3vh'
            }}>
                <SvgLogo color={color} style={svgStyle} />
            </Box>
            <Stack
                spacing={2}
                direction="column"
                sx={{
                    flexGrow: 1, // Make the Stack take all available space
                    padding: '3vh', // Optional padding
                    boxSizing: 'border-box', // Include padding in height calculation
                }}
            >
                <Button onClick={() => navigate('/quiz')} variant='outlined' className='menu'>{t('TRAINING')}</Button>
                <Button onClick={() => navigate('/challenges')} variant='outlined' className='menu'>{t('RANKED')}</Button>
                <Button onClick={() => navigate('/profile')} variant='outlined' className='menu'>{t('PROFILE')}</Button>
                <Button onClick={() => navigate('/settings')} variant='outlined' className='menu'>{t('SETTINGS')}</Button>
            </Stack>
        </div>
    );
};

export default Menu;
