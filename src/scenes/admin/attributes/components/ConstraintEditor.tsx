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
import type { Control, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { z } from "zod";

import { attributeCreateSchema } from "../validation/attributeCreate.schema";
import { ValueType, CONSTRAINT_KINDS } from "../../../../models/commons/Attribute/Attribute";
import type { ConstraintPayload } from "../../../../models/commons/Attribute/constraintPayload.schema";

type FormInput = z.input<typeof attributeCreateSchema>;

type Props = {
  control: Control<FormInput>;
  watch: UseFormWatch<FormInput>;
  errors: FieldErrors<FormInput>;
  setValue: UseFormSetValue<FormInput>;
};

export default function ConstraintEditor({ control, watch, errors, setValue }: Props) {
  const type = watch("type");
  const kind = watch("constraintKind");

  const hint = useMemo(() => {
    if (type === "ENUM") {
      return "Astuce : les options ENUM sont gérées via la section dédiée ci-dessus";
    }
    return undefined;
  }, [type]);

  const renderRangeInputs = (t: ValueType | undefined) => {
    const isDate = t === "DATE";
    const isDateTime = t === "DATETIME";
    const isNumber = t === "NUMBER";

    return (
      <>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
          <Controller
            name="constraintPayload.min"
            control={control}
            render={({ field }) => (
              <TextField
                label="Min"
                fullWidth
                sx={{ mt: 1 }}
                type={
                  isNumber
                    ? "number"
                    : isDate
                    ? "date"
                    : isDateTime
                    ? "datetime-local"
                    : "text"
                }
                InputLabelProps={{ shrink: isDate || isDateTime ? true : undefined }}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
              />
            )}
          />

          <Controller
            name="constraintPayload.max"
            control={control}
            render={({ field }) => (
              <TextField
                label="Max"
                fullWidth
                sx={{ mt: 1 }}
                type={
                  isNumber
                    ? "number"
                    : isDate
                    ? "date"
                    : isDateTime
                    ? "datetime-local"
                    : "text"
                }
                InputLabelProps={{ shrink: isDate || isDateTime ? true : undefined }}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
              />
            )}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems="center" sx={{ mt: 1 }}>
          <Controller
            name="constraintPayload.step"
            control={control}
            render={({ field }) => (
              <TextField
                label="Step (optionnel)"
                type="number"
                sx={{ minWidth: 220 }}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
              />
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
            <TextField
              select
              label="Constraint kind"
              sx={{ minWidth: 220 }}
              value={field.value ?? "NONE"}
              onChange={(e) => {
                const newKind = e.target.value as ConstraintPayload["kind"];
                field.onChange(newKind);
                setValue("constraintPayload", { kind: newKind } as ConstraintPayload, { shouldDirty: true });
              }}
              onBlur={field.onBlur}
              inputRef={field.ref}
              name={field.name}
              error={!!errors.constraintKind}
              helperText={errors.constraintKind?.message as string | undefined}
            >
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

      {kind === "RANGE" && renderRangeInputs(type)}

      {kind === "REGEX" && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
            <Controller
              name="constraintPayload.pattern"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Pattern (regex)"
                  placeholder="^.+$"
                  fullWidth
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  name={field.name}
                />
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
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Min length"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  name={field.name}
                />
              )}
            />

            <Controller
              name="constraintPayload.maxLength"
              control={control}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Max length"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  name={field.name}
                />
              )}
            />
          </Stack>
        </>
      )}

    </Box>
  );
}