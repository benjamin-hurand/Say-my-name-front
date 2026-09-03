import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller } from "react-hook-form";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  label: string;
  placeholder?: string;
  errorMessage?: string;
};

function normalizeEnumValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;

    const dedupeKey = value.toLocaleLowerCase();
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    result.push(value);
  }

  return result;
}

export default function EnumValuesForm({
  control,
  label,
  placeholder,
  errorMessage,
}: Props) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");

  return (
    <Controller
      name="enumOptions"
      control={control}
      render={({ field }) => {
        const fieldValue = normalizeEnumValues(Array.isArray(field.value) ? field.value : []);

        const addValue = () => {
          const value = inputValue.trim();
          if (!value) return;

          field.onChange(normalizeEnumValues([...fieldValue, value]));
          setInputValue("");
        };

        const removeValue = (valueToRemove: string) => {
          field.onChange(fieldValue.filter((value) => value !== valueToRemove));
        };

        return (
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
            >
              <TextField
                label={label}
                placeholder={placeholder ?? "Ex. Marketing"}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addValue();
                  }
                }}
                fullWidth
              />

              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={addValue}
                disabled={!inputValue.trim()}
                sx={{
                  minWidth: { sm: 132 },
                  height: { sm: 56 },
                  alignSelf: { xs: "stretch", sm: "auto" },
                }}
              >
                {t("ATTRIBUTE_FORM.ENUM_ADD", { defaultValue: "Ajouter" })}
              </Button>
            </Stack>

            {fieldValue.length > 0 ? (
              <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
                {fieldValue.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => removeValue(option)}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("ATTRIBUTE_FORM.ENUM_EMPTY", { defaultValue: "Aucune option ajoutée" })}
              </Typography>
            )}

            {errorMessage ? (
              <Typography variant="caption" color="error">
                {errorMessage}
              </Typography>
            ) : null}
          </Stack>
        );
      }}
    />
  );
}
