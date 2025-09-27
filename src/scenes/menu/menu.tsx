import React, { useEffect, useState } from 'react';
import {
  Button,
  Stack,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from '@mui/material';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import SvgLogo from './components/svg/logoSvg';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCourse } from '../../contexts/CoursesContext';
import { useCourseStats } from '../../contexts/CourseStatsContext';
import { getCurrentCourse } from '../../services/business/courses/course.service';

const Menu: React.FC = () => {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedCourse, setSelectedCourse } = useCourse();

  // ↪️ API du contexte de stats (multi-cours)
  const { get, isLoading, refresh } = useCourseStats();

  const [loadingCourse, setLoadingCourse] = useState(true);

  const svgStyle = {
    filter: `drop-shadow(0 0 8px ${color})`,
    transition: 'filter 0.5s ease-in-out',
    width: 'auto',
    height: '33vh',
  } as const;

  useEffect(() => {
    async function fetchCourse() {
      try {
        if (!user) return;
        const course = await getCurrentCourse(user.id);
        setSelectedCourse(course);
        if (course) {
          // Rafraîchit (respecte le TTL du provider)
          await refresh(course.id);
        }
      } catch (err) {
        console.error('Erreur en récupérant le cours courant', err);
      } finally {
        setLoadingCourse(false);
      }
    }
    fetchCourse();
  }, [user, setSelectedCourse, refresh]);

  // Stats + loading pour le cours sélectionné
  const stats = selectedCourse ? get(selectedCourse.id) : null;
  const statsLoading = selectedCourse ? isLoading(selectedCourse.id) : false;

  const progressPercent = stats
    ? Math.max(0, Math.min(100, stats.progressPercent ?? 0))
    : 0;

  return (
    <div
      style={{
        width: '100%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'clip',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          minHeight: '33vh',
          padding: '3vh',
        }}
      >
        <SvgLogo color={color} style={svgStyle} />
      </Box>

      <Stack
        spacing={2}
        direction="column"
        sx={{ flexGrow: 1, padding: '3vh', boxSizing: 'border-box' }}
      >
        {/* Carte "Reprendre" */}
        {loadingCourse ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : selectedCourse ? (
          <Card variant="outlined" sx={{ p: 1.5 }}>
            <CardContent sx={{ '&:last-child': { pb: 1 } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('MY_COURSE', 'Mon parcours')}
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('CONTINUE_COURSE', 'Continuer')}
                {!statsLoading && stats && (stats.dueNow ?? 0) > 0 ? ` • ${stats.dueNow}` : ''}
              </Typography>

              {/* mini barre de progression */}
              <Box sx={{ display: 'grid', gap: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  aria-label={t('COURSE_PROGRESS', 'Progression du parcours')}
                />
                <Typography variant="caption" color="text.secondary">
                  {statsLoading
                    ? t('LOADING', 'Chargement…')
                    : t('COURSE_PROGRESS_SHORT', '{{p}}% maîtrisé', {
                        p: progressPercent,
                      })}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowRounded />}
                  onClick={() => navigate('/course')}
                >
                  {t('RESUME', 'Reprendre')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GridViewRounded />}
                  onClick={() => navigate('/course/hub')}
                >
                  {t('ALL_COURSES', 'Tous mes parcours')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          // Pas de course → CTA de départ + lien vers hub
          <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
            <Button
              variant="contained"
              className="menu"
              startIcon={<PlayArrowRounded />}
              onClick={() => navigate('/course/new')}
            >
              {t('START_COURSE', 'Démarrer un parcours')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<GridViewRounded />}
              onClick={() => navigate('/course/hub')}
            >
              {t('ALL_COURSES', 'Tous mes parcours')}
            </Button>
          </Stack>
        )}

        {/* Le reste du menu */}
        <Button onClick={() => navigate('/training')} variant="outlined" className="menu">
          {t('TRAINING')}
        </Button>
        <Button onClick={() => navigate('/challenges')} variant="outlined" className="menu">
          {t('RANKED')}
        </Button>
        <Button onClick={() => navigate('/trombinoscope')} variant="outlined" className="menu">
          {t('TROMBINOSCOPE')}
        </Button>
        <Button onClick={() => navigate('/profile')} variant="outlined" className="menu">
          {t('PROFILE')}
        </Button>
        <Button onClick={() => navigate('/settings')} variant="outlined" className="menu">
          {t('SETTINGS')}
        </Button>
      </Stack>
    </div>
  );
};

export default Menu;
