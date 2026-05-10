import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Box, Button, Stack, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";

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
  const noneConstraint: AttributeCreateFormInput["constraintPayload"] = { kind: "NONE" };
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

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
        <Button
          type="button"
          variant={rangeMode === "NONE" ? "contained" : "outlined"}
          startIcon={<NumbersRoundedIcon fontSize="small" />}
          onClick={() => setRangeMode("NONE")}
        >
          Nombre libre
        </Button>

        <Button
          type="button"
          variant={rangeMode === "RANGE" ? "contained" : "outlined"}
          startIcon={<TuneRoundedIcon fontSize="small" />}
          onClick={() => setRangeMode("RANGE")}
        >
          Limiter la plage
        </Button>
      </Stack>

      {rangeMode === "RANGE" && (
        <Box
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2.5,
            p: 1.5,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Controller
              name={"constraintPayload.min" as never}
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
              name={"constraintPayload.max" as never}
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
        </Box>
      )}
    </Stack>
  );
}
