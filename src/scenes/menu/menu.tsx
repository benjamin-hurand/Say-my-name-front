import React, { useEffect, useState } from 'react';
import { Button, Stack, Box, useMediaQuery, Typography } from '@mui/material';
import SvgLogo from './components/svg/logoSvg';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCourse } from '../../contexts/CoursesContext';
import { useCourseStats } from '../../contexts/CourseStatsContext';
import { useTheme } from '@mui/material/styles';
import CourseQuickStart from './components/CourseQuickStart';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import { useGlobalData } from '../../contexts/GlobalDataContext';

const Menu: React.FC = () => {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();

  // Responsive
  const smallWidth = useMediaQuery(theme.breakpoints.down('sm'));
  const compactHeight = useMediaQuery('(max-height: 820px)');

  const { modes } = useGlobalData();
  const { selectedCourse, setSelectedCourse, refreshCurrentCourse, focus } = useCourse();
  const { get, isLoading, refresh, progress } = useCourseStats();

  const [loadingCourse, setLoadingCourse] = useState(true);

  const svgStyle = {
    filter: `drop-shadow(0 0 8px ${color})`,
    transition: 'filter 0.5s ease-in-out',
    width: 'auto',
    height: compactHeight ? 'clamp(56px, 12svh, 140px)' : smallWidth ? '16svh' : 'clamp(72px, 18svh, 220px)',
  } as const;

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const course = await refreshCurrentCourse(user.id);
        setSelectedCourse(course);
        if (course) await refresh(course.id);
      } catch (err) {
        console.error('Erreur en récupérant le cours courant', err);
      } finally {
        setLoadingCourse(false);
      }
    })();
  }, [user, refreshCurrentCourse, setSelectedCourse, refresh]);

  const rawStats = selectedCourse ? get(selectedCourse.id) : null;
  const statsLoading = selectedCourse ? isLoading(selectedCourse.id) : false;

  const hasCourse = !!selectedCourse;

  function pickGameModeTitle(course: any): string | undefined {
    const embedded =
      course?.gameMode?.title ??
      course?.gameModeTitle ??
      course?.gameModeName ??
      course?.mode?.title ??
      course?.modeTitle ??
      course?.modeName;

    if (embedded) return embedded;

    const idLike = course?.gameModeId ?? course?.modeId ?? course?.mode?.id ?? course?.gameMode?.id;
    if (idLike && Array.isArray(modes) && modes.length > 0) {
      const found = modes.find((m) => m.id === idLike);
      if (found?.title) return found.title;
    }
    return undefined;
  }

  const gmTitle = hasCourse ? pickGameModeTitle(selectedCourse) : undefined;
  const gmUpper = gmTitle ? gmTitle.toLocaleUpperCase('fr-FR') : undefined;

  const headline = hasCourse ? 'CONTINUER LE PARCOURS' : t('START_COURSE', 'Démarrer un parcours');
  const modeLabel = hasCourse ? gmUpper : undefined;

  const accent = theme.palette.accent?.main ?? theme.palette.primary.main;

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'grid',
        gridTemplateRows: 'auto 1fr', // logo + zone scrollable
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: compactHeight ? 1.25 : { xs: 2, sm: 3 } }}>
        <SvgLogo color={color} style={svgStyle} />
      </Box>

      {/* Zone scrollable (minHeight:0 pour activer le scroll) */}
      <Box
        sx={{
          minHeight: 0,
          overflowY: 'auto',
          px: { xs: 2, sm: 3 },
          pb: `calc(env(safe-area-inset-bottom) + ${compactHeight ? 90 : 72}px)`,
          overscrollBehavior: 'contain',
        }}
      >
        <Stack spacing={compactHeight ? 1.1 : 1.6} alignItems="center">
          {/* === Parcours (entête + action secondaire) === */}
          <Box sx={{ width: '100%', maxWidth: 980 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.6,
                gap: 1,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: accent,
                  textShadow: `0 0 4px ${accent}`,
                  pl: 0.5,
                }}
              >
                Parcours
              </Typography>

              {/* Action “Tous mes parcours” compacte */}
              <Button
                onClick={() => navigate('/course/hub')}
                size="small"
                startIcon={<GridViewRounded />}
                sx={{
                  color: accent,
                  borderColor: accent,
                  px: 1.4,
                  py: 0.4,
                  borderRadius: 999,
                  textTransform: 'none',
                  boxShadow: `0 0 6px ${accent}`,
                  border: '1px solid',
                  transition: 'background-color .3s, box-shadow .3s',
                  '&:hover': {
                    backgroundColor: accent,
                    color: theme.palette.getContrastText(accent),
                    boxShadow: `0 0 16px ${accent}`,
                  },
                }}
              >
                {t('ALL_COURSES', 'Tous mes parcours')}
              </Button>
            </Box>

            {/* Carte “Continuer” */}
            <CourseQuickStart
              loading={loadingCourse || (hasCourse && statsLoading)}
              hasCourse={hasCourse}
              headline={headline}
              modeLabel={modeLabel}
              progressPercent={hasCourse ? (progress ?? 0) : undefined}
              dense={compactHeight || smallWidth}
              onPrimary={async () => {
                if (hasCourse && selectedCourse) {
                  await focus(selectedCourse.id);
                  navigate('/course');
                } else {
                  navigate('/course/new');
                }
              }}
            />
          </Box>

          {/* === Apprentissage === */}
          <Box sx={{ width: '100%', maxWidth: 980 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: accent,
                textShadow: `0 0 4px ${accent}`,
                mb: 0.4,
                pl: 0.5,
              }}
            >
              Apprentissage
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: compactHeight || smallWidth ? 0.8 : 1.4,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              <Button onClick={() => navigate('/training')} variant="outlined" className="menu"
                size={compactHeight || smallWidth ? 'small' : 'medium'} sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}>
                {t('TRAINING')}
              </Button>
              <Button onClick={() => navigate('/trombinoscope')} variant="outlined" className="menu"
                size={compactHeight || smallWidth ? 'small' : 'medium'} sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}>
                {t('TROMBINOSCOPE')}
              </Button>
            </Box>
          </Box>

          {/* === Compétition === */}
          <Box sx={{ width: '100%', maxWidth: 980 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: accent,
                textShadow: `0 0 4px ${accent}`,
                mb: 0.4,
                pl: 0.5,
              }}
            >
              Compétition
            </Typography>
            <Stack spacing={compactHeight || smallWidth ? 0.8 : 1.4}>
              <Button onClick={() => navigate('/challenges')} variant="outlined" className="menu"
                size={compactHeight || smallWidth ? 'small' : 'medium'} sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}>
                {t('RANKED', 'Classé')}
              </Button>
            </Stack>
          </Box>

          {/* === Mon compte === */}
          <Box sx={{ width: '100%', maxWidth: 980 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: accent,
                textShadow: `0 0 4px ${accent}`,
                mb: 0.4,
                pl: 0.5,
              }}
            >
              Mon compte
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: compactHeight || smallWidth ? 0.8 : 1.4,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              <Button onClick={() => navigate('/profile')} variant="outlined" className="menu"
                size={compactHeight || smallWidth ? 'small' : 'medium'} sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}>
                {t('PROFILE')}
              </Button>
              <Button onClick={() => navigate('/settings')} variant="outlined" className="menu"
                size={compactHeight || smallWidth ? 'small' : 'medium'} sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}>
                {t('SETTINGS')}
              </Button>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Menu;
