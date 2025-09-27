import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
  Button,
  Skeleton,
  Tooltip,
  Divider,
  IconButton,
} from '@mui/material';
import SportsEsportsRounded from '@mui/icons-material/SportsEsportsRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useGlobalData } from '../../contexts/GlobalDataContext';
import { useCourse } from '../../contexts/CoursesContext';
import { useCourseStats } from '../../contexts/CourseStatsContext';
import { restartCourse } from '../../services/business/courses/course.service';
import type { CourseStatsDto } from '../../services/dto/courses/CourseStatsDto';

export default function CoursesHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { modes } = useGlobalData();
  const { selectedCourse } = useCourse();
  const { get, isLoading, refresh } = useCourseStats();

  React.useEffect(() => {
    if (selectedCourse) {
      refresh(selectedCourse.id);
    }
  }, [selectedCourse, refresh]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'grid', gap: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" fontWeight={700}>
          {t('MY_COURSES', 'Mes parcours')}
        </Typography>
        <Button startIcon={<PeopleAltRounded />} onClick={() => navigate('/trombinoscope')}>
          {t('MANAGE_FOLLOWS', 'Gérer mes suivis')}
        </Button>
      </Stack>

      <Stack direction="column" spacing={1.5}>
        {modes.map((mode) => {
          const isActive = selectedCourse?.gameModeId === mode.id;
          const rawStats = isActive && selectedCourse ? get(selectedCourse.id) : null;
          const stats = toModeCardStats(rawStats); // ✅ NORMALISATION ICI
          const loading = isActive && selectedCourse ? isLoading(selectedCourse.id) : false;

          return (
            <ModeCard
              key={mode.id}
              title={mode.title}
              description={mode.description}
              isActive={isActive}
              stats={stats}
              loading={loading}
              onContinue={() => navigate('/course')}
              onRestart={async () => {
                if (!selectedCourse) return;
                await restartCourse(selectedCourse.id);
                await refresh(selectedCourse.id, { force: true });
              }}
              onStart={() =>
                navigate({
                  pathname: '/course/new',
                  search: `?${createSearchParams({ modeId: String(mode.id) })}`,
                })
              }
              targetAttributes={extractTargetAttributes(mode)}
              operatorLabel={extractOperatorLabel(mode, t)}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

/** Coalesce CourseStatsDto → type attendu par ModeCard (dueNow forcé en number). */
function toModeCardStats(
  s: CourseStatsDto | null | undefined
): {
  unknown: number;
  discovered: number;
  learned: number;
  mastered: number;
  progressPercent: number;
  dueNow: number;
} | null {
  if (!s) return null;
  return {
    unknown: s.unknown ?? 0,
    discovered: s.discovered ?? 0,
    learned: s.learned ?? 0,
    mastered: s.mastered ?? 0,
    progressPercent: s.progressPercent ?? 0,
    dueNow: s.dueNow ?? 0, // ✅ plus d'optionnel ici
  };
}

/** Essaie d’extraire les attributs cibles depuis le modèle GameMode, si présent. */
function extractTargetAttributes(mode: any): string[] | null {
  const list =
    mode?.gameModeAttributes?.map((gma: any) => gma?.attribute?.name).filter(Boolean) ??
    mode?.attributes?.map((a: any) => a?.name).filter(Boolean);

  return Array.isArray(list) && list.length > 0 ? (list as string[]) : null;
}

/** Essaie d’extraire l’opérateur ET/OU si présent dans le modèle GameMode. */
function extractOperatorLabel(mode: any, t: (k: string, d?: string) => string): string | null {
  const op = (mode?.operator || mode?.logic || '').toString().toUpperCase();
  if (op === 'AND') return t('AND', 'ET');
  if (op === 'OR') return t('OR', 'OU');
  return null;
}

/* ------------------------------ Sub-components ------------------------------ */

type ModeCardProps = {
  title: string;
  description?: string;
  isActive: boolean;
  stats: {
    unknown: number;
    discovered: number;
    learned: number;
    mastered: number;
    progressPercent: number;
    dueNow: number;
  } | null;
  loading: boolean;
  onContinue: () => void;
  onRestart: () => Promise<void> | void;
  onStart: () => void;
  targetAttributes?: string[] | null;
  operatorLabel?: string | null;
};

function ModeCard(props: ModeCardProps) {
  const {
    title,
    description,
    isActive,
    stats,
    loading,
    onContinue,
    onRestart,
    onStart,
    targetAttributes,
    operatorLabel,
  } = props;
  const { t } = useTranslation();

  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const openMenu = Boolean(menuAnchor);
  const openMenuBtn = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenuBtn = () => setMenuAnchor(null);

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <CardHeader
        avatar={<SportsEsportsRounded />}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        title={title}
        subheader={description || ''}
        action={
          isActive ? (
            <IconButton size="small" onClick={openMenuBtn} aria-label={t('MORE_ACTIONS', 'Plus')}>
              <MoreVertRounded />
            </IconButton>
          ) : null
        }
      />

      <CardContent sx={{ pt: 0 }}>
        {/* Contexte minimal */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip
            size="small"
            label={isActive ? t('IN_PROGRESS', 'En cours') : t('NOT_STARTED', 'Non démarré')}
            color={isActive ? 'success' : 'default'}
          />
          <Tooltip
            title={
              t('HUB_HINT', 'Les questions proviennent de vos suivis. Ajustez-les au besoin.') as string
            }
          >
            <InfoOutlined fontSize="small" color="action" />
          </Tooltip>
        </Stack>

        {/* Attributs cibles (si dispos) */}
        {targetAttributes && targetAttributes.length > 0 && (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
            {targetAttributes.map((name, i) => (
              <Chip key={`${name}-${i}`} size="small" variant="outlined" label={name} sx={{ mb: 0.5 }} />
            ))}
            {operatorLabel && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                ({t('LOGIC', 'Logique')}: {operatorLabel})
              </Typography>
            )}
          </Stack>
        )}

        {/* Bloc progression si actif */}
        {isActive ? (
          <>
            {loading ? (
              <>
                <Skeleton height={12} width="70%" sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 999 }} />
              </>
            ) : stats ? (
              <>
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('READY_TO_REVIEW', 'À réviser maintenant')}:
                  </Typography>
                  <Typography variant="body1">{stats.dueNow}</Typography>
                </Stack>

                <ProgressSegments
                  unknown={stats.unknown}
                  discovered={stats.discovered}
                  learned={stats.learned}
                  mastered={stats.mastered}
                />
                <Typography variant="caption" color="text.secondary">
                  {t('COURSE_PROGRESS_SHORT', '{{p}}% maîtrisé', { p: stats.progressPercent })}
                </Typography>
              </>
            ) : null}

            <Divider sx={{ my: 1.25 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" startIcon={<PlayArrowRounded />} onClick={onContinue}>
                {t('CONTINUE', 'Continuer')}
                {!!stats && stats.dueNow > 0 ? ` • ${stats.dueNow}` : ''}
              </Button>
              <Button variant="outlined" startIcon={<RestartAltRounded />} onClick={onRestart}>
                {t('RESTART', 'Redémarrer')}
              </Button>
            </Stack>
          </>
        ) : (
          <Button variant="contained" startIcon={<PlayArrowRounded />} onClick={onStart}>
            {t('START_THIS_COURSE', 'Démarrer ce parcours')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressSegments({
  unknown,
  discovered,
  learned,
  mastered,
}: {
  unknown: number;
  discovered: number;
  learned: number;
  mastered: number;
}) {
  const total = Math.max(1, unknown + discovered + learned + mastered);
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

  return (
    <Box sx={{ mt: 0.5, mb: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
        aria-label="Progression du parcours"
      >
        <Box sx={{ width: pct(unknown), bgcolor: 'warning.light' }} />
        <Box sx={{ width: pct(discovered), bgcolor: 'info.light' }} />
        <Box sx={{ width: pct(learned), bgcolor: 'primary.main', opacity: 0.7 }} />
        <Box sx={{ width: pct(mastered), bgcolor: 'success.main' }} />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
        <Legend label="Nouveaux" value={unknown} />
        <Legend label="En cours" value={discovered} />
        <Legend label="Acquis" value={learned} />
        <Legend label="Maîtrisés" value={mastered} />
      </Stack>
    </Box>
  );
}

function Legend({ label, value }: { label: string; value: number }) {
  return (
    <Typography variant="caption" color="text.secondary">
      {label} : <Typography component="span" variant="caption" fontWeight={600}>{value}</Typography>
    </Typography>
  );
}
