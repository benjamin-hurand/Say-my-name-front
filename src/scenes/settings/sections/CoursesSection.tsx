import * as React from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Menu, MenuItem, Skeleton, Stack, Tooltip, Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import SectionCard from "../SectionCard";
import AdvancedBlock from "../AdvancedBlock";

import { useAuth } from "../../../contexts/AuthContext";
import { useGlobalData } from "../../../contexts/GlobalDataContext";
import { useCourseStats } from "../../../contexts/CourseStatsContext";

import { notifyError, notifySuccess } from "../../../services/notification/toast.service";
import {
  getCurrentCourse, restartCourse, abandonCourse
} from "../../../services/business/courses/course.service";

// Icons
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import SportsEsportsRounded from "@mui/icons-material/SportsEsportsRounded";
import { useCourse } from "../../../contexts/CoursesContext";

type Props = { showAdvanced: boolean };

// --- Mini components -------------------------------------------------

function ProgressBar({
  unknown = 0, discovered = 0, learned = 0, mastered = 0, totalCreated = 0
}: {
  unknown?: number; discovered?: number; learned?: number; mastered?: number; totalCreated?: number;
}) {
  const total = Math.max(1, totalCreated);
  const seg = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <Box sx={{ mt: 1, mb: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: "action.hover",
        }}
        aria-label="Progression"
      >
        <Box sx={{ width: seg(unknown), bgcolor: "warning.light" }} />
        <Box sx={{ width: seg(discovered), bgcolor: "info.light" }} />
        <Box sx={{ width: seg(learned), bgcolor: "primary.main", opacity: 0.7 }} />
        <Box sx={{ width: seg(mastered), bgcolor: "success.main" }} />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
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

// --------------------------------------------------------------------

const CoursesSection: React.FC<Props> = ({ showAdvanced }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { modes } = useGlobalData();
  const { selectedCourse, setSelectedCourse } = useCourse();
  const {
    stats, loading: statsLoading, refresh: refreshStats,
  } = useCourseStats();

  const [bootLoading, setBootLoading] = React.useState(true);

  const [openRestart, setOpenRestart] = React.useState(false);
  const [openAbandon, setOpenAbandon] = React.useState(false);

  const [anchorMenu, setAnchorMenu] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorMenu);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorMenu(e.currentTarget);
  const closeMenu = () => setAnchorMenu(null);

  // Bootstrap : si pas de selectedCourse, aller le chercher côté API
  const bootstrap = React.useCallback(async () => {
    if (!user) {
      setBootLoading(false);
      return;
    }
    try {
      if (!selectedCourse) {
        const c = await getCurrentCourse(user.id);
        setSelectedCourse(c ?? null);
      }
    } catch {
      notifyError(t("COURSE_LOAD_FAILED", "Impossible de charger le parcours"));
    } finally {
      setBootLoading(false);
    }
  }, [user, selectedCourse, setSelectedCourse, t]);

  React.useEffect(() => { void bootstrap(); }, [bootstrap]);

  const goContinue = () => selectedCourse && navigate(`/course/${selectedCourse.id}/continue`);
  const goChange = () => navigate("/courses");
  const goManageFollows = () => navigate("/trombinoscope");

  const confirmRestart = async () => {
    if (!selectedCourse) return;
    try {
      await restartCourse(selectedCourse.id);
      notifySuccess(t("COURSE_RESTARTED", "Parcours redémarré"));
      setOpenRestart(false); closeMenu();
      // on garde le même courseId, on refreshe les stats
      await refreshStats();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || t("COURSE_RESTART_FAILED", "Le redémarrage a échoué"));
    }
  };

  const confirmAbandon = async () => {
    if (!selectedCourse) return;
    try {
      await abandonCourse(selectedCourse.id);
      notifySuccess(t("COURSE_ABANDONED", "Parcours abandonné"));
      setOpenAbandon(false); closeMenu();
      setSelectedCourse(null);
      // plus de stats si plus de course
      await refreshStats();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || t("COURSE_ABANDON_FAILED", "L’abandon a échoué"));
    }
  };

  const modeTitle = React.useMemo(() => {
    if (!selectedCourse) return "";
    return modes.find((m) => m.id === selectedCourse.gameModeId)?.title ?? `#${selectedCourse.gameModeId}`;
  }, [selectedCourse, modes]);

  const subtitle = React.useMemo(() => {
    if (bootLoading) return t("LOADING", "Chargement…");
    if (!selectedCourse) return t("NO_ACTIVE_COURSE", "Aucun parcours actif");
    return modeTitle; // épuré : mode uniquement
  }, [bootLoading, selectedCourse, modeTitle, t]);

  const continueLabel = React.useMemo(() => {
    const base = t("CONTINUE_COURSE", "Continuer");
    return dueNow > 0 ? `${base} • ${dueNow}` : base;
  }, [dueNow, t]);

  return (
    <>
      <SectionCard headerTitle={t("COURSES", "Parcours")} subtitle={subtitle} defaultExpanded={false}>
        {/* Loading bootstrap */}
        {bootLoading && (
          <Box>
            <Skeleton height={28} width={220} sx={{ mb: 1 }} />
            <Skeleton height={46} width="60%" sx={{ mb: 2 }} />
            <Skeleton height={12} width="50%" />
          </Box>
        )}

        {/* No course */}
        {!bootLoading && !selectedCourse && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("NO_ACTIVE_COURSE_HELP", "Crée un parcours pour t’entraîner régulièrement.")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="contained" onClick={() => navigate("/courses/create")} startIcon={<PlayArrowRounded />}>
                {t("CREATE_COURSE", "Créer un parcours")}
              </Button>
              <Button variant="outlined" onClick={goManageFollows} startIcon={<PeopleAltRounded />}>
                {t("MANAGE_FOLLOWS", "Gérer mes suivis")}
              </Button>
            </Stack>
          </>
        )}

        {/* Active course */}
        {!bootLoading && !!selectedCourse && (
          <>
            {/* Pills réduites */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", mb: 1 }}>
              <Chip size="small" color="success" label={t("STATUS", "Statut") + ": " + selectedCourse.status} sx={{ fontWeight: 600 }} />
              <Chip size="small" icon={<SportsEsportsRounded />} label={modeTitle} variant="outlined" />
              <IconButton size="small" onClick={handleMenu} sx={{ ml: "auto" }} aria-label={t("MORE_ACTIONS", "Plus d’actions")}>
                <MoreVertRounded />
              </IconButton>
            </Stack>

            {/* CTA row */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ mb: 1 }}
            >
              <Button onClick={goContinue} variant="contained" size="large" startIcon={<PlayArrowRounded />} sx={{ minWidth: 200 }}>
                {continueLabel}
              </Button>
              <Button onClick={goManageFollows} variant="outlined" startIcon={<PeopleAltRounded />}>
                {t("MANAGE_FOLLOWS", "Gérer mes suivis")}
              </Button>
              <Button onClick={goChange} variant="text" startIcon={<TuneRounded />}>
                {t("CHANGE_COURSE", "Changer de parcours")}
              </Button>
            </Stack>

            {/* Mini dashboard : due now + progression */}
            {(statsLoading || stats) && (
              <Box sx={{ mt: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoOutlined fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {t(
                      "COURSE_HINT_INLINE",
                      "Basé sur vos suivis. Pour ajuster la difficulté, changez de mode ou affinez vos suivis."
                    )}
                  </Typography>
                </Box>

                {statsLoading && <Skeleton height={18} sx={{ mt: 1, width: "60%" }} />}

                {!statsLoading && stats && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {headline}
                    </Typography>
                    <ProgressBar
                      unknown={stats.unknown}
                      discovered={stats.discovered}
                      learned={stats.learned}
                      mastered={stats.mastered}
                      totalCreated={totalCreated}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Bloc avancé : transparence algo / pédagogie */}
            {showAdvanced && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <AdvancedBlock defaultOpen={false} label={t("HOW_IT_WORKS", "Comment ça marche ?")}>
                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    <Typography variant="body2">
                      {t(
                        "COURSE_HOW_1",
                        "Le parcours choisit automatiquement des personnes à partir de vos suivis. Les révisions utilisent une répétition espacée (SRS) pour maximiser la rétention."
                      )}
                    </Typography>
                    <Typography variant="body2">
                      {t(
                        "COURSE_HOW_2",
                        "« Continuer » reprend la session là où tu t’es arrêté. Tu peux modifier le mode ou tes suivis à tout moment."
                      )}
                    </Typography>
                    <Typography variant="body2">
                      {t(
                        "COURSE_HOW_3",
                        "« Redémarrer » remet le parcours à zéro. « Abandonner » l’arrête et te permet d’en créer un nouveau."
                      )}
                    </Typography>
                  </Box>
                </AdvancedBlock>
              </>
            )}

            {/* Menu “Plus” */}
            <Menu anchorEl={anchorMenu} open={openMenu} onClose={closeMenu}>
              <MenuItem onClick={() => { closeMenu(); setOpenRestart(true); }}>
                <RestartAltRounded fontSize="small" style={{ marginRight: 8 }} />
                {t("RESTART_COURSE", "Redémarrer")}
              </MenuItem>
              <MenuItem onClick={() => { closeMenu(); setOpenAbandon(true); }}>
                <DeleteOutlineRounded fontSize="small" style={{ marginRight: 8 }} />
                {t("ABANDON_COURSE", "Abandonner")}
              </MenuItem>
            </Menu>
          </>
        )}
      </SectionCard>

      {/* Dialogs */}
      <Dialog open={openRestart} onClose={() => setOpenRestart(false)}>
        <DialogTitle>{t("CONFIRM_RESTART_TITLE", "Redémarrer ce parcours ?")}</DialogTitle>
        <DialogContent>
          <Typography>{t("CONFIRM_RESTART_DESC", "Tout le progrès sera remis à zéro. Cette action est irréversible.")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestart(false)}>{t("CANCEL", "Annuler")}</Button>
          <Button color="warning" onClick={confirmRestart} startIcon={<RestartAltRounded />}>
            {t("CONFIRM", "Confirmer")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAbandon} onClose={() => setOpenAbandon(false)}>
        <DialogTitle>{t("CONFIRM_ABANDON_TITLE", "Abandonner ce parcours ?")}</DialogTitle>
        <DialogContent>
          <Typography>{t("CONFIRM_ABANDON_DESC", "Tu pourras toujours en créer un nouveau plus tard.")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAbandon(false)}>{t("CANCEL", "Annuler")}</Button>
          <Button color="error" onClick={confirmAbandon} startIcon={<DeleteOutlineRounded />}>
            {t("CONFIRM", "Confirmer")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CoursesSection;
