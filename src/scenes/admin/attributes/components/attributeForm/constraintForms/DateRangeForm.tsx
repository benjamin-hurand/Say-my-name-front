import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/fr";
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

function toDayjsValue(value: unknown): Dayjs | null {
  if (!value || typeof value !== "string") return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function toFormValue(value: Dayjs | null, isDateTime: boolean): string | null {
  if (!value) return null;
  return isDateTime ? value.format("YYYY-MM-DDTHH:mm") : value.format("YYYY-MM-DD");
}

export default function DateRangeForm({ control, watch, setValue }: Props) {
  const kind = watch("constraintKind");
  const type = watch("type");
  const isDateTime = type === "DATETIME";
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

  const freeTitle = isDateTime ? "Tous les moments" : "Toutes les dates";
  const freeSubtitle = "Aucune limite particulière";

  const minLabel = isDateTime ? "Début" : "Date la plus ancienne";
  const maxLabel = isDateTime ? "Fin" : "Date la plus récente";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
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
            title={freeTitle}
            subtitle={freeSubtitle}
            onClick={() => setRangeMode("NONE")}
            icon={
              isDateTime ? (
                <ScheduleRoundedIcon fontSize="small" />
              ) : (
                <CalendarMonthRoundedIcon fontSize="small" />
              )
            }
          />

          <ChoiceCard
            selected={rangeMode === "RANGE"}
            title="Limiter à une période"
            subtitle="Définir un début, une fin, ou les deux"
            onClick={() => setRangeMode("RANGE")}
            icon={<TuneRoundedIcon fontSize="small" />}
          />
        </Box>

        {rangeMode === "RANGE" && (
          <Stack direction={{ xs: "column", md: "row" }} gap={1.25}>
            <Controller
              name={"constraintPayload.min" as any}
              control={control}
              render={({ field }) =>
                isDateTime ? (
                  <DateTimePicker
                    label={minLabel}
                    value={toDayjsValue(field.value)}
                    onChange={(value) => field.onChange(toFormValue(value, true))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                ) : (
                  <DatePicker
                    label={minLabel}
                    value={toDayjsValue(field.value)}
                    onChange={(value) => field.onChange(toFormValue(value, false))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                )
              }
            />

            <Controller
              name={"constraintPayload.max" as any}
              control={control}
              render={({ field }) =>
                isDateTime ? (
                  <DateTimePicker
                    label={maxLabel}
                    value={toDayjsValue(field.value)}
                    onChange={(value) => field.onChange(toFormValue(value, true))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                ) : (
                  <DatePicker
                    label={maxLabel}
                    value={toDayjsValue(field.value)}
                    onChange={(value) => field.onChange(toFormValue(value, false))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                )
              }
            />
          </Stack>
        )}
      </Stack>
    </LocalizationProvider>
  );
}