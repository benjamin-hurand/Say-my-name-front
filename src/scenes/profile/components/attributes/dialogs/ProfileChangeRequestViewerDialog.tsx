// src/pages/profile/components/attributes/dialogs/ChangeRequestViewerDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  Update as UpdateIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

import { Attribute } from "../../../../../models/commons/Attribute/Attribute";
import { ChangeRequestSummary, ChangeRequestStatus } from "../../../../../models/commons/Profile/ChangeRequest";
import TypedValueInput from "../inputs/TypedValueInput";
import AttributeChipValueItem, { RowStatus as ChipRowStatus } from "../rows/components/AttributeChipValueItem";
import { notifyError, notifySuccess } from "../../../../../services/notification/toast.service";
import { cancelChangeRequest, updateChangeRequest } from "../../../../../services/business/change-requests/change-requests.service";
import { DeletedSection } from "./DeletedSection";

/* =======================
   Props publiques
======================= */
interface Props {
  open: boolean;
  personId: number;
  cr: ChangeRequestSummary | null;
  attr: Attribute | null;
  currentChips: { id: number; value: string }[];
  formatDisplayValue: (type: string | null | undefined, value: string) => string;
  onClose: () => void;
  onResubmitted?: (crId: number) => void;
  onCanceled?: (crId: number) => void;
}

/* =======================
   Types internes (ops)
======================= */
type LocalRowStatus = ChipRowStatus;

type CreateOp = { id: string; kind: "CREATE"; tempId: number; newValue: string };
type UpdateOp = { id: string; kind: "UPDATE"; paId: number; oldValue: string; newValue: string };
type DeleteOp = { id: string; kind: "DELETE"; paId: number; oldValue: string };
type ChangeOp = CreateOp | UpdateOp | DeleteOp;

type CreateOpNoId = Omit<CreateOp, "id">;
type UpdateOpNoId = Omit<UpdateOp, "id">;
type DeleteOpNoId = Omit<DeleteOp, "id">;
type NewChangeOp = CreateOpNoId | UpdateOpNoId | DeleteOpNoId;

/* =======================
   Helpers statut
======================= */
const statusColor = (s: ChangeRequestStatus): "default" | "warning" | "success" | "error" => {
  switch (s) {
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "CANCELED":
    default:
      return "default";
  }
};

const statusLabel = (s: ChangeRequestStatus): string => {
  switch (s) {
    case "PENDING":
      return "En attente";
    case "APPROVED":
      return "Approuvée";
    case "REJECTED":
      return "Refusée";
    case "CANCELED":
      return "Annulée";
    default:
      return s;
  }
};

/* =======================
   Component
======================= */
const ChangeRequestViewerDialog: React.FC<Props> = ({
  open,
  cr,
  attr,
  currentChips,
  formatDisplayValue,
  onClose,
  onResubmitted,
  onCanceled,
}) => {
  const attrId = attr?.id ?? 0;
  const max = Math.max(1, attr?.maxValues ?? 1);
  const required = !!attr?.required;
  const isPending = cr?.status === "PENDING";

  // snapshot initial
  type ChipPA = { id: number; value: string };
  const initialRef = React.useRef<ChipPA[]>([]);

  // lot d’opérations
  const [ops, setOps] = React.useState<ChangeOp[]>([]);
  const addOp = (op: NewChangeOp) => setOps((prev) => [...prev, { ...op, id: crypto.randomUUID() } as ChangeOp]);
  const removeOpsBy = (predicate: (o: ChangeOp) => boolean) =>
    setOps((prev) => prev.filter((o) => !predicate(o)));

  // motif global
  const [globalReason, setGlobalReason] = React.useState<string>(cr?.requestReason ?? "");

  // mode lecture / édition
  const [editMode, setEditMode] = React.useState<boolean>(false);

  // inline edit
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [attrValue, setAttrValue] = React.useState<string>("");
  const [statusByKey, setStatusByKey] = React.useState<Record<string, LocalRowStatus>>({});
  const editInputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (editInputRef.current) editInputRef.current.focus();
  }, [editingKey]);
  const setStatus = (key: string, status: LocalRowStatus) =>
    setStatusByKey((prev) => ({ ...prev, [key]: status }));

  // init à l’ouverture / changement CR
  const tempIdRef = React.useRef<number>(-1);

  React.useEffect(() => {
    if (!open || !cr) return;

    initialRef.current = (currentChips ?? []).map((c) => ({ id: c.id, value: c.value }));

    const newOps: ChangeOp[] = [];
    for (const it of cr.items) {
      if (it.action === "CREATE") {
        const tid = tempIdRef.current--;
        newOps.push({ id: crypto.randomUUID(), kind: "CREATE", tempId: tid, newValue: it.proposedValue ?? "" });
      } else if (it.action === "UPDATE" && it.personAttribute?.id != null) {
        const oldVal = initialRef.current.find((c) => c.id === it.personAttribute?.id)?.value ?? "";
        newOps.push({
          id: crypto.randomUUID(),
          kind: "UPDATE",
          paId: it.personAttribute.id,
          oldValue: oldVal,
          newValue: it.proposedValue ?? "",
        });
      } else if (it.action === "DELETE" && it.personAttribute?.id != null) {
        const oldVal = initialRef.current.find((c) => c.id === it.personAttribute?.id)?.value ?? "";
        newOps.push({ id: crypto.randomUUID(), kind: "DELETE", paId: it.personAttribute?.id, oldValue: oldVal });
      }
    }
    setOps(newOps);
    setGlobalReason(cr.requestReason ?? "");
    setEditMode(false);
    setEditingKey(null);
    setAttrValue("");
    setStatusByKey({});
  }, [open, cr, currentChips]);

  // working chips
  const workingChips = React.useMemo<ChipPA[]>(() => {
    const byId = new Map<number, string>();
    for (const c of initialRef.current) byId.set(c.id, c.value);
    for (const o of ops) {
      if (o.kind === "DELETE") byId.delete(o.paId);
      else if (o.kind === "UPDATE") byId.set(o.paId, o.newValue);
      else if (o.kind === "CREATE") byId.set(o.tempId, o.newValue);
    }
    return Array.from(byId.entries()).map(([id, value]) => ({ id, value }));
  }, [ops]);

  // index / markers
  const createMap = React.useMemo(() => {
    const m = new Map<number, CreateOp>();
    ops.forEach((o) => {
      if (o.kind === "CREATE") m.set(o.tempId, o);
    });
    return m;
  }, [ops]);

  const updateSet = React.useMemo(() => {
    const s = new Set<number>();
    ops.forEach((o) => {
      if (o.kind === "UPDATE") s.add(o.paId);
    });
    return s;
  }, [ops]);

  const deletedList = React.useMemo(() => {
    return ops
      .filter((o): o is DeleteOp => o.kind === "DELETE")
      .map((o) => ({ id: o.paId, value: o.oldValue }));
  }, [ops]);

  const count = workingChips.length;
  const canAddMore = count < max;

  // normalisation
  const norm = (s: string) => (s ?? "").trim().replace(/\s+/g, " ");
  const same = (a?: string, b?: string) => norm(a ?? "") === norm(b ?? "");

  // === Helpers "undo delete si même valeur" ===
  const findIndexOfDeleteByValue = React.useCallback(
    (value: string) =>
      ops.findIndex((o) => o.kind === "DELETE" && same((o as DeleteOp).oldValue, value)),
    [ops]
  );

  const undoOneDeleteByValue = React.useCallback((value: string) => {
    setOps((prev) => {
      const idx = prev.findIndex((o) => o.kind === "DELETE" && same((o as DeleteOp).oldValue, value));
      if (idx < 0) return prev;
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  }, []);

  // inline edit handlers
  const startEditChip = (id: number, currentValue: string) => {
    if (!editMode) return;
    setEditingKey(`pa-${id}`);
    setAttrValue(currentValue);
    setStatus(`pa-${id}`, "idle");
  };

  const cancelInlineEdit = () => {
    setEditingKey(null);
    setAttrValue("");
  };

  const confirmUpdate = (paId: number, newValue: string) => {
    if (!editMode) return;

    // 1) Si une suppression existe avec la même valeur cible, on annule cette suppression
    //    et on N'APPLIQUE PAS l'update courant.
    console.log("confirmUpdate: looking for undo delete of", newValue);
    console.log("ops:", ops);
    const deletedIdx = findIndexOfDeleteByValue(newValue);
    if (deletedIdx >= 0) {
      // - retirer la DeleteOp correspondante
      setOps((prev) => {
        const copy = [...prev];

        // supprime la DeleteOp (par valeur)
        const delIdx = copy.findIndex((o) => o.kind === "DELETE" && same((o as DeleteOp).oldValue, newValue));
        if (delIdx >= 0) copy.splice(delIdx, 1);

        // si on éditait un CREATE (tempId == paId), on supprime ce CREATE au lieu d'update
        const createIdx = copy.findIndex((o) => o.kind === "CREATE" && (o as CreateOp).tempId === paId);
        if (createIdx >= 0) {
          copy.splice(createIdx, 1);
          return copy;
        }

        // sinon, on retirera toute éventuelle UPDATE en cours sur ce paId
        const updIdx = copy.findIndex((o) => o.kind === "UPDATE" && (o as UpdateOp).paId === paId);
        if (updIdx >= 0) copy.splice(updIdx, 1);

        return copy;
      });

      cancelInlineEdit();
      return;
    }

    // 2) Comportement normal si pas de "undo delete" à faire
    const initialVal =
      initialRef.current.find((c) => c.id === paId)?.value ??
      workingChips.find((c) => c.id === paId)?.value ??
      "";

    setOps((prev) => {
      const createIdx = prev.findIndex((o) => o.kind === "CREATE" && (o as CreateOp).tempId === paId);
      if (createIdx >= 0) {
        const copy = [...prev] as ChangeOp[];
        const c = copy[createIdx] as CreateOp;
        copy[createIdx] = { ...c, newValue };
        return copy;
      }
      if (same(initialVal, newValue)) {
        return prev.filter((o) => !(o.kind === "UPDATE" && (o as UpdateOp).paId === paId));
      }
      const idx = prev.findIndex((o) => o.kind === "UPDATE" && (o as UpdateOp).paId === paId);
      if (idx >= 0) {
        const copy = [...prev] as ChangeOp[];
        const u = copy[idx] as UpdateOp;
        copy[idx] = { ...u, newValue };
        return copy;
      }
      return [...prev, { kind: "UPDATE", paId, oldValue: initialVal, newValue } as UpdateOp];
    });

    cancelInlineEdit();
  };

  const markDelete = (paId: number) => {
    if (!editMode) return;
    const isTemp = paId < 0;
    if (isTemp) {
      removeOpsBy((o) => o.kind === "CREATE" && (o as CreateOp).tempId === paId);
      return;
    }
    const initialVal = initialRef.current.find((c) => c.id === paId)?.value ?? "";
    setOps((prev) => {
      const noUpdate = prev.filter((o) => !(o.kind === "UPDATE" && (o as UpdateOp).paId === paId));
      const already = noUpdate.some((o) => o.kind === "DELETE" && (o as DeleteOp).paId === paId);
      return already ? noUpdate : [...noUpdate, { kind: "DELETE", paId, oldValue: initialVal } as DeleteOp];
    });
  };

  const undoDelete = (paId: number) => {
    if (!editMode) return;
    setOps((prev) => prev.filter((o) => !(o.kind === "DELETE" && (o as DeleteOp).paId === paId)));
  };

  // ajout
  const addKey = `crv-add-${attrId}`;
  const isAdding = editingKey === addKey;
  const addStatus = (statusByKey[addKey] ?? "idle") as LocalRowStatus;

  const startAdd = () => {
    if (!editMode || !canAddMore) return;
    setEditingKey(addKey);
    setAttrValue("");
    setStatus(addKey, "idle");
  };

  const confirmAdd = (value: string) => {
    if (!editMode) return;
    const v = value ?? "";
    if (!v.trim()) return cancelInlineEdit();

    // 1) Si une suppression existe avec la même valeur cible, on annule la suppression
    //    et on N'AJOUTE PAS de CREATE.
    console.log("confirmAdd: looking for undo delete of", v);
    console.log("ops:", ops);
    const deletedIdx = findIndexOfDeleteByValue(v);
    if (deletedIdx >= 0) {
      undoOneDeleteByValue(v);
      cancelInlineEdit();
      return;
    }

    // 2) Comportement normal si pas de "undo delete" à faire
    const tid = tempIdRef.current--;
    addOp({ kind: "CREATE", tempId: tid, newValue: v });
    cancelInlineEdit();
  };

  // reset depuis la CR
  const handleResetFromCr = () => {
    if (!cr) return;
    initialRef.current = (currentChips ?? []).map((c) => ({ id: c.id, value: c.value }));
    const newOps: ChangeOp[] = [];
    for (const it of cr.items) {
      if (it.action === "CREATE") {
        const tid = tempIdRef.current--;
        newOps.push({ id: crypto.randomUUID(), kind: "CREATE", tempId: tid, newValue: it.proposedValue ?? "" });
      } else if (it.action === "UPDATE" && it.personAttribute != null && it.personAttribute.id != null) {
        const oldVal = initialRef.current.find((c) => c.id === it.personAttribute?.id)?.value ?? "";
        newOps.push({
          id: crypto.randomUUID(),
          kind: "UPDATE",
          paId: it.personAttribute.id,
          oldValue: oldVal,
          newValue: it.proposedValue ?? "",
        });
      } else if (it.action === "DELETE" && it.personAttribute?.id != null) {
        const oldVal = initialRef.current.find((c) => c.id === it.personAttribute?.id)?.value ?? "";
        newOps.push({ id: crypto.randomUUID(), kind: "DELETE", paId: it.personAttribute.id, oldValue: oldVal });
      }
    }
    setOps(newOps);
    setGlobalReason(cr.requestReason ?? "");
    setEditMode(false);
    setEditingKey(null);
    setAttrValue("");
    setStatusByKey({});
  };

  // autosave click hors input
  React.useEffect(() => {
    if (!editingKey) return;

    const isInPickerPopup = (node: Node | null): boolean => {
      let el: Node | null = node;
      while (el && (el as HTMLElement).parentElement) {
        const c = (el as HTMLElement).className || "";
        if (typeof c === "string" && c.includes("MuiPickers")) return true;
        el = (el as HTMLElement).parentElement;
      }
      return false;
    };

    const getEditorRootEl = (): HTMLElement | null => {
      const input = editInputRef.current as unknown as HTMLElement | null;
      if (!input) return null;
      const root =
        input.closest(".MuiFormControl-root") ||
        input.closest(".MuiInputBase-root") ||
        input.parentElement;
      return (root as HTMLElement) ?? null;
    };

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const rootEl = getEditorRootEl();
      if (rootEl && rootEl.contains(target)) return;
      if (isInPickerPopup(target)) return;

      if (editingKey === addKey) {
        confirmAdd(attrValue);
      } else if (editingKey.startsWith("pa-")) {
        const idStr = editingKey.slice(3);
        const paId = Number(idStr);
        if (!Number.isNaN(paId)) confirmUpdate(paId, attrValue);
        else cancelInlineEdit();
      } else {
        cancelInlineEdit();
      }
    };

    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingKey, attrValue, addKey, editMode]);

  // contraintes + envoi
  const hasBlockingError = count > max || (required && count < 1);
  const reasonsDisabled: string[] = [];
  if (hasBlockingError) {
    if (count > max) reasonsDisabled.push(`Nombre maximum atteint (${max})`);
    if (required && count < 1) reasonsDisabled.push("Au moins une valeur requise");
  }
  if (editMode && !globalReason.trim()) reasonsDisabled.push("Motif global requis");

  const handleResubmit = async () => {
    if (!cr || !attrId || hasBlockingError) return;
    try {
      const added = ops.filter((o): o is CreateOp => o.kind === "CREATE").map((o) => ({ value: o.newValue }));
      const updated = ops.filter((o): o is UpdateOp => o.kind === "UPDATE").map((o) => ({ id: o.paId, value: o.newValue }));
      const deleted = ops.filter((o): o is DeleteOp => o.kind === "DELETE").map((o) => ({ id: o.paId }));

      await updateChangeRequest(cr.id, {
        requestReason: globalReason.trim(),
        items: [
          ...added.map((a) => ({ action: "CREATE" as const, attributeId: attrId, proposedValue: a.value })),
          ...updated.map((u) => ({ action: "UPDATE" as const, personAttributeId: u.id, proposedValue: u.value })),
          ...deleted.map((d) => ({ action: "DELETE" as const, personAttributeId: d.id })),
        ],
      });

      notifySuccess("Demande mise à jour.");
      onResubmitted?.(cr.id);
      onClose();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Échec de la mise à jour de la demande.");
    }
  };

  const handleCancelCr = async () => {
    if (!cr) return;
    try {
      await cancelChangeRequest(cr.id);
      notifySuccess("Demande annulée.");
      onCanceled?.(cr.id);
      onClose();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Échec de l’annulation.");
    }
  };

  // ===== UI state pour les chips =====
  // 1) On force le look "édition" en lecture (pour l’homogénéité visuelle)
  const FORCE_EDIT_LOOK = true;
  const rowLooksEditable = editMode || FORCE_EDIT_LOOK;

  // 2) On veut aussi les marqueurs create/update visibles quand on force le look
  const markersVisible = rowLooksEditable;

  // 3) Callbacks no-op pour satisfaire les props requises en lecture
  const NOOP = () => {};
  const NOOP_STR = (_: string) => {};
  const NOOP_NUM_STR = (_: number, __: string) => {};
  const NOOP_START = (_rowKey: string, _attrId: number, _paId: number | null, _current: string) => {};

  // === UI ===
  const titleDate =
    cr?.createdAt
      ? (() => {
          const d = dayjs(cr.createdAt);
          const now = dayjs();
          return d.isValid() ? (d.year() === now.year() ? d.format("DD/MM") : d.format("DD/MM/YYYY")) : "";
        })()
      : "";

  const charLimit = 1024;
  const charCount = globalReason.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* ======= HEADER ======= */}
      <DialogTitle sx={{ pb: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Demande {titleDate ? `du ${titleDate}` : ""}
          </Typography>

          {cr && (
            <Chip
              size="small"
              color={statusColor(cr.status)}
              label={statusLabel(cr.status)}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}

          {attr?.name && <Chip size="small" label={attr.name} sx={{ fontWeight: 500 }} />}

          <Box sx={{ flex: 1 }} />

          {isPending && (
            <Tooltip title="Réinitialiser depuis la demande">
              <span>
                <IconButton size="small" onClick={handleResetFromCr} aria-label="Réinitialiser">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Fermer">
            <IconButton size="small" onClick={onClose} aria-label="Fermer">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {cr && (
          <Box
            sx={{
              mt: 1,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}
            >
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <EventIcon fontSize="inherit" />
                Créée le {dayjs(cr.createdAt).isValid() ? dayjs(cr.createdAt).format("DD/MM/YYYY HH:mm") : "—"}
              </Box>

              <Box sx={{ mx: 0.5, opacity: 0.5 }}>•</Box>

              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <UpdateIcon fontSize="inherit" />
                Dernière maj {dayjs(cr.updatedAt).isValid() ? dayjs(cr.updatedAt).format("DD/MM/YYYY HH:mm") : "—"}
              </Box>
            </Typography>

            <Chip
              size="small"
              variant="outlined"
              label={`${workingChips.length} / ${max}`}
              sx={{
                justifySelf: { xs: "start", sm: "end" },
                "& .MuiChip-label": { px: 1.25 },
                fontSize: 11,
                height: 22,
                borderStyle: "dashed",
                opacity: 0.8,
              }}
              aria-label={`Compteur : ${workingChips.length} sur ${max}`}
            />
          </Box>
        )}
      </DialogTitle>

      {/* ======= CONTENU ======= */}
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1.5 }}>
        {/* Zone chips (projection) */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 1.5 },
            alignItems: "center",
            minWidth: 0,
            overflow: "visible",
          }}
        >
          {workingChips.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune valeur (après application des changements).
            </Typography>
          ) : (
            workingChips.map((pa) => {
              const marker: "create" | "update" | null = markersVisible
                ? createMap.has(pa.id)
                  ? "create"
                  : updateSet.has(pa.id)
                  ? "update"
                  : null
                : null;

              return (
                <AttributeChipValueItem
                  key={pa.id}
                  pa={{ id: pa.id, value: pa.value, validFrom: "", validTo: null, pendingDelete: false }}
                  attrDef={attr ?? ({ id: 0, name: "", type: "TEXT" } as Attribute)}

                  // look édition (même style) en lecture
                  rowEditMode={rowLooksEditable}
                  editingKey={editingKey}
                  status={statusByKey[`pa-${pa.id}`] ?? "idle"}
                  attrValue={attrValue}
                  inputRef={editMode ? editInputRef : ({} as any)}
                  formatDisplayValue={formatDisplayValue}

                  // actions seulement en édition
                  allowDelete={editMode ? (!required || workingChips.length > 1) : false}
                  inlineEditOnChipClickInEditMode={editMode}
                  changeMarker={marker}

                  // callbacks : réels en édition, no-op en lecture
                  onStartEdit={editMode ? ((_, __, ___, v) => startEditChip(pa.id, v)) : NOOP_START}
                  onCancelEdit={editMode ? cancelInlineEdit : NOOP}
                  onChangeAttrValue={editMode ? setAttrValue : NOOP_STR}
                  onLocalUpdate={editMode ? confirmUpdate : NOOP_NUM_STR}
                  onLocalDelete={
                    editMode
                      ? (id) => {
                          if (required && workingChips.length <= 1) return;
                          markDelete(id);
                        }
                      : NOOP
                  }
                />
              );
            })
          )}

          {/* Ajout autorisé seulement en mode édition */}
          {editMode && canAddMore && (
            <Box key={addKey} sx={{ overflow: "visible" }}>
              {isAdding ? (
                <TypedValueInput
                  attribute={attr ?? undefined}
                  label={attr?.name ?? "Valeur"}
                  value={attrValue ?? ""}
                  status={addStatus}
                  inputRef={editInputRef}
                  onChange={setAttrValue}
                  onSave={() => confirmAdd(attrValue ?? "")}
                  onCancel={cancelInlineEdit}
                />
              ) : (
                <Chip
                  icon={<AddIcon />}
                  label="Ajouter"
                  variant="outlined"
                  onClick={startAdd}
                  sx={{ borderStyle: "dashed", borderWidth: 1, opacity: 0.95 }}
                  aria-label={`Ajouter ${attr?.name ?? "valeur"}`}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Suppressions */}
        {deletedList.length > 0 && (
          <DeletedSection
            deletedList={deletedList}
            attr={attr}
            formatDisplayValue={formatDisplayValue}
            editMode={editMode}
            onUndo={(id) => undoDelete(id)}
          />
        )}

        {/* Motif global */}
        <TextField
          label={isPending ? "Motif global" : "Motif global (lecture seule)"}
          value={globalReason}
          onChange={(e) => setGlobalReason(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          placeholder="Expliquez brièvement la raison de votre demande…"
          inputProps={{ maxLength: 1024, readOnly: !editMode }}
          helperText={
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <span>{editMode ? "Requis pour l’envoi" : " "}</span>
              <span>
                {charCount} / {charLimit}
              </span>
            </Box>
          }
          FormHelperTextProps={{ sx: { mx: 0 } }}
        />
      </DialogContent>

      {/* ======= FOOTER ======= */}
      <DialogActions
        sx={{
          position: "sticky",
          bottom: 0,
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          zIndex: 1,
        }}
      >
        <Button startIcon={<CloseIcon />} onClick={onClose}>
          Fermer
        </Button>

        {isPending && !editMode && (
          <>
            <Button startIcon={<CancelIcon />} color="error" onClick={handleCancelCr}>
              Annuler la demande
            </Button>
            <Button startIcon={<EditIcon />} variant="contained" onClick={() => setEditMode(true)}>
              Modifier
            </Button>
          </>
        )}

        {isPending && editMode && (
          <>
            <Button onClick={handleResetFromCr}>Annuler les changements</Button>
            <Badge
              color="error"
              badgeContent={hasBlockingError ? (count > max ? `max ${max}` : "min 1") : undefined}
              invisible={!hasBlockingError}
            >
              <Tooltip
                title={reasonsDisabled.length ? reasonsDisabled.join(" • ") : ""}
                disableHoverListener={!reasonsDisabled.length}
              >
                <span>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={hasBlockingError || !globalReason.trim()}
                    onClick={handleResubmit}
                  >
                    Enregistrer
                  </Button>
                </span>
              </Tooltip>
            </Badge>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRequestViewerDialog;
