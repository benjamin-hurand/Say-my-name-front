import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Box, Stack } from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/fr";
import { Controller } from "react-hook-form";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";
import ChoiceCard from "../shared/ChoiceCard";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
};

type RangeMode = "NONE" | "RANGE";

function toDayjsValue(value: unknown): Dayjs | null {
  if (!value || typeof value !== "string") return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function toFormValue(value: Dayjs | null, isDateTime: boolean): string | null {
  if (!value) return null;
  return isDateTime
    ? value.format("YYYY-MM-DDTHH:mm")
    : value.format("YYYY-MM-DD");
}

export default function DateRangeForm({ control, watch, setValue }: Props) {
  const kind = watch("constraintKind");
  const type = watch("type");

  const isDateTime = type === "DATETIME";
  const rangeMode: RangeMode = kind === "RANGE" ? "RANGE" : "NONE";

  const noneConstraint: AttributeCreateFormInput["constraintPayload"] = {
    kind: "NONE",
  };

  const rangeConstraint: AttributeCreateFormInput["constraintPayload"] = {
    kind: "RANGE",
    min: null,
    max: null,
    inclusive: true,
  };

  const setRangeMode = (next: RangeMode) => {
    if (next === "NONE") {
      setValue("constraintKind", "NONE", { shouldDirty: true });
      setValue("constraintPayload", noneConstraint, { shouldDirty: true });
      return;
    }

    setValue("constraintKind", "RANGE", { shouldDirty: true });
    setValue("constraintPayload", rangeConstraint, { shouldDirty: true });
  };

  const freeTitle = isDateTime ? "Tous les moments" : "Toutes les dates";
  const minLabel = isDateTime ? "Début" : "Date la plus ancienne";
  const maxLabel = isDateTime ? "Fin" : "Date la plus récente";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <Stack spacing={1.5}>
        {/* Choix du mode */}
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
            subtitle="Aucune limite particulière"
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

        {/* Inputs */}
        {rangeMode === "RANGE" && (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2.5,
              p: 1.5,
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} gap={1.25}>
              <Controller
                name={"constraintPayload.min" as never}
                control={control}
                render={({ field }) =>
                  isDateTime ? (
                    <DateTimePicker
                      label={minLabel}
                      value={toDayjsValue(field.value)}
                      onChange={(value) =>
                        field.onChange(toFormValue(value, true))
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  ) : (
                    <DatePicker
                      label={minLabel}
                      value={toDayjsValue(field.value)}
                      onChange={(value) =>
                        field.onChange(toFormValue(value, false))
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  )
                }
              />

              <Controller
                name={"constraintPayload.max" as never}
                control={control}
                render={({ field }) =>
                  isDateTime ? (
                    <DateTimePicker
                      label={maxLabel}
                      value={toDayjsValue(field.value)}
                      onChange={(value) =>
                        field.onChange(toFormValue(value, true))
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  ) : (
                    <DatePicker
                      label={maxLabel}
                      value={toDayjsValue(field.value)}
                      onChange={(value) =>
                        field.onChange(toFormValue(value, false))
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  )
                }
              />
            </Stack>
          </Box>
        )}
      </Stack>
    </LocalizationProvider>
  );
}