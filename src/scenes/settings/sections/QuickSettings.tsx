import * as React from "react";
import {
  Paper, Typography, Grid, FormControlLabel, Switch, TextField, MenuItem, Chip, Stack
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useThemeColorContext } from "../../../contexts/ThemeColorContext";
import { neonColors, lightThemeColors } from "../../../models/commons/NeonColors";

const QuickSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    theme, toggleTheme, color, changeColor,
  } = useThemeColorContext();

  const isDark = theme === "dark";
  const palette = React.useMemo<string[]>(() => (isDark ? neonColors : lightThemeColors), [isDark]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t("QUICK_SETTINGS", "Quick settings")}
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md="auto">
          <FormControlLabel
            control={
              <Switch
                checked={isDark}
                onChange={(_, checked) => { if (checked !== isDark) toggleTheme(); }}
                inputProps={{ "aria-label": "toggle dark mode quick" }}
              />
            }
            label={t("DARK_MODE", "Dark mode")}
          />
        </Grid>

        <Grid item xs={12} sm={6} md="auto">
          <TextField
            select
            size="small"
            sx={{ minWidth: 180 }}
            label={t("LANGUAGE", "Language")}
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">{t("ACCENT_COLOR","Accent color")}:</Typography>
            <Grid container spacing={1} sx={{ width: "auto" }}>
              {palette.slice(0, 6).map((c) => (
                <Grid item key={`quick-accent-${c}`}>
                  <Chip
                    aria-label={`accent ${c}`}
                    clickable
                    onClick={() => changeColor(c)}
                    sx={{
                      width: 22, height: 22, borderRadius: "999px", bgcolor: c,
                      boxShadow: c === color ? "0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,0.4)" : "none",
                      border: "2px solid transparent",
                    }}
                    label=" "
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuickSettings;
