import AddRoundedIcon from "@mui/icons-material/AddRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { glassCard } from "../../../../../../styles/glassStyles";
import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  label: string;
  placeholder?: string;
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

function splitBulkValues(input: string): string[] {
  return input
    .split(/[\n,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EnumValuesForm({
  control,
  watch,
  setValue,
  label,
  placeholder,
}: Props) {
  const kind = watch("constraintKind");
  const values = watch("constraintPayload.values" as any);

  const normalizedValues = useMemo(
    () => normalizeEnumValues(Array.isArray(values) ? values : []),
    [values],
  );

  const [singleValueInput, setSingleValueInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    if (kind !== "SET") {
      setValue("constraintKind", "SET", { shouldDirty: true });
    }

    setValue(
      "constraintPayload",
      {
        kind: "SET",
        values: normalizedValues,
        strict: true,
      } as any,
      { shouldDirty: true },
    );
  }, [kind, normalizedValues, setValue]);

  return (
    <Controller
      name={"constraintPayload.values" as any}
      control={control}
      render={({ field }) => {
        const fieldValue = normalizeEnumValues(Array.isArray(field.value) ? field.value : []);

        const addSingleValue = () => {
          const value = singleValueInput.trim();
          if (!value) return;

          field.onChange(normalizeEnumValues([...fieldValue, value]));
          setSingleValueInput("");
        };

        const addBulkValues = () => {
          const nextValues = splitBulkValues(bulkInput);
          if (nextValues.length === 0) return;

          field.onChange(normalizeEnumValues([...fieldValue, ...nextValues]));
          setBulkInput("");
          setBulkOpen(false);
        };

        const removeValue = (valueToRemove: string) => {
          field.onChange(fieldValue.filter((value) => value !== valueToRemove));
        };

        return (
          <Stack spacing={1.25}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
            >
              <TextField
                label={label}
                placeholder={placeholder ?? "Ex. Marketing"}
                value={singleValueInput}
                onChange={(event) => setSingleValueInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSingleValue();
                  }
                }}
                fullWidth
              />

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={addSingleValue}
                disabled={!singleValueInput.trim()}
                sx={{
                  minWidth: { sm: 132 },
                  height: { sm: 56 },
                  alignSelf: { xs: "stretch", sm: "auto" },
                }}
              >
                Ajouter
              </Button>
            </Stack>

            <Box>
              <Button
                size="small"
                variant="text"
                onClick={() => setBulkOpen((prev) => !prev)}
                endIcon={
                  <UnfoldMoreRoundedIcon
                    sx={{
                      transform: bulkOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                }
                sx={{ px: 0, minWidth: 0 }}
              >
                {bulkOpen ? "Masquer l’ajout multiple" : "Ajouter plusieurs options"}
              </Button>

              <Collapse in={bulkOpen}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    multiline
                    minRows={4}
                    label="Ajouter plusieurs options"
                    placeholder={`Une option par ligne
Marketing
Produit
RH`}
                    value={bulkInput}
                    onChange={(event) => setBulkInput(event.target.value)}
                    fullWidth
                  />

                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      onClick={addBulkValues}
                      disabled={!bulkInput.trim()}
                    >
                      Ajouter la liste
                    </Button>
                  </Stack>
                </Stack>
              </Collapse>
            </Box>

            <Paper
              sx={(theme) => ({
                ...(glassCard(theme) as object),
                minHeight: 72,
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "flex-start",
                p: fieldValue.length > 0 ? 1 : 1.25,
                borderStyle: fieldValue.length > 0 ? "solid" : "dashed",
                borderColor:
                  fieldValue.length > 0
                    ? alpha(theme.palette.text.primary, 0.08)
                    : alpha(theme.palette.text.primary, 0.14),
                backgroundColor: alpha(theme.palette.text.primary, 0.025),
              })}
            >
              {fieldValue.length > 0 ? (
                fieldValue.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => removeValue(option)}
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ajoute au moins une option.
                </Typography>
              )}
            </Paper>
          </Stack>
        );
      }}
    />
  );
}