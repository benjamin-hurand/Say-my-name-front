import { Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useRef } from "react";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";

type Props = {
  control: Control<AttributeCreateFormInput>;
};

export default function AttributeCardinalityControl({ control }: Props) {
  const { t } = useTranslation();
  const lastMultipleValueRef = useRef(2);

  return (
    <Controller
      name="maxValues"
      control={control}
      render={({ field, fieldState }) => {
        const maxValues = Number(field.value) || 1;
        const mode = maxValues > 1 ? "multiple" : "single";

        if (maxValues > 1) {
          lastMultipleValueRef.current = maxValues;
        }

        return (
          <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_, nextMode: "single" | "multiple" | null) => {
                if (!nextMode || nextMode === mode) return;
                field.onChange(
                  nextMode === "single" ? 1 : Math.max(2, lastMultipleValueRef.current),
                );
              }}
              aria-label={t("ATTRIBUTE_FORM.CARDINALITY.GROUP_ARIA", {
                defaultValue: "Nombre de valeurs autorisées",
              })}
              sx={{
                alignSelf: "flex-start",
                "& .MuiToggleButton-root": {
                  minWidth: 112,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <ToggleButton value="single">
                {t("ATTRIBUTE_FORM.CARDINALITY.SINGLE", { defaultValue: "Une seule" })}
              </ToggleButton>
              <ToggleButton value="multiple">
                {t("ATTRIBUTE_FORM.CARDINALITY.MULTIPLE", { defaultValue: "Plusieurs" })}
              </ToggleButton>
            </ToggleButtonGroup>

            {mode === "multiple" ? (
              <TextField
                label={t("ATTRIBUTE_FORM.CARDINALITY.MAX_LABEL", {
                  defaultValue: "Nombre maximum",
                })}
                type="number"
                size="small"
                value={maxValues}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  field.onChange(Number.isFinite(next) ? Math.max(2, next) : 2);
                }}
                inputProps={{
                  min: 2,
                  "aria-label": t("ATTRIBUTE_FORM.CARDINALITY.MAX_ARIA", {
                    defaultValue: "Nombre maximal de valeurs",
                  }),
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ width: 140 }}
              />
            ) : null}
          </Stack>
        );
      }}
    />
  );
}
