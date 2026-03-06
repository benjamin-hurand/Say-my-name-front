import GridViewRounded from "@mui/icons-material/GridViewRounded";
import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import CourseQuickStart from "./components/CourseQuickStart";
import SvgLogo from "./components/svg/logoSvg";

import { useAuth } from "../../contexts/AuthContext";
import { useCourse } from "../../contexts/CoursesContext";
import { useCourseStats } from "../../contexts/CourseStatsContext";
import { useTenantData } from "../../contexts/TenantDataContext";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import { Attribute } from "../../models/commons/Attribute/Attribute";
import { OrgRole } from "../../models/tenants/TenantMembership";
import { CourseDto } from "../../services/dto/courses/CourseDto";


const ROLES_CAN_SEE_ADMIN = new Set<OrgRole>(["ADMIN", "OWNER"]);

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const toUpperFr = (s: string): string => s.toLocaleUpperCase("fr-FR");

/**
 * Déduit le libellé de l'attribut cible à afficher.
 * - priorité à course.targetAttribute.name
 * - fallback sur course.targetAttributeId + lookup dans attributes
 */
function getTargetAttributeTitle(course: CourseDto, attributes: Attribute[]): string | null {
  const embeddedName = course.targetAttributeId && attributes.find((a) => a.id === course.targetAttributeId)?.name;
  if (isNonEmptyString(embeddedName)) return embeddedName;

  const idLike = course.targetAttributeId;
  if (typeof idLike === "number" && Number.isFinite(idLike)) {
    const found = attributes.find((a) => a.id === idLike);
    if (found && isNonEmptyString(found.name)) return found.name;
  }

  return null;
}

const Menu: React.FC = () => {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  const { activeTenant } = useAuth();
  const canSeeAdmin = !!activeTenant && ROLES_CAN_SEE_ADMIN.has(activeTenant.role);

  // Responsive
  const smallWidth = useMediaQuery(theme.breakpoints.down("sm"));
  const compactHeight = useMediaQuery("(max-height: 820px)");

  const { attributes } = useTenantData() as { attributes: Attribute[] };
  const {
    selectedCourse,
    setSelectedCourse,
    refreshCurrentCourse,
    focus,
  } = useCourse();

  const { get, isLoading, refresh, progress } = useCourseStats();

  const [loadingCourse, setLoadingCourse] = useState<boolean>(true);

  const svgStyle = useMemo(
    () =>
      ({
        filter: `drop-shadow(0 0 8px ${color})`,
        transition: "filter 0.5s ease-in-out",
        width: "auto",
        height: compactHeight
          ? "clamp(56px, 12svh, 140px)"
          : smallWidth
          ? "16svh"
          : "clamp(72px, 18svh, 220px)",
      }) as const,
    [color, compactHeight, smallWidth]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 🚫 Si aucune org active, ne pas tenter de charger le cours
      if (!activeTenant) {
        if (!cancelled) setLoadingCourse(false);
        return;
      }

      try {
        if (!cancelled) setLoadingCourse(true);

        const course = await refreshCurrentCourse();
        if (cancelled) return;

        setSelectedCourse(course);

        if (course?.id != null) {
          await refresh(course.id);
        }
      } catch (err) {
        console.error("Erreur en récupérant le cours courant", err);
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [activeTenant, refreshCurrentCourse, setSelectedCourse, refresh]);

  const hasCourse = selectedCourse != null;

  const statsLoading = useMemo(() => {
    if (!selectedCourse) return false;
    return isLoading(selectedCourse.id);
  }, [selectedCourse, isLoading]);

  // On ne dépend pas de rawStats pour l'affichage actuel,
  // mais si tu en as besoin plus tard, tu peux le réutiliser proprement :
  // const rawStats = useMemo(() => (selectedCourse ? get(selectedCourse.id) : null), [selectedCourse, get]);
  // (supprimé pour éviter “variable unused”)

  const targetAttributeTitle = useMemo(() => {
    if (!selectedCourse) return null;
    return getTargetAttributeTitle(selectedCourse, attributes ?? []);
  }, [selectedCourse, attributes]);

  const targetAttributeUpper = useMemo(() => {
    return targetAttributeTitle ? toUpperFr(targetAttributeTitle) : null;
  }, [targetAttributeTitle]);

  const headline = hasCourse
    ? "CONTINUER LE PARCOURS"
    : t("START_COURSE", "Démarrer un parcours");

  const modeLabel = hasCourse ? targetAttributeUpper ?? undefined : undefined;

  const accent = theme.palette.accent?.main ?? theme.palette.primary.main;

  // 🧩 ONBOARDING : pas d’organisation → pas de menu normal
  if (!activeTenant) {
    return (
      <Box
        sx={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
          textAlign: "center",
          gap: 3,
        }}
      >
        <SvgLogo color={color} style={svgStyle} />

        <Box sx={{ maxWidth: 520 }}>
          <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600 }}>
            Bienvenue sur SayMyName 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
            Tu es connecté, mais tu n’as pas encore d’organisation.
            <br />
            Crée ton espace perso ou rejoins une équipe pour commencer à t’entraîner.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/settings")}
              sx={{ minWidth: 220, borderRadius: 999 }}
            >
              Créer mon espace
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/invitation")}
              sx={{ minWidth: 220, borderRadius: 999 }}
            >
              J’ai un lien d’invitation
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.7 }}>
            (Si tu as reçu un email d’invitation, clique sur le lien dans l’email,
            ou colle l’URL dans ton navigateur.)
          </Typography>
        </Box>
      </Box>
    );
  }

  // ✅ CAS NORMAL : l’utilisateur a une organisation → menu complet
  return (
    <Box
      sx={{
        minHeight: "100svh",
        display: "grid",
        gridTemplateRows: "auto 1fr", // logo + zone scrollable
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: compactHeight ? 1.25 : { xs: 2, sm: 3 },
        }}
      >
        <SvgLogo color={color} style={svgStyle} />
      </Box>

      {/* Zone scrollable (minHeight:0 pour activer le scroll) */}
      <Box
        sx={{
          minHeight: 0,
          overflowY: "auto",
          px: { xs: 2, sm: 3 },
          pb: `calc(env(safe-area-inset-bottom) + ${compactHeight ? 90 : 72}px)`,
          overscrollBehavior: "contain",
        }}
      >
        <Stack spacing={compactHeight ? 1.1 : 1.6} alignItems="center">
          {/* === Parcours === */}
          <Box sx={{ width: "100%", maxWidth: 980 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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

              <Button
                onClick={() => navigate("/course/hub")}
                size="small"
                startIcon={<GridViewRounded />}
                sx={{
                  color: accent,
                  borderColor: accent,
                  px: 1.4,
                  py: 0.4,
                  borderRadius: 999,
                  textTransform: "none",
                  boxShadow: `0 0 6px ${accent}`,
                  border: "1px solid",
                  transition: "background-color .3s, box-shadow .3s",
                  "&:hover": {
                    backgroundColor: accent,
                    color: theme.palette.getContrastText(accent),
                    boxShadow: `0 0 16px ${accent}`,
                  },
                }}
              >
                {t("ALL_COURSES", "Tous mes parcours")}
              </Button>
            </Box>

            <CourseQuickStart
              loading={loadingCourse || (hasCourse && statsLoading)}
              hasCourse={hasCourse}
              headline={headline}
              modeLabel={modeLabel}
              progressPercent={hasCourse ? (progress ?? 0) : undefined}
              dense={compactHeight || smallWidth}
              onPrimary={async () => {
                if (selectedCourse) {
                  await focus(selectedCourse.id);
                  navigate("/course");
                } else {
                  navigate("/course/new");
                }
              }}
            />
          </Box>

          {/* === Apprentissage === */}
          <Box sx={{ width: "100%", maxWidth: 980 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
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
                display: "grid",
                gap: compactHeight || smallWidth ? 0.8 : 1.4,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <Button
                onClick={() => navigate("/training")}
                variant="outlined"
                className="menu"
                size={compactHeight || smallWidth ? "small" : "medium"}
                sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}
              >
                {t("TRAINING")}
              </Button>

              <Button
                onClick={() => navigate("/trombinoscope")}
                variant="outlined"
                className="menu"
                size={compactHeight || smallWidth ? "small" : "medium"}
                sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}
              >
                {t("TROMBINOSCOPE")}
              </Button>
            </Box>
          </Box>

          {/* === Mon compte === */}
          <Box sx={{ width: "100%", maxWidth: 980 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
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
                display: "grid",
                gap: compactHeight || smallWidth ? 0.8 : 1.4,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <Button
                onClick={() => navigate("/profile")}
                variant="outlined"
                className="menu"
                size={compactHeight || smallWidth ? "small" : "medium"}
                sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}
              >
                {t("PROFILE")}
              </Button>

              <Button
                onClick={() => navigate("/leaderboard")}
                variant="outlined"
                className="menu"
                size={compactHeight || smallWidth ? "small" : "medium"}
                sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}
              >
                LEADERBOARD
              </Button>

              <Button
                onClick={() => navigate("/settings")}
                variant="outlined"
                className="menu"
                size={compactHeight || smallWidth ? "small" : "medium"}
                sx={{
                  py: compactHeight || smallWidth ? 0.6 : 1,
                  gridColumn: { xs: "auto", md: "1 / -1" },
                }}
              >
                {t("SETTINGS")}
              </Button>
            </Box>
          </Box>

          {/* === Admin === */}
          {canSeeAdmin && (
            <Box sx={{ width: "100%", maxWidth: 980 }}>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: accent,
                  textShadow: `0 0 4px ${accent}`,
                  mb: 0.4,
                  pl: 0.5,
                }}
              >
                Administration
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gap: compactHeight || smallWidth ? 0.8 : 1.4,
                  gridTemplateColumns: { xs: "1fr", md: "1fr" },
                }}
              >
                <Button
                  onClick={() => navigate("/admin")}
                  variant="outlined"
                  className="menu"
                  size={compactHeight || smallWidth ? "small" : "medium"}
                  sx={{ py: compactHeight || smallWidth ? 0.6 : 1 }}
                >
                  Ouvrir l’admin
                </Button>
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default Menu;