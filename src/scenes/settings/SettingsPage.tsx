import * as React from "react";
import { Box, Link as MuiLink, Stack } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import { useTranslation } from "react-i18next";

// Sections existantes (ou déjà splitées précédemment)
import QuickSettings from "./sections/QuickSettings";
import AppearanceSection from "./sections/AppearanceSection";
import SrsSection from "./sections/SrsSection";
import LanguageSection from "./sections/LanguageSection";
import PrivacyHelpSection from "./sections/PrivacyHelpSection";
import BackgroundParticlesSection from "./sections/BackgroundParticlesSection";
import DangerZoneSection from "./sections/DangerZoneSection";

// Nouvelle section Parcours
import CoursesSection from "./sections/CoursesSection";

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();

  const [showAdvanced, setShowAdvanced] = React.useState<boolean>(() => {
    const v = localStorage.getItem("settings_showAdvanced");
    return v === "true";
  });
  React.useEffect(() => {
    localStorage.setItem("settings_showAdvanced", String(showAdvanced));
  }, [showAdvanced]);

  return (
    <Box
      className="scrollable-content"
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
            onClick={() => setShowAdvanced(v => !v)}
            underline="hover"
            color="inherit"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.85,
              fontSize: 14,
              "&:hover": { opacity: 1 }
            }}
            aria-pressed={showAdvanced}
          >
            <TuneIcon fontSize="small" />
            {showAdvanced ? t("HIDE_ADVANCED", "Masquer options avancées") : t("SHOW_ADVANCED", "Options avancées")}
          </MuiLink>
        </Stack>

        <QuickSettings />

        {/* Sections denses → rétractables */}
        <AppearanceSection showAdvanced={showAdvanced} />
        <CoursesSection showAdvanced={showAdvanced} />
        <SrsSection showAdvanced={showAdvanced} />

        {/* Sections simples → non rétractables */}
        <LanguageSection />
        <PrivacyHelpSection />

        {/* Avancé uniquement */}
        {showAdvanced && (
          <>
            <BackgroundParticlesSection showAdvanced={showAdvanced} />
            <DangerZoneSection />
          </>
        )}
      </Stack>
    </Box>
  );
};

export default SettingsPage;
