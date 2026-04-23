import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Box, Stack, TextField } from "@mui/material";
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