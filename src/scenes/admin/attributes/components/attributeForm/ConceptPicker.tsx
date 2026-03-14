import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import {
  Box,
  Chip,
  FormHelperText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { glassCard } from "../../../../../styles/glassStyles";
import { getConceptIcon } from "./attributeForm.helpers";
import type {
  ConceptCardOption,
  ConceptDescriptionGetter,
  ConceptLabelGetter,
} from "./attributeForm.types";

type Props = {
  options: ConceptCardOption[];
  value: number | null;
  onChange: (next: number | null) => void;
  getLabel: ConceptLabelGetter;
  getDescription: ConceptDescriptionGetter;
  initialConceptId?: number | null;
};

export default function ConceptPicker({
  options,
  value,
  onChange,
  getLabel,
  getDescription,
  initialConceptId,
}: Props) {
  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
          gap: { xs: 1, sm: 1.25 },
        }}
      >
        {options.map((concept) => {
          const disabled = concept.blocked && concept.id !== initialConceptId;
          const selected = !disabled && value === concept.id;
          const Icon = getConceptIcon(concept.code);

          return (
            <Paper
              key={concept.id}
              component="button"
              type="button"
              onClick={() => !disabled && onChange(concept.id)}
              disabled={disabled}
              sx={(theme) => {
                const ring = alpha(theme.palette.primary.main, 0.65);
                const ringHalo = alpha(theme.palette.primary.main, 0.1);
                return {
                  ...(glassCard(theme) as object),
                  aspectRatio: "1 / 1",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.58 : 1,
                  filter: disabled ? "grayscale(0.22) saturate(0.8)" : "none",
                  ...(disabled && {
                    "&:hover": {
                      transform: "none",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.35)}, ${alpha(theme.palette.background.paper, 0.22)})`,
                    },
                  }),
                  ...(selected && {
                    borderColor: ring,
                    background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.35)})`,
                    boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(theme.palette.primary.main, 0.25)}`,
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      boxShadow: `0 0 0 8px ${ringHalo}`,
                      pointerEvents: "none",
                    },
                  }),
                };
              }}
            >
              <Stack
                spacing={1}
                sx={{
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1, sm: 1.25 },
                  textAlign: "center",
                }}
              >
                <Box
                  sx={(theme) => ({
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    backgroundColor: selected
                      ? alpha(theme.palette.primary.main, 0.16)
                      : alpha(theme.palette.text.primary, 0.06),
                    color: selected ? "primary.main" : "text.secondary",
                  })}
                >
                  <Icon fontSize="small" />
                </Box>

                <Typography
                  variant="caption"
                  fontWeight={700}
                  noWrap
                  sx={{
                    lineHeight: 1.2,
                    width: "100%",
                    fontSize: { xs: "0.72rem", sm: "0.8rem" },
                    letterSpacing: 0.1,
                  }}
                >
                  {getLabel(concept)}
                </Typography>

                {disabled && (
                  <Chip
                    size="small"
                    icon={<LockRoundedIcon sx={{ fontSize: "0.9rem !important" }} />}
                    label="Utilisé"
                    variant="outlined"
                    sx={{
                      mt: 0.25,
                      height: 20,
                      fontWeight: 600,
                      color: "text.secondary",
                      borderColor: (theme) => alpha(theme.palette.text.primary, 0.18),
                      backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.35),
                      "& .MuiChip-label": { px: 0.8, fontSize: "0.68rem", lineHeight: 1 },
                    }}
                  />
                )}
              </Stack>
            </Paper>
          );
        })}

        <Paper
          component="button"
          type="button"
          onClick={() => onChange(null)}
          sx={(theme) => {
            const ring = alpha(theme.palette.primary.main, 0.65);
            const ringHalo = alpha(theme.palette.primary.main, 0.1);
            const isSelected = value == null;
            return {
              ...(glassCard(theme) as object),
              aspectRatio: "1 / 1",
              cursor: "pointer",
              ...(isSelected && {
                borderColor: ring,
                background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.35)})`,
                boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(theme.palette.primary.main, 0.25)}`,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  boxShadow: `0 0 0 8px ${ringHalo}`,
                  pointerEvents: "none",
                },
              }),
            };
          }}
        >
          <Stack
            spacing={1}
            sx={{
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 1, sm: 1.25 },
              textAlign: "center",
            }}
          >
            <Box
              sx={(theme) => ({
                width: { xs: 30, sm: 34 },
                height: { xs: 30, sm: 34 },
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                backgroundColor:
                  value == null
                    ? alpha(theme.palette.primary.main, 0.16)
                    : alpha(theme.palette.text.primary, 0.06),
                color: value == null ? "primary.main" : "text.secondary",
              })}
            >
              <ExtensionRoundedIcon fontSize="small" />
            </Box>

            <Typography
              variant="caption"
              fontWeight={700}
              noWrap
              sx={{
                lineHeight: 1.2,
                width: "100%",
                fontSize: { xs: "0.72rem", sm: "0.8rem" },
                letterSpacing: 0.1,
              }}
            >
              Attribut personnalisé
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.1, fontSize: "0.68rem" }}
            >
              Hors concepts standards
            </Typography>
          </Stack>
        </Paper>
      </Box>

      {value != null && (
        <FormHelperText sx={{ mx: 0 }}>
          {getDescription(options.find((x) => x.id === value) ?? null) ??
            "Ce concept aide l’app à proposer une configuration cohérente."}
        </FormHelperText>
      )}

      {value == null && (
        <FormHelperText sx={{ mx: 0 }}>
          À utiliser seulement si cet attribut ne correspond à aucun concept standard.
        </FormHelperText>
      )}
    </Stack>
  );
}