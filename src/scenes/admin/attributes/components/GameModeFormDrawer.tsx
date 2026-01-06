import { useMemo, useEffect } from "react";
import {
  Box,
  Drawer,
  Toolbar,
  TextField,
  MenuItem,
  Stack,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { useOrgData } from "../../../../contexts/OrgDataContext";
import type { GameMode } from "../../../../models/commons/Game/GameMode/GameMode.model";
import {
  updateAdminGameMode,
  createAdminGameMode,
} from "../../../../services/business/admin/admin.gameModes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";

interface FormData {
  title: string;
  description?: string | null;
  operator: "AND" | "OR";
  attributeIds: number[]; // ordre important
}

// Helpers robustes pour extraire les IDs d'attributs et la map assocId -> attributeId
function extractAttributeIdsFromInitial(initial?: GameMode): number[] {
  if (!initial?.attributes) return [];
  const ids: number[] = [];
  for (const a of initial.attributes as any[]) {
    // supporte { attribute: { id } } ou { attributeId }
    const attrId =
      (a?.attribute && typeof a.attribute.id === "number" && a.attribute.id) ||
      (typeof a?.attributeId === "number" && a.attributeId) ||
      null;
    if (attrId != null) ids.push(attrId);
  }
  return ids;
}

function buildAssocIdByAttrId(initial?: GameMode): Map<number, number> {
  const m = new Map<number, number>();
  if (!initial?.attributes) return m;
  for (const a of initial.attributes as any[]) {
    const assocId = typeof a?.id === "number" ? a.id : undefined;
    const attrId =
      (a?.attribute && typeof a.attribute.id === "number" && a.attribute.id) ||
      (typeof a?.attributeId === "number" && a.attributeId) ||
      null;
    if (assocId != null && attrId != null) m.set(attrId, assocId);
  }
  return m;
}

export default function GameModeFormDrawer({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial?: GameMode;
  onClose: (changed: boolean) => void;
}) {
  const isEdit = Boolean(initial?.id);

  // ⚙️ Attributs globaux (déjà chargés au login)
  const { attributes: globalAttributes } = useOrgData();

  // Liste plate id/nom pour l'UI
  const allAttributes = useMemo(
    () => (globalAttributes ?? []).map((a) => ({ id: a.id, name: a.name })),
    [globalAttributes]
  );

  const assocIdByAttrId = useMemo(() => buildAssocIdByAttrId(initial), [initial]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset, // ← on va s’en servir pour préremplir à chaque ouverture/édition
    formState: { isSubmitting, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      operator: (initial?.operator as FormData["operator"]) ?? "AND",
      attributeIds: extractAttributeIdsFromInitial(initial),
    },
  });

  // 🔁 IMPORTANT : quand `open` ou `initial` changent, on pré-remplit à nouveau
  useEffect(() => {
    if (!open) return;
    reset({
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      operator: (initial?.operator as FormData["operator"]) ?? "AND",
      attributeIds: extractAttributeIdsFromInitial(initial),
    });
  }, [open, initial, reset]);

  // sélection courante
  const selected = watch("attributeIds") ?? [];

  const remaining = useMemo(
    () => allAttributes.filter((a) => !selected.includes(a.id)),
    [allAttributes, selected]
  );

  const move = (index: number, dir: -1 | 1) => {
    const prev = watch("attributeIds") ?? [];
    const j = index + dir;
    if (j < 0 || j >= prev.length) return;
    const next = [...prev];
    [next[index], next[j]] = [next[j], next[index]];
    setValue("attributeIds", next, { shouldDirty: true });
  };

  const remove = (id: number) => {
    const prev = watch("attributeIds") ?? [];
    setValue(
      "attributeIds",
      prev.filter((x) => x !== id),
      { shouldDirty: true }
    );
  };

  const add = (id: number) => {
    const prev = watch("attributeIds") ?? [];
    if (prev.includes(id)) return;
    setValue("attributeIds", [...prev, id], { shouldDirty: true });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!data.title.trim()) {
      notifyError("Le titre est requis");
      return;
    }
    if (!data.attributeIds.length) {
      notifyError("Sélectionne au moins un attribut");
      return;
    }

    // Payload minimal attendu par l’API admin
    const attributes = data.attributeIds.map((attributeId) => ({
      id: assocIdByAttrId.get(attributeId), // undefined pour les nouvelles associations
      attributeId,
    }));

    try {
      if (isEdit && initial) {
        await updateAdminGameMode(initial.id, {
          id: initial.id,
          title: data.title,
          description: data.description ?? null,
          operator: data.operator,
          attributes,
        });
        notifySuccess("Game Mode mis à jour");
      } else {
        await createAdminGameMode({
          title: data.title,
          description: data.description ?? null,
          operator: data.operator,
          attributes,
        });
        notifySuccess("Game Mode créé");
      }
      onClose(true);
    } catch (e: any) {
      notifyError(e?.message || "Erreur d’enregistrement");
    }
  };

  const handleClose = () => {
    if (isDirty && !confirm("Des modifications non enregistrées vont être perdues. Fermer ?")) {
      return;
    }
    onClose(false);
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor="right"
      PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}
      ModalProps={{ keepMounted: true }} // ← garde monté : d’où l’importance de reset()
    >
      <Toolbar />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} p={2} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Titre"
          {...register("title", { required: true })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Description"
          multiline
          minRows={2}
          {...register("description")}
          InputLabelProps={{ shrink: true }}
        />

        <Controller
          name="operator"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              select
              label="Opérateur"
              {...field}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="AND">AND</MenuItem>
              <MenuItem value="OR">OR</MenuItem>
            </TextField>
          )}
        />

        {/* Picker simple: disponibles vs sélectionnés (ordonnables) */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2}>
          <Box sx={{ flex: 1 }}>
            <strong>Disponibles</strong>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {remaining.map((a) => (
                <Chip key={a.id} label={a.name} onClick={() => add(a.id)} />
              ))}
            </Stack>
          </Box>

          <Box sx={{ flex: 1 }}>
            <strong>Sélectionnés (ordre)</strong>
            <Stack gap={1} sx={{ mt: 1 }}>
              {selected.map((id, idx) => {
                const a = allAttributes.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <Stack key={id} direction="row" alignItems="center" gap={1}>
                    <Chip label={a.name} sx={{ flex: 1 }} />
                    <IconButton size="small" onClick={() => move(idx, -1)}>
                      <ArrowUpwardRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => move(idx, +1)}>
                      <ArrowDownwardRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => remove(id)}>
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button onClick={handleClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
