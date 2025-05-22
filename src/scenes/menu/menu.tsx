import React, { useEffect, useState } from 'react';
import { Button, Stack, Box, CircularProgress } from '@mui/material';
import SvgLogo from './components/svg/logoSvg';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCourse } from '../../contexts/CoursesContext';
import { getCurrentCourse } from '../../services/business/courses/course.service';

const Menu: React.FC = () => {
    const { color } = useThemeColorContext();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { selectedCourse, setSelectedCourse } = useCourse();
    const [loading, setLoading] = useState(true);

    const svgStyle = {
        filter: `drop-shadow(0 0 8px ${color})`, // Neon effect for the SVG
        transition: 'filter 0.5s ease-in-out', // Smooth transition for the filter effect
        width: 'auto',
        height: '33vh' // Sets height relative to the viewport height
    };

    useEffect(() => {
    async function fetchCourse() {
      try {
        const course = await getCurrentCourse(user!.id);
        setSelectedCourse(course);
      } catch (err) {
        console.error('Erreur en récupérant le cours courant', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchCourse();
  }, [user, setSelectedCourse]);

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
                {/* Dynamic Course Button */}
                {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
                ) : (
                <Button
                    variant="outlined"
                    className="menu"
                    onClick={() =>
                    selectedCourse
                        ? navigate(`/course`)
                        : navigate('/course/new')
                    }
                >
                    {selectedCourse
                    ? t('CONTINUE_COURSE', 'CONTINUE COURSE')
                    : t('START_COURSE', 'START COURSE')}
                </Button>
                )}
                <Button onClick={() => navigate("/training")} variant='outlined' className='menu'>{t('TRAINING')}</Button>
                <Button onClick={() => navigate('/challenges')} variant='outlined' className='menu'>{t('RANKED')}</Button>
                <Button onClick={() => navigate('/profile')} variant='outlined' className='menu'>{t('PROFILE')}</Button>
                <Button onClick={() => navigate('/settings')} variant='outlined' className='menu'>{t('SETTINGS')}</Button>
            </Stack>
        </div>
    );
};

export default Menu;
