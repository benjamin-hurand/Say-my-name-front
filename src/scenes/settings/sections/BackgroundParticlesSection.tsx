import * as React from "react";
import {
  Box, FormControlLabel, FormHelperText, Slider, Switch, Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SectionCard from "../SectionCard";
import AdvancedBlock from "../AdvancedBlock";
import { useParticles } from "../../../contexts/ParticlesContext";

type Props = {
  showAdvanced: boolean; // pas utilisé directement ici, mais tu peux l'utiliser si besoin
};

const BackgroundParticlesSection: React.FC<Props> = () => {
  const { t } = useTranslation();
  const {
    enabled: particlesEnabled,
    count: particlesCount,
    speed: particlesSpeed,
    frozen: particlesFrozen,
    setEnabled: setParticlesEnabled,
    setCount: setParticlesCount,
    setSpeed: setParticlesSpeed,
    setFrozen: setParticlesFrozen,
  } = useParticles();

  const [tmpParticlesCount, setTmpParticlesCount] = React.useState<number>(particlesCount);
  const [tmpParticlesSpeed, setTmpParticlesSpeed] = React.useState<number>(particlesSpeed);
  React.useEffect(() => { setTmpParticlesCount(particlesCount); }, [particlesCount]);
  React.useEffect(() => { setTmpParticlesSpeed(particlesSpeed); }, [particlesSpeed]);

  const backgroundSummary = `${particlesEnabled ? t("ON","On") : t("OFF","Off")} • ${t("PARTICLES","Particles")}`;

  return (
    <SectionCard
      headerTitle={t("BACKGROUND_EFFECTS", "Background effects")}
      subtitle={backgroundSummary}
      defaultExpanded={false}
    >
      <FormControlLabel
        control={
          <Switch
            checked={particlesEnabled}
            onChange={(_, c) => setParticlesEnabled(c)}
            inputProps={{ "aria-label": "enable particles" }}
          />
        }
        label={t("PARTICLES_ENABLED", "Enable particles")}
      />

      <AdvancedBlock defaultOpen={false}>
        <Box
          sx={{
            mt: 1,
            opacity: particlesEnabled ? 1 : 0.5,
            pointerEvents: particlesEnabled ? "auto" : "none",
            maxWidth: 420,
          }}
        >
          <Typography variant="body2">
            {t("PARTICLES_COUNT", "Particles count")}: {tmpParticlesCount}
          </Typography>
          <Slider
            aria-label="particles count"
            min={0}
            max={200}
            value={tmpParticlesCount}
            onChange={(_, v) => setTmpParticlesCount(v as number)}
            onChangeCommitted={(_, v) => setParticlesCount(v as number)}
            valueLabelDisplay="auto"
            marks={[
              { value: 0, label: "0" },
              { value: 100, label: "100" },
              { value: 200, label: "200" },
            ]}
          />

          <Typography variant="body2" sx={{ mt: 2 }}>
            {t("PARTICLES_SPEED", "Particles speed")}: {tmpParticlesSpeed.toFixed(1)}
          </Typography>
          <Slider
            aria-label="particles speed"
            min={0}
            max={5}
            step={0.1}
            value={tmpParticlesSpeed}
            onChange={(_, v) => setTmpParticlesSpeed(v as number)}
            onChangeCommitted={(_, v) => setParticlesSpeed(v as number)}
            valueLabelDisplay="auto"
            marks={[
              { value: 0, label: "0" },
              { value: 2.5, label: "2.5" },
              { value: 5, label: "5" },
            ]}
          />

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={particlesFrozen}
                onChange={(_, c) => setParticlesFrozen(c)}
                inputProps={{ "aria-label": "freeze particles" }}
              />
            }
            label={t("PARTICLES_FREEZE", "Freeze animation")}
          />
          <FormHelperText>
            {t("FREEZE_HINT","Stoppe le mouvement sans masquer les particules.")}
          </FormHelperText>
        </Box>
      </AdvancedBlock>
    </SectionCard>
  );
};

export default BackgroundParticlesSection;
