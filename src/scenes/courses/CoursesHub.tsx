import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
  TextField,
} from '@mui/material';
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { useGlobalData } from '../../contexts/GlobalDataContext';
import { useCourse } from '../../contexts/CoursesContext';
import { useCourseStats } from '../../contexts/CourseStatsContext';
import { restartCourse } from '../../services/business/courses/course.service';
import type { CourseStatsDto } from '../../services/dto/courses/CourseStatsDto';
import { useAuth } from '../../contexts/AuthContext';
import CourseQuickStart from '../menu/components/CourseQuickStart';

export default function CoursesHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { modes } = useGlobalData();
  const { findCourseByModeId, refreshUserCourses, createOrResume, focus } = useCourse();
  const { get, isLoading, refresh, refreshForUser } = useCourseStats();

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      const list = await refreshUserCourses(user.id);
      if (list.length > 0) await refreshForUser(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Helper local (au cas où le contexte ne l’expose pas)
  const computeProgressPercent = (s: CourseStatsDto | null | undefined) => {
    if (!s) return 0;
    const u = s.unknown ?? 0;
    const d = s.discovered ?? 0;
    const l = s.learned ?? 0;
    const m = s.mastered ?? 0;
    const total = u + d + l + m;
    if (total <= 0) return 0;
    const earned = d * 1 + l * 2 + m * 4; // 0/1/2/4
    const max = total * 4;
    return Math.max(0, Math.min(100, Math.round((earned / max) * 100)));
  };

  /**
   * ---------------------------
   * Dialogue de confirmation RESET
   * ---------------------------
   */
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmChecked, setConfirmChecked] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [courseToReset, setCourseToReset] = React.useState<{
    id: number;
    title: string;
    modeId: number;
  } | null>(null);

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmChecked(false);
    setConfirmText('');
    setCourseToReset(null);
  };

  const openConfirmFor = (course: { id: number; title?: string; modeId: number }) => {
    setCourseToReset({ id: course.id, modeId: course.modeId, title: course.title ?? '' });
    setConfirmOpen(true);
  };

  const canConfirm = confirmChecked && confirmText.trim().toUpperCase() === 'RESET';

  const doConfirmReset = async () => {
    if (!courseToReset || !user) return;
    setConfirmLoading(true);
    try {
      await restartCourse(courseToReset.id);
      // on force un refresh pour que les compteurs repartent de 0 côté UI
      await refresh(courseToReset.id, { force: true });
      toast.success(t('COURSE_RESET_OK', 'Parcours réinitialisé.'));
      closeConfirm();
    } catch (e: any) {
      console.error(e);
      toast.error(
        t(
          'COURSE_RESET_ERR',
          "Échec du redémarrage du parcours. Merci de réessayer dans un instant."
        )
      );
      setConfirmLoading(false);
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        mx: 'auto',
        maxWidth: 1040,
        display: 'grid',
        gap: 1.2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.25 }}>
        <Button
          startIcon={<PeopleAltRounded />}
          onClick={() => navigate('/trombinoscope')}
          className="menu"
          variant="outlined"
        >
          {t('MANAGE_FOLLOWS', 'Gérer mes suivis')}
        </Button>
      </Box>

      {modes.map((mode) => {
        const course = findCourseByModeId(mode.id);
        const hasCourse = Boolean(course);
        const stats: CourseStatsDto | null = course ? get(course.id) : null;

        const progress = hasCourse ? computeProgressPercent(stats) : undefined;
        const loading = hasCourse ? isLoading(course!.id) : false;

        const onPrimary = async () => {
          if (hasCourse && course) {
            await focus(course.id);
            navigate('/course');
          } else if (user) {
            const created = await createOrResume(user.id, mode.id, 'FOLLOWED');
            await refresh(created.id, { force: true });
            navigate('/course');
          }
        };

        const gmUpper = (mode.title || '').toLocaleUpperCase('fr-FR');

        return (
          <CourseQuickStart
            key={mode.id}
            loading={loading}
            hasCourse={hasCourse}
            headline={hasCourse ? 'CONTINUER' : 'COMMENCER'}
            modeLabel={gmUpper}
            progressPercent={progress}
            // Le composant CourseQuickStart n'affiche plus rightNote (demande précédente)
            rightNote={undefined}
            onPrimary={onPrimary}
            showMenu={hasCourse}
            tone={hasCourse ? 'primary' : 'muted'}
            menuItems={
              hasCourse && course
                ? [
                    {
                      label: t('RESTART_COURSE', 'Redémarrer le parcours…'),
                      danger: true,
                      onClick: () => {
                        if (loading) return; // garde : pas de reset quand ça charge
                        openConfirmFor({ id: course.id, title: mode.title, modeId: mode.id });
                      },
                    },
                  ]
                : []
            }
          />
        );
      })}

      {/* ---- Dialog de confirmation ---- */}
      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberRounded color="warning" />
          {t('CONFIRM_RESET_TITLE', 'Confirmer la réinitialisation')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Typography variant="body2">
              {t(
                'CONFIRM_RESET_DESC',
                "Cette action va remettre à zéro votre progression, vos niveaux de mémorisation et le planning de révision pour ce parcours. L'historique de sessions associé peut aussi être réinitialisé."
              )}
            </Typography>
            {courseToReset?.title && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('COURSE_LABEL', 'Parcours')} : <strong>{courseToReset.title}</strong>
              </Typography>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                />
              }
              label={t(
                'CONFIRM_RESET_CHECK',
                "Je comprends que cette action est irréversible pour la progression."
              )}
            />

            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.9 }}>
                {t(
                  'TYPE_RESET_TO_CONFIRM',
                  "Pour confirmer, tapez « RESET » dans le champ ci-dessous :"
                )}
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="RESET"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                inputProps={{ style: { textTransform: 'uppercase', letterSpacing: 1 } }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeConfirm} disabled={confirmLoading}>
            {t('CANCEL', 'Annuler')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            onClick={doConfirmReset}
            disabled={!canConfirm || confirmLoading}
          >
            {confirmLoading
              ? t('RESETTING', 'Réinitialisation…')
              : t('RESET_NOW', 'Oui, réinitialiser')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
