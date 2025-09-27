import * as React from "react";
import {
  Box, Chip, Divider, FormControlLabel, FormHelperText, Grid, MenuItem, Slider, Switch, TextField, Tooltip, Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SectionCard from "../SectionCard";
import AdvancedBlock from "../AdvancedBlock";
import { useThemeColorContext } from "../../../contexts/ThemeColorContext";
import { neonColors, lightThemeColors } from "../../../models/commons/NeonColors";

type Props = {
  showAdvanced: boolean;
};

const AppearanceSection: React.FC<Props> = ({ showAdvanced }) => {
  const { t } = useTranslation();
  const {
    theme, toggleTheme, color, changeColor,
    accentMode, setAccentMode, cycleIntervalMs, setCycleIntervalMs
  } = useThemeColorContext();

  const isDark = theme === "dark";
  const palette = React.useMemo<string[]>(() => (isDark ? neonColors : lightThemeColors), [isDark]);
  const appearanceSummary = `${isDark ? t("DARK_MODE","Dark mode") : t("LIGHT_MODE","Light mode")} • ${t("ACCENT_COLOR","Accent color")}`;

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeColor(e.target.value);
  };

  return (
    <SectionCard
      headerTitle={t("APPEARANCE", "Appearance")}
      subtitle={appearanceSummary}
      defaultExpanded={false}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isDark}
            onChange={(_, checked) => { if (checked !== isDark) toggleTheme(); }}
            inputProps={{ "aria-label": "toggle dark mode" }}
          />
        }
        label={t("DARK_MODE", "Dark mode")}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">{t("ACCENT_COLOR", "Accent color")}</Typography>
        <Grid container spacing={1} sx={{ mt: 1 }} role="list" aria-label="accent color palette">
          {palette.map((c) => (
            <Grid item key={`accent-${c}`} role="listitem">
              <Chip
                aria-label={`accent ${c}`}
                clickable
                onClick={() => changeColor(c)}
                sx={{
                  width: 28, height: 28, borderRadius: "999px", bgcolor: c,
                  boxShadow: c === color ? "0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,0.4)" : "none",
                  border: "2px solid transparent",
                }}
                label=" "
              />
            </Grid>
          ))}
          {showAdvanced && (
            <Grid item>
              <Tooltip title={t("CUSTOM_ACCENT_TOOLTIP", "Choose a custom accent color")}>
                <TextField
                  type="color"
                  value={color}
                  onChange={handleColorInput}
                  size="small"
                  aria-label="custom accent color"
                  sx={{ width: 48, height: 36, p: 0, minWidth: 48 }}
                  inputProps={{ style: { padding: 0, width: 48, height: 36 } }}
                />
              </Tooltip>
            </Grid>
          )}
        </Grid>
      </Box>

      {showAdvanced && (
        <AdvancedBlock defaultOpen={false} label={t("ADVANCED_OPTIONS", "Options avancées")}>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2, maxWidth: 360 }}>
            <TextField
              select
              label={t("ACCENT_BEHAVIOR", "Accent behavior")}
              value={accentMode}
              onChange={(e) => setAccentMode(e.target.value as any)}
              size="small"
              aria-describedby="accent-behavior-help"
            >
              <MenuItem value="static">{t("ACCENT_STATIC", "Static")}</MenuItem>
              <MenuItem value="random-hover">{t("ACCENT_RANDOM_HOVER", "Random on hover")}</MenuItem>
              <MenuItem value="cycle">{t("ACCENT_CYCLE", "Cycle over time")}</MenuItem>
            </TextField>
            <FormHelperText id="accent-behavior-help">
              {t("ACCENT_BEHAVIOR_HELP", "Choisis comment la couleur d’accent se comporte.")}
            </FormHelperText>

            {accentMode === "cycle" && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("CYCLE_INTERVAL_LABEL", "Changer de couleur toutes les X ms")}: {cycleIntervalMs}
                </Typography>
                <Slider
                  aria-label="cycle interval"
                  min={2000}
                  max={20000}
                  step={500}
                  value={cycleIntervalMs}
                  onChange={(_, v) => setCycleIntervalMs(v as number)}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 2000, label: "2s" },
                    { value: 10000, label: "10s" },
                    { value: 20000, label: "20s" },
                  ]}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked inputProps={{ "aria-label": "reduce animations" }} />}
              label={t("REDUCE_ANIMATIONS", "Reduce animations")}
            />
            <FormHelperText>
              {t("REDUCE_ANIMATIONS_HELP", "Moins d’animations pour plus de confort visuel.")}
            </FormHelperText>
          </Box>
        </AdvancedBlock>
      )}
    </SectionCard>
  );
};

export default AppearanceSection;
