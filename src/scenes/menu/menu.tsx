import React from 'react';
import { Button, Stack, Box } from '@mui/material';
import SvgLogo from './components/svg/logoSvg';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeColorContext } from '../../contexts/ThemeColorContext'

const Menu: React.FC = () => {
    const { color } = useThemeColorContext();
	const navigate: NavigateFunction = useNavigate();
    const { t } = useTranslation();

    const svgStyle = {
        filter: `drop-shadow(0 0 8px ${color})`, // Neon effect for the SVG
        transition: 'filter 0.5s ease-in-out', // Smooth transition for the filter effect
    };

    return (
        <div style={{ width: '100%', overflow: '' }}>
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
                    onClick={() => navigate('/quiz', { replace: false })}
                    className='menu' variant='outlined'
                >
                    {t('TRAINING')}
                </Button>
                <Button
                    onClick={() => navigate('/quiz', { replace: false })}
                    className='menu' variant='outlined'
                >
                    {t('RANKED')}
                </Button>
                <Button
                    onClick={() => navigate('/profile', { replace: false })}
                    className='menu' variant='outlined'
                >
                    {t('PROFILE')}
                </Button>
                <Button
                    onClick={() => navigate('/profile', { replace: true })}
                    className='menu' variant='outlined'
                >
                    {t('SETTINGS')}
                </Button>
            </Stack>
        </div>
    );
};

export default Menu;
