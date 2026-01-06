import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  Switch,
  TextField,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

import ConstraintEditor from "./ConstraintEditor";

// ✅ Schéma Zod aligné domaine (importe les enums depuis le modèle)
import { attributeCreateSchema } from "../validation/attributeCreate.schema";

// ✅ Modèle domaine + constantes canoniques
import {
  Attribute,
  ATTRIBUTE_TYPES,
  CASING_STRATEGIES,
  EDIT_POLICIES,
} from "../../../../models/commons/Attribute/Attribute";

// ✅ DTOs d'écriture (externes au service)
import type {
  CreateAttributePayload,
  UpdateAttributePayload,
} from "../../../../models/commons/Attribute/Attribute.dto";

// ✅ Services admin (writes)
import {
  createAdminAttribute,
  updateAdminAttribute,
} from "../../../../services/business/admin/admin.attributes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";

type FormInput = z.input<typeof attributeCreateSchema>;
type FormOutput = z.output<typeof attributeCreateSchema>;

export default function AttributeFormDrawer({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial?: Attribute;
  onClose: (changed: boolean) => void;
}) {
  const isEdit = Boolean(initial?.id);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(attributeCreateSchema),
    defaultValues: initial
      ? {
          name: initial.name ?? "",
          type: (initial.type ?? "TEXT") as FormInput["type"],
          casingStrategy: (initial.casingStrategy ?? "NONE") as FormInput["casingStrategy"],
          maxValues: (initial.maxValues ?? 1) as number,

          primaryField: !!initial.primaryField,
          category: !!initial.category,
          filter: !!initial.filter,
          sort: !!initial.sort,
          required: !!initial.required,
          initializable: !!initial.initializable,

          editPolicy: (initial.editPolicy ?? "FREE") as FormInput["editPolicy"],
          constraintKind: (initial.constraintKind ?? "NONE") as FormInput["constraintKind"],
          constraintPayload:
            initial.constraintPayload ??
            ({ kind: (initial.constraintKind ?? "NONE") as FormInput["constraintKind"] } as FormInput["constraintPayload"]),
        }
      : {
          name: "",
          type: "TEXT",
          casingStrategy: "NONE",
          maxValues: 1,

          primaryField: false,
          category: false,
          filter: false,
          sort: false,
          required: false,
          initializable: false,

          editPolicy: "FREE",
          constraintKind: "NONE",
          constraintPayload: { kind: "NONE" },
        },
  });

  // Reset le form quand on ouvre sur une autre "initial"
  useEffect(() => {
    if (open) {
      if (initial) {
        reset({
          name: initial.name ?? "",
          type: (initial.type ?? "TEXT") as FormInput["type"],
          casingStrategy: (initial.casingStrategy ?? "NONE") as FormInput["casingStrategy"],
          maxValues: (initial.maxValues ?? 1) as number,

          primaryField: !!initial.primaryField,
          category: !!initial.category,
          filter: !!initial.filter,
          sort: !!initial.sort,
          required: !!initial.required,
          initializable: !!initial.initializable,

          editPolicy: (initial.editPolicy ?? "FREE") as FormInput["editPolicy"],
          constraintKind: (initial.constraintKind ?? "NONE") as FormInput["constraintKind"],
          constraintPayload:
            initial.constraintPayload ??
            ({ kind: (initial.constraintKind ?? "NONE") as FormInput["constraintKind"] } as FormInput["constraintPayload"]),
        });
      } else {
        reset({
          name: "",
          type: "TEXT",
          casingStrategy: "NONE",
          maxValues: 1,

          primaryField: false,
          category: false,
          filter: false,
          sort: false,
          required: false,
          initializable: false,

          editPolicy: "FREE",
          constraintKind: "NONE",
          constraintPayload: { kind: "NONE" },
        });
      }
    }
  }, [open, initial, reset]);

  // Règle UX : si "category" est ON → "filter" ON (et désactivé dans l'UI)
  const isCategory = watch("category");
  useEffect(() => {
    if (isCategory) setValue("filter", true, { shouldDirty: true });
  }, [isCategory, setValue]);

  const onSubmit: SubmitHandler<FormOutput> = async (data) => {
    try {
      if (isEdit && initial) {
        const effectiveType = (initial.type ?? data.type) as NonNullable<Attribute["type"]>;
        const payload: UpdateAttributePayload = {
          id: initial.id,
          name: data.name,
          displayOrder: initial.displayOrder ?? null,

          primaryField: data.primaryField,
          category: data.category,
          maxValues: data.maxValues,
          filter: data.filter,
          sort: data.sort,
          initializable: data.initializable,
          required: data.required,

          type: effectiveType,
          editPolicy: data.editPolicy,
          casingStrategy: data.casingStrategy,

          constraintKind: data.constraintKind,
          constraintPayload: data.constraintPayload ?? null,
        };
        await updateAdminAttribute(initial.id, payload, { useIfMatch: true });
        notifySuccess("Attribut mis à jour");
      } else {
        const payload: CreateAttributePayload = {
          name: data.name,
          type: data.type,
          casingStrategy: data.casingStrategy,
          maxValues: data.maxValues,

          primaryField: data.primaryField,
          category: data.category,
          filter: data.filter,
          sort: data.sort,
          required: data.required,
          initializable: data.initializable,

          editPolicy: data.editPolicy,
          constraintKind: data.constraintKind,
          constraintPayload: data.constraintPayload ?? null,

          displayOrder: undefined,
        };
        await createAdminAttribute(payload);
        notifySuccess("Attribut créé");
      }
      onClose(true);
    } catch (e: any) {
      notifyError(e?.message || "Erreur lors de l’enregistrement");
    }
  };

  const handleClose = () => {
    if (isDirty && !confirm("Des modifications non enregistrées vont être perdues. Fermer ?")) {
      return;
    }
    onClose(false);
  };

  const isEditTypeLocked = isEdit; // type non modifiable en édition

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { overflow: "hidden" } }}
    >
      <DialogTitle>{isEdit ? "Modifier l’attribut" : "Nouvel attribut"}</DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "grid", gap: 2, mt: 0.5 }}
        >
          <TextField
            label="Nom"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField select label="Type" {...field} disabled={isEditTypeLocked}>
                {ATTRIBUTE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {isEditTypeLocked && (
            <FormHelperText sx={{ mt: -1 }}>
              Le type n’est pas modifiable en édition.
            </FormHelperText>
          )}

          <Controller
            name="casingStrategy"
            control={control}
            render={({ field }) => (
              <TextField select label="Casing" {...field}>
                {CASING_STRATEGIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            type="number"
            label="Max values (0 = ∞)"
            {...register("maxValues", { valueAsNumber: true })}
            error={!!errors.maxValues}
            helperText={errors.maxValues?.message}
          />

          <Stack direction="row" gap={2} flexWrap="wrap">
            <FormControlLabel
              control={
                <Controller
                  name="primaryField"
                  control={control}
                  render={({ field }) => <Switch {...field} checked={!!field.value} />}
                />
              }
              label="Primary"
            />
            <FormControlLabel
              control={
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => <Switch {...field} checked={!!field.value} />}
                />
              }
              label="Category"
            />
            <FormControlLabel
              control={
                <Controller
                  name="filter"
                  control={control}
                  render={({ field }) => (
                    <Switch {...field} checked={!!field.value} disabled={!!watch("category")} />
                  )}
                />
              }
              label="Filterable"
            />
            <FormControlLabel
              control={
                <Controller
                  name="sort"
                  control={control}
                  render={({ field }) => <Switch {...field} checked={!!field.value} />}
                />
              }
              label="Sortable"
            />
            <FormControlLabel
              control={
                <Controller
                  name="required"
                  control={control}
                  render={({ field }) => <Switch {...field} checked={!!field.value} />}
                />
              }
              label="Required"
            />
            <FormControlLabel
              control={
                <Controller
                  name="initializable"
                  control={control}
                  render={({ field }) => <Switch {...field} checked={!!field.value} />}
                />
              }
              label="Initializable"
            />
          </Stack>

          <Controller
            name="editPolicy"
            control={control}
            render={({ field }) => (
              <TextField select label="Edit policy" {...field}>
                {EDIT_POLICIES.map((e) => (
                  <MenuItem key={e} value={e}>
                    {e}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Éditeur contextuel (RANGE / REGEX / ENUM / SET) */}
          <ConstraintEditor control={control} watch={watch} errors={errors} />

          {/* Boutons dans DialogActions pour cohérence visuelle */}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>
          {isEdit ? "Enregistrer" : "Créer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
