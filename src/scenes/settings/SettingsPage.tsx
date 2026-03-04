// src/scenes/settings/components/SettingsPage.tsx
import * as React from "react";
import { Box, Link as MuiLink, Stack, Alert } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import QuickSettings from "./sections/QuickSettings";
import AppearanceSection from "./sections/AppearanceSection";
import SrsSection from "./sections/SrsSection";
import LanguageSection from "./sections/LanguageSection";
import PrivacyHelpSection from "./sections/PrivacyHelpSection";
import BackgroundParticlesSection from "./sections/BackgroundParticlesSection";
import CoursesSection from "./sections/CoursesSection";
import { useAuth } from "../../contexts/AuthContext";
import { OrgDataProvider } from "../../contexts/OrgDataContext";


const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeTenant } = useAuth();

  const [showAdvanced, setShowAdvanced] = React.useState<boolean>(() => {
    const v = localStorage.getItem("settings_showAdvanced");
    return v === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("settings_showAdvanced", String(showAdvanced));
  }, [showAdvanced]);

  return (
    <Box
      role="region"
      aria-label="Settings scroll region"
      sx={{
        overflowY: "auto",
        height: "100%",
        maxHeight: "calc(100vh - 120px)",
        minHeight: 0,
        px: 2,
        py: 1,
      }}
    >
      <Stack spacing={2} sx={{ pb: 6 }}>
        {/* Lien discret pour les options avancées */}
        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <MuiLink
            component="button"
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            underline="hover"
            color="inherit"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.85,
              fontSize: 14,
              "&:hover": { opacity: 1 },
            }}
            aria-pressed={showAdvanced}
          >
            <TuneIcon fontSize="small" />
            {showAdvanced
              ? t("HIDE_ADVANCED", "Masquer options avancées")
              : t("SHOW_ADVANCED", "Options avancées")}
          </MuiLink>
        </Stack>

        <QuickSettings />

        {/* Sections denses → rétractables */}
        <AppearanceSection showAdvanced={showAdvanced} />

        {/* ✅ Progression (Courses) uniquement si org active + provider monté */}
        {activeTenant ? (
          <OrgDataProvider>
            <CoursesSection showAdvanced={showAdvanced} />
          </OrgDataProvider>
        ) : (
          <Alert
            variant="outlined"
            severity="info"
            action={
              <MuiLink
                component="button"
                type="button"
                onClick={() => navigate("/onboarding")}
                underline="hover"
              >
                {t("GO_ONBOARDING", "Créer / rejoindre une organisation")}
              </MuiLink>
            }
          >
            {t(
              "PROGRESSION_NEEDS_ORG",
              "La progression est liée à une organisation. Rejoignez ou créez une organisation pour activer les parcours."
            )}
          </Alert>
        )}

        {/* Avancé uniquement */}
        {showAdvanced && (
          <>
            <BackgroundParticlesSection showAdvanced={showAdvanced} />
            <SrsSection showAdvanced={showAdvanced} />
          </>
        )}

        {/* Sections simples → non rétractables */}
        <LanguageSection />
        <PrivacyHelpSection />
      </Stack>
    </Box>
  );
};

export default SettingsPage;
