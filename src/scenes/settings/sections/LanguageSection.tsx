import * as React from "react";
import { Paper, Typography, TextField, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

const LanguageSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const languageSummary = i18n.language?.toUpperCase();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t("LANGUAGE", "Language")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {languageSummary}
      </Typography>
      <TextField
        select
        size="small"
        sx={{ minWidth: 220 }}
        label={t("SELECT_LANGUAGE", "Select language")}
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        <MenuItem value="fr">Français</MenuItem>
        <MenuItem value="en">English</MenuItem>
        <MenuItem value="es">Español</MenuItem>
      </TextField>
    </Paper>
  );
};

export default LanguageSection;
