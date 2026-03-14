import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Box, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { glassCard } from "../../../../../../styles/glassStyles";
import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
};

type RangeMode = "NONE" | "RANGE";

type ChoiceCardProps = {
  selected: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
  icon: React.ReactNode;
};

function ChoiceCard({ selected, title, subtitle, onClick, icon }: ChoiceCardProps) {
  return (
    <Paper
      component="button"
      type="button"
      onClick={onClick}
      sx={(theme) => {
        const ring = alpha(theme.palette.primary.main, 0.65);
        const ringHalo = alpha(theme.palette.primary.main, 0.1);

        return {
          ...(glassCard(theme) as object),
          position: "relative",
          p: 1.5,
          minHeight: 108,
          textAlign: "left",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            borderColor: alpha(theme.palette.primary.main, 0.35),
          },
          ...(selected && {
            borderColor: ring,
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(
              theme.palette.background.paper,
              0.35,
            )})`,
            boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(
              theme.palette.primary.main,
              0.22,
            )}`,
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
      <Stack spacing={1}>
        <Box
          sx={(theme) => ({
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            backgroundColor: selected
              ? alpha(theme.palette.primary.main, 0.16)
              : alpha(theme.palette.text.primary, 0.06),
            color: selected ? "primary.main" : "text.secondary",
          })}
        >
          {icon}
        </Box>

        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
          {subtitle}
        </Typography>
      </Stack>
    </Paper>
  );
}

function toNullableNumber(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function NumberRangeForm({ control, watch, setValue }: Props) {
  const kind = watch("constraintKind");
  const rangeMode: RangeMode = kind === "RANGE" ? "RANGE" : "NONE";

  const setRangeMode = (next: RangeMode) => {
    if (next === "NONE") {
      setValue("constraintKind", "NONE", { shouldDirty: true });
      setValue("constraintPayload", { kind: "NONE" } as any, { shouldDirty: true });
      return;
    }

    setValue("constraintKind", "RANGE", { shouldDirty: true });
    setValue(
      "constraintPayload",
      {
        kind: "RANGE",
        min: null,
        max: null,
        inclusive: true,
      } as any,
      { shouldDirty: true },
    );
  };

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 1.25,
        }}
      >
        <ChoiceCard
          selected={rangeMode === "NONE"}
          title="Nombre libre"
          subtitle="Aucune limite particulière"
          onClick={() => setRangeMode("NONE")}
          icon={<NumbersRoundedIcon fontSize="small" />}
        />

        <ChoiceCard
          selected={rangeMode === "RANGE"}
          title="Limiter à une plage"
          subtitle="Définir une valeur minimale, maximale, ou les deux"
          onClick={() => setRangeMode("RANGE")}
          icon={<TuneRoundedIcon fontSize="small" />}
        />
      </Box>

      {rangeMode === "RANGE" && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <Controller
            name={"constraintPayload.min" as any}
            control={control}
            render={({ field }) => (
              <TextField
                label="Valeur minimale"
                type="number"
                fullWidth
                value={field.value ?? ""}
                onChange={(event) => field.onChange(toNullableNumber(event.target.value))}
              />
            )}
          />

          <Controller
            name={"constraintPayload.max" as any}
            control={control}
            render={({ field }) => (
              <TextField
                label="Valeur maximale"
                type="number"
                fullWidth
                value={field.value ?? ""}
                onChange={(event) => field.onChange(toNullableNumber(event.target.value))}
              />
            )}
          />
        </Stack>
      )}
    </Stack>
  );
}