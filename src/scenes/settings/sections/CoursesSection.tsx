// src/scenes/settings/components/sections/CoursesSection.tsx
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Link as MuiLink,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import InfoOutlined from "@mui/icons-material/InfoOutlined";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import SportsEsportsRounded from "@mui/icons-material/SportsEsportsRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";

import { useCourse } from "../../../contexts/CoursesContext";
import { useCourseStats } from "../../../contexts/CourseStatsContext";
import { useOrgData } from "../../../contexts/OrgDataContext";
import API from "../../../services/api/apiUtils";
import { getUserCourses, restartCourse } from "../../../services/business/courses/course.service";
import { CourseDto } from "../../../services/dto/courses/CourseDto";
import { CourseStatsDto } from "../../../services/dto/courses/CourseStatsDto";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";
import SectionCard from "../SectionCard";

function computeProgressPercent(s: CourseStatsDto | null | undefined): number {
  if (!s) return 0;
  const u = s.unknown ?? 0, d = s.discovered ?? 0, l = s.learned ?? 0, m = s.mastered ?? 0;
  const total = u + d + l + m;
  if (total <= 0) return 0;
  const weighted = d * 0.33 + l * 0.66 + m * 1.0;
  return Math.round((weighted / total) * 100);
}

type Props = { showAdvanced: boolean };

const CoursesSection: React.FC<Props> = ({ showAdvanced }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { modes } = useOrgData();
  const { setSelectedCourse, refreshCurrentCourse, upsertCourse, listCourses } = useCourse();
  const { get: getStats, isLoading: isStatsLoading, refresh: refreshStats, prefetch: prefetchStats } = useCourseStats();

  const [bootLoading, setBootLoading] = React.useState(true);
  const [activeCourses, setActiveCourses] = React.useState<CourseDto[]>([]);

  // kebab menu
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [menuCourseId, setMenuCourseId] = React.useState<number | null>(null);
  const openMenu = Boolean(menuAnchor);
  const openMenuFor = (e: React.MouseEvent<HTMLElement>, id: number) => { setMenuAnchor(e.currentTarget); setMenuCourseId(id); };
  const closeMenu = () => { setMenuAnchor(null); setMenuCourseId(null); };

  // RESET (parcours unique)
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmChecked, setConfirmChecked] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [courseToReset, setCourseToReset] = React.useState<{ id: number; title: string } | null>(null);
  const canConfirm = confirmChecked && confirmText.trim().toUpperCase() === "RESET";

  // RESET GLOBAL
  const [confirmGlobalOpen, setConfirmGlobalOpen] = React.useState(false);
  const [confirmGlobalChecked, setConfirmGlobalChecked] = React.useState(false);
  const [confirmGlobalText, setConfirmGlobalText] = React.useState("");
  const [confirmGlobalLoading, setConfirmGlobalLoading] = React.useState(false);
  const canConfirmGlobal = confirmGlobalChecked && confirmGlobalText.trim().toUpperCase() === "RESET ALL";

  const openConfirmFor = (course: { id: number; title: string }) => { setCourseToReset(course); setConfirmOpen(true); };
  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false); setConfirmChecked(false); setConfirmText(""); setCourseToReset(null);
  };

  const doConfirmReset = async () => {
    if (!courseToReset) return;
    setConfirmLoading(true);
    try {
      await restartCourse(courseToReset.id);
      await refreshStats(courseToReset.id, { force: true });
      notifySuccess(t("COURSE_RESTARTED", "Parcours réinitialisé"));
      closeConfirm();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || t("COURSE_RESTART_FAILED", "Le redémarrage a échoué"));
      setConfirmLoading(false);
    }
  };

  const openConfirmGlobal = () => setConfirmGlobalOpen(true);
  const closeConfirmGlobal = () => {
    if (confirmGlobalLoading) return;
    setConfirmGlobalOpen(false); setConfirmGlobalChecked(false); setConfirmGlobalText("");
  };
  const doConfirmGlobalReset = async () => {
    setConfirmGlobalLoading(true);
    try {
      for (const c of activeCourses) {
        await restartCourse(c.id);
        await refreshStats(c.id, { force: true });
      }
      notifySuccess(t("ALL_PROGRESS_RESET", "Toute la progression a été réinitialisée"));
      closeConfirmGlobal();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || t("GLOBAL_RESET_FAILED", "La réinitialisation globale a échoué"));
      setConfirmGlobalLoading(false);
    }
  };

  // focus silencieux
  async function focusCourse(courseId: number) {
    try {
      await API.post(`/courses/${courseId}/focus`);
      const course = activeCourses.find(c => c.id === courseId) || listCourses().find(c => c.id === courseId) || null;
      if (course) setSelectedCourse(course);
    } catch { /* no-op */ }
  }
  async function openCourse(courseId: number) { await focusCourse(courseId); navigate("/course"); }

  // bootstrap
  React.useEffect(() => {
    (async () => {
      try {
        const focused = await refreshCurrentCourse();
        if (focused) { upsertCourse(focused); setSelectedCourse(focused); }
        const list = await getUserCourses();
        setActiveCourses(list);
        list.forEach(upsertCourse);
        await prefetchStats(list.map(c => c.id));
      } catch (e) {
        console.error(e);
        notifyError(t("COURSE_LOAD_FAILED", "Impossible de charger vos parcours"));
      } finally { setBootLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SectionCard
        headerTitle={t("PROGRESSION_TITLE", "Progression")}
        subtitle={t("PROGRESSION_SUB", "Ici, on consulte et règle la progression. Les actions à risque sont dans les options avancées.")}
      >
        {/* --- 1) Panneau avancé (en premier si activé) --- */}
        {showAdvanced && activeCourses.length > 0 && (
          <Card
            variant="outlined"
            sx={(th) => ({
              mb: 1.25,
              borderColor: th.palette.error.main,
              backgroundColor: alpha(th.palette.error.main, 0.06),
            })}
          >
            <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle2" sx={(th) => ({ color: th.palette.error.main, fontWeight: 700 })}>
                    {t("ADVANCED_ACTIONS", "Actions avancées")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("RESET_ALL_EXPLAIN", "Réinitialise la progression et la planification de révision sur tous vos parcours.")}
                  </Typography>
                </Box>

                <Button
                  color="error"
                  variant="contained"
                  size="small"
                  onClick={openConfirmGlobal}
                  startIcon={<RestartAltRounded />}
                  sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
                >
                  {t("RESET_ALL_PROGRESS", "Réinitialiser toute la progression")}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* --- 2) Intro + lien “Gérer mes suivis” (lien discret) --- */}
        <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Grid item xs>
            <Typography variant="body2" color="text.secondary">
              {t("COURSE_FROM_FOLLOWS_HINT", "Les parcours ciblent en priorité les personnes que vous suivez.")}
            </Typography>
          </Grid>
          <Grid item>
            <MuiLink
              component="button"
              type="button"
              onClick={() => navigate("/trombinoscope")}
              underline="hover"
              color="inherit"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                opacity: 0.9,
                fontSize: 14,
                px: 0.5,
                "&:hover": { opacity: 1 },
                "&:focus-visible": (th) => ({
                  outline: `2px solid ${th.palette.primary.main}`,
                  outlineOffset: 2,
                  borderRadius: 6,
                }),
              }}
              aria-label={t("MANAGE_FOLLOWS", "Gérer mes suivis")}
            >
              <OpenInNewRounded fontSize="small" />
              {t("MANAGE_FOLLOWS", "Gérer mes suivis")}
            </MuiLink>
          </Grid>
        </Grid>

        {/* --- 3) Liste des parcours --- */}
        {bootLoading ? (
          <Box>
            <Skeleton height={26} width="35%" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={112} sx={{ borderRadius: 2 }} />
          </Box>
        ) : activeCourses.length === 0 ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {t("NO_ACTIVE_COURSE", "Aucun parcours actif pour le moment.")}
            </Typography>
            <MuiLink component="button" type="button" underline="hover" onClick={() => navigate("/course/new")}>
              {t("CREATE_COURSE", "Créer un parcours")}
            </MuiLink>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {activeCourses.map((c) => {
              const stats = getStats(c.id);
              const progress = computeProgressPercent(stats);
              const loading = isStatsLoading(c.id);
              const modeTitle = (modes.find(m => m.id === c.gameModeId)?.title) ?? `#${c.gameModeId}`;

              return (
                <Card
                  key={c.id}
                  variant="outlined"
                  className="menu"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") openCourse(c.id); }}
                  sx={{
                    p: 0,
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: (th) => th.palette.primary.main,
                      outlineOffset: 2,
                      borderRadius: 2,
                    },
                    "&:hover .row-open, &:focus-within .row-open": { opacity: 1, pointerEvents: "auto" },
                  }}
                >
                  <CardContent sx={{ py: 1.25, px: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SportsEsportsRounded fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                        {modeTitle}
                      </Typography>
                      <Tooltip title={t("COURSE_HINT", "Questions liées à vos suivis + logique du mode.") as string}>
                        <InfoOutlined fontSize="small" color="action" />
                      </Tooltip>

                      <Box sx={{ flexGrow: 1 }} />

                      <Tooltip title={t("OPEN_COURSE", "Ouvrir ce parcours") as string}>
                        <span>
                          <Button
                            className="row-open"
                            size="small"
                            variant="text"
                            startIcon={<PlayArrowRounded />}
                            onClick={() => openCourse(c.id)}
                            disabled={loading}
                            sx={{
                              opacity: 0,
                              pointerEvents: "none",
                              transition: "opacity .15s",
                              textTransform: "none",
                              minWidth: 0,
                              px: 0.75,
                            }}
                          >
                            {t("OPEN", "Ouvrir")}
                          </Button>
                        </span>
                      </Tooltip>

                      <IconButton
                        size="small"
                        onClick={(e) => openMenuFor(e, c.id)}
                        aria-label={t("MORE_ACTIONS", "Plus d’actions")}
                      >
                        <MoreVertRounded />
                      </IconButton>
                    </Stack>

                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          "& .MuiLinearProgress-bar": { borderRadius: 999 },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {t("COURSE_PROGRESS_SHORT", "{{p}}% maîtrisé", { p: progress })}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </SectionCard>

      {/* Menu kebab */}
      <Menu anchorEl={menuAnchor} open={openMenu} onClose={closeMenu}>
        <MenuItem
          onClick={async () => {
            const id = menuCourseId; closeMenu(); if (!id) return;
            await openCourse(id);
          }}
        >
          <PlayArrowRounded fontSize="small" style={{ marginRight: 8 }} />
          {t("OPEN", "Ouvrir")}
        </MenuItem>

        {showAdvanced && (
          <MenuItem
            onClick={() => {
              const id = menuCourseId; closeMenu(); if (!id) return;
              const course = activeCourses.find((c) => c.id === id);
              const title = course ? (modes.find((m) => m.id === course.gameModeId)?.title ?? "") : "";
              openConfirmFor({ id, title });
            }}
            sx={{ color: (th) => th.palette.error.main, "& .MuiSvgIcon-root": { color: "inherit" } }}
          >
            <RestartAltRounded fontSize="small" style={{ marginRight: 8 }} />
            {t("RESTART", "Redémarrer")}
          </MenuItem>
        )}
      </Menu>

      {/* Dialog RESET (un parcours) */}
      <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberRounded color="warning" /> {t("CONFIRM_RESET_TITLE", "Confirmer la réinitialisation")}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Typography variant="body2">
              {t("CONFIRM_RESET_DESC", "Cette action remettra à zéro votre progression et le planning de révision pour ce parcours.")}
            </Typography>
            {courseToReset?.title && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t("COURSE_LABEL", "Parcours")} : <strong>{courseToReset.title}</strong>
              </Typography>
            )}
            <FormControlLabel control={<Checkbox checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />}
              label={t("CONFIRM_RESET_CHECK", "Je comprends que cette action est irréversible pour la progression.")} />
            <Box>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5, opacity: 0.9 }}>
                {t("TYPE_RESET_TO_CONFIRM", 'Pour confirmer, tapez « RESET » :')}
              </Typography>
              <TextField size="small" fullWidth placeholder="RESET" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                inputProps={{ style: { textTransform: "uppercase", letterSpacing: 1 } }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeConfirm} disabled={confirmLoading}>{t("CANCEL", "Annuler")}</Button>
          <Button variant="contained" color="error" disableElevation onClick={doConfirmReset} disabled={!canConfirm || confirmLoading}
            startIcon={<RestartAltRounded />}>
            {confirmLoading ? t("RESETTING", "Réinitialisation…") : t("RESET_NOW", "Oui, réinitialiser")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog RESET GLOBAL */}
      <Dialog open={confirmGlobalOpen} onClose={closeConfirmGlobal} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberRounded color="warning" /> {t("CONFIRM_GLOBAL_RESET_TITLE", "Réinitialiser TOUTE la progression ?")}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Typography variant="body2">
              {t("CONFIRM_GLOBAL_RESET_DESC", "Tous vos parcours seront réinitialisés (progression et planification).")}
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={confirmGlobalChecked} onChange={(e) => setConfirmGlobalChecked(e.target.checked)} />}
              label={t("CONFIRM_RESET_CHECK", "Je comprends que cette action est irréversible pour la progression.")}
            />
            <Box>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5, opacity: 0.9 }}>
                {t("TYPE_RESET_ALL_TO_CONFIRM", 'Pour confirmer, tapez « RESET ALL » :')}
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="RESET ALL"
                value={confirmGlobalText}
                onChange={(e) => setConfirmGlobalText(e.target.value)}
                inputProps={{ style: { textTransform: "uppercase", letterSpacing: 1 } }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeConfirmGlobal} disabled={confirmGlobalLoading}>{t("CANCEL", "Annuler")}</Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            onClick={doConfirmGlobalReset}
            disabled={!canConfirmGlobal || confirmGlobalLoading}
            startIcon={<RestartAltRounded />}
          >
            {confirmGlobalLoading ? t("RESETTING", "Réinitialisation…") : t("RESET_NOW", "Oui, réinitialiser tout")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CoursesSection;
