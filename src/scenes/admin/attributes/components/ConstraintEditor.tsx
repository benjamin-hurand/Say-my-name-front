import { useMemo } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import { attributeCreateSchema } from "../validation/attributeSchemas";
import { AttributeType, CONSTRAINT_KINDS } from "../../../../models/commons/Attribute/Attribute";


// Types dérivés du schéma Zod (cohérents avec AttributeFormDrawer)
type FormInput = z.input<typeof attributeCreateSchema>;

export default function ConstraintEditor({
  control,
  watch,
  errors,
}: {
  control: Control<FormInput>;
  watch: UseFormWatch<FormInput>;
  errors: FieldErrors<FormInput>;
}) {
  const type = watch("type");
  const kind = watch("constraintKind");

  const hint = useMemo(() => {
    if (type === "EMAIL") return "Astuce: utilisez REGEX pour imposer un pattern email";
    if (type === "URL") return "Astuce: REGEX (pattern) ou limites de longueur peuvent aider";
    if (type === "ENUM") return "Astuce: utilisez les options ENUM (allowInactive/storeCode) selon vos besoins";
    return undefined;
  }, [type]);

  // Rend les champs min/max correctement selon le type d'attribut
  const renderRangeInputs = (t: AttributeType | undefined) => {
    const isDate = t === "DATE";
    const isDateTime = t === "DATETIME";
    const isNumber = t === "NUMBER";

    const commonProps = { sx: { mt: 1 }, fullWidth: true } as const;

    return (
      <>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
          <Controller
            name="constraintPayload.min"
            control={control}
            render={({ field }) => (
              <TextField
                label="Min"
                {...commonProps}
                type={isNumber ? "number" : isDate ? "date" : isDateTime ? "datetime-local" : "text"}
                InputLabelProps={{ shrink: isDate || isDateTime ? true : undefined }}
                {...field}
              />
            )}
          />
          <Controller
            name="constraintPayload.max"
            control={control}
            render={({ field }) => (
              <TextField
                label="Max"
                {...commonProps}
                type={isNumber ? "number" : isDate ? "date" : isDateTime ? "datetime-local" : "text"}
                InputLabelProps={{ shrink: isDate || isDateTime ? true : undefined }}
                {...field}
              />
            )}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems="center" sx={{ mt: 1 }}>
          <Controller
            name="constraintPayload.step"
            control={control}
            render={({ field }) => (
              <TextField label="Step (optionnel)" type="number" sx={{ minWidth: 220 }} {...field} />
            )}
          />
          <Controller
            name="constraintPayload.inclusive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={!!field.value} onChange={(_, v) => field.onChange(v)} />}
                label="Bornes inclusives"
              />
            )}
          />
        </Stack>
      </>
    );
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }}>
        <Controller
          name="constraintKind"
          control={control}
          render={({ field }) => (
            <TextField select label="Constraint kind" sx={{ minWidth: 220 }} {...field}>
              {CONSTRAINT_KINDS.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {hint && <Chip size="small" label={hint} />}
      </Stack>

      {/* Payloads dynamiques alignés avec le domaine */}

      {kind === "SET" && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }} alignItems="center">
          <Controller
            name="constraintPayload.values"
            control={control}
            render={({ field }) => {
              const value = Array.isArray(field.value) ? field.value : [];
              return (
                <TextField
                  label="Valeurs (séparées par des virgules)"
                  placeholder="ex: Alice,Bob,Charlie"
                  value={value.join(",")}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean)
                    )
                  }
                  fullWidth
                />
              );
            }}
          />
          <Controller
            name="constraintPayload.strict"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={!!field.value} onChange={(_, v) => field.onChange(v)} />}
                label="Strict (interdit valeurs hors liste)"
              />
            )}
          />
        </Stack>
      )}

      {kind === "RANGE" && renderRangeInputs(type)}

      {kind === "REGEX" && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
            <Controller
              name="constraintPayload.pattern"
              control={control}
              render={({ field }) => (
                <TextField label="Pattern (regex)" placeholder="^.+$" fullWidth {...field} />
              )}
            />
            <Controller
              name="constraintPayload.caseInsensitive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={!!field.value} onChange={(_, v) => field.onChange(v)} />}
                  label="Case-insensitive"
                />
              )}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
            <Controller
              name="constraintPayload.minLength"
              control={control}
              render={({ field }) => <TextField type="number" label="Min length" {...field} />}
            />
            <Controller
              name="constraintPayload.maxLength"
              control={control}
              render={({ field }) => <TextField type="number" label="Max length" {...field} />}
            />
          </Stack>
        </>
      )}

      {kind === "ENUM" && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }} alignItems="center">
          <Controller
            name="constraintPayload.allowInactive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={!!field.value} onChange={(_, v) => field.onChange(v)} />}
                label="Autoriser options inactives"
              />
            )}
          />
          <Controller
            name="constraintPayload.storeCode"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={!!field.value} onChange={(_, v) => field.onChange(v)} />}
                label="Stocker le code plutôt que le label"
              />
            )}
          />
        </Stack>
      )}
    </Box>
  );
}
