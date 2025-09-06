import React from "react";
import {
  Add as AddIcon,
  Edit as EditIcon,
  EditNote as EditNoteIcon,
  Lock as LockIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import TypedValueInput from "../inputs/TypedValueInput";
import AttributeRowLayout from "../layout/AttributeRowLayout";

import { Attribute } from "../../../../../models/commons/Attribute";
import { PersonAttributeFull } from "../../../../../models/commons/PersonAttribute";

import AttributeChipValueItem, {
  RowStatus as ChipRowStatus,
} from "./components/AttributeChipValueItem";

/** Types locaux */
export type RowStatus = ChipRowStatus;

type ChipPA = Pick<PersonAttributeFull, "id" | "value" | "validFrom" | "validTo" | "pendingDelete">;

type Props = {
  attrDef: Attribute;
  chips: ChipPA[];
  addKey: string;
  isAdding: boolean;
  addStatus: RowStatus;

  editingKey: string | null;
  statusByKey: Record<string, RowStatus>;
  attrValue: string;
  inputRef: React.Ref<any>;
  onChangeAttrValue: (v: string) => void;

  allowEdit: boolean;
  allowDelete: boolean;
  allowAdd: boolean;

  pendingByKey: Record<string, unknown>;

  formatDisplayValue: (type: string | null | undefined, value: string) => string;

  onStartEdit: (rowKey: string, attributeId: number, paId: number | null, currentValue: string) => void;
  onCancelEdit: () => void;

  onOpenMenu: (
    e: React.MouseEvent<HTMLElement>,
    key: string,
    attr: Attribute,
    paId: number | null,
    currentValue: string,
    canRequestUpdate: boolean,
    canRequestDelete: boolean,
    canRequestCreate?: boolean,
    rowValues?: { id: number; value: string }[]
  ) => void;

  inlineEditOnChipClickInEditMode?: boolean;
  hasUnsavedChanges?: boolean;

  onRowSave?: (payload: {
    attributeId: number;
    added: { value: string }[];
    updated: { id: number; value: string }[];
    deleted: { id: number }[];
  }) => void;
  onRowCancel?: () => void;

  confirmOnOutsideClick?: boolean;
};

const ROW_HOVER_SCOPE = "row-hover-scope";

const AttributeRow: React.FC<Props> = ({
  attrDef,
  chips,
  addKey,
  isAdding,
  addStatus,

  editingKey,
  statusByKey,
  attrValue,
  inputRef,
  onChangeAttrValue,

  allowEdit,
  allowDelete,
  allowAdd,

  pendingByKey,
  formatDisplayValue,

  onStartEdit,
  onCancelEdit,

  onOpenMenu,

  inlineEditOnChipClickInEditMode = true,
  hasUnsavedChanges,
  onRowSave,
  onRowCancel,
  confirmOnOutsideClick = true,
}) => {
  const [rowEditMode, setRowEditMode] = React.useState(false);
  const [workingChips, setWorkingChips] = React.useState<ChipPA[]>(chips);
  const originalChipsRef = React.useRef<ChipPA[]>(chips);
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const tempIdRef = React.useRef<number>(-1);

  const max = Math.max(1, attrDef.maxValues ?? 1);
  const count = workingChips.length;
  const canAddMore = count < max;

  React.useEffect(() => {
    if (!rowEditMode) {
      setWorkingChips(chips);
      originalChipsRef.current = chips;
    }
  }, [chips, rowEditMode]);

  const enterEditMode = () => {
    setWorkingChips(chips);
    originalChipsRef.current = chips;
    setRowEditMode(true);
  };

  const pendingKeys = [
    ...chips.map((pa) => `pa-${pa.id}`).filter((k) => !!pendingByKey[k]),
    ...(pendingByKey[addKey] ? [addKey] : []),
  ];

  const handleCancelAllPending = () => {
    // TODO: branche ton handler si tu veux annuler toutes les requêtes en attente (API / state global).
  };

  const norm = (s: string) => (s ?? "").trim().replace(/\s+/g, " ");

  const computeDiff = React.useCallback(() => {
    const orig = originalChipsRef.current;
    const work = workingChips;

    const origById = new Map(orig.map((p) => [p.id, norm(p.value)]));
    const workById = new Map(work.map((p) => [p.id, norm(p.value)]));

    const updatedSameId: { id: number; value: string }[] = [];
    const deletedFull: { id: number; value: string }[] = [];
    const addedFull: { tempId: number; value: string }[] = [];

    for (const [id, v0] of origById.entries()) {
      if (workById.has(id)) {
        const v1n = workById.get(id)!;
        if (v1n !== v0) {
          const raw = work.find((p) => p.id === id)!.value;
          updatedSameId.push({ id, value: raw });
        }
      } else {
        const raw = orig.find((p) => p.id === id)!.value;
        deletedFull.push({ id, value: raw });
      }
    }

    for (const p of work) {
      if (!origById.has(p.id)) {
        addedFull.push({ tempId: p.id, value: p.value });
      }
    }

    const delByVal = new Map<string, number[]>();
    for (const d of deletedFull) {
      const key = norm(d.value);
      const arr = delByVal.get(key) ?? [];
      arr.push(d.id);
      delByVal.set(key, arr);
    }

    const remainingAdded: { value: string }[] = [];
    const remainingDeletedIds: number[] = [];

    for (const a of addedFull) {
      const key = norm(a.value);
      const arr = delByVal.get(key);
      if (arr?.length) {
        arr.pop();
        delByVal.set(key, arr);
        continue;
      }
      remainingAdded.push({ value: a.value });
    }
    for (const [, ids] of delByVal) {
      for (const id of ids) remainingDeletedIds.push(id);
    }

    const updated = updatedSameId;
    const deleted = remainingDeletedIds.map((id) => ({ id }));
    const added = remainingAdded;

    const changed = updated.length > 0 || deleted.length > 0 || added.length > 0;
    return { added, updated, deleted, changed };
  }, [workingChips]);

  const internalDirty = computeDiff().changed || Boolean(editingKey) || Boolean(isAdding);
  const dirty = typeof hasUnsavedChanges === "boolean" ? hasUnsavedChanges : internalDirty;

  const handleRowCancel = () => {
    setWorkingChips(originalChipsRef.current);
    onCancelEdit?.();
    setRowEditMode(false);
    onRowCancel?.();
  };

  const handleRowSave = () => {
    const { added, updated, deleted } = computeDiff();
    onCancelEdit?.();
    onRowSave?.({
      attributeId: attrDef.id,
      added,
      updated,
      deleted,
    });
    setRowEditMode(false);
  };

  const applyLocalUpdate = (paId: number, newValue: string) => {
    setWorkingChips((prev) => prev.map((p) => (p.id === paId ? { ...p, value: newValue } : p)));
    onCancelEdit?.();
  };

  const applyLocalDelete = (paId: number) => {
    setWorkingChips((prev) => prev.filter((p) => p.id !== paId));
  };

  const applyLocalAdd = (newValue: string) => {
    if (!canAddMore) return;
    const tid = tempIdRef.current--;
    setWorkingChips((prev) => [
      ...prev,
      { id: tid, value: newValue, validFrom: "", validTo: null, pendingDelete: false },
    ]);
    onCancelEdit?.();
  };

  const [confirmLeaveOpen, setConfirmLeaveOpen] = React.useState(false);

  React.useEffect(() => {
    if (!confirmOnOutsideClick) return;

    const handler = (e: MouseEvent) => {
      if (!rowEditMode) return;
      const root = rowRef.current;
      if (!root) return;
      const target = e.target as Node;
      if (!root.contains(target)) {
        if (dirty) setConfirmLeaveOpen(true);
        else setRowEditMode(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [rowEditMode, dirty, confirmOnOutsideClick]);

  React.useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (rowEditMode && dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [rowEditMode, dirty]);

  const actions = (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      {rowEditMode ? (
        <>
          <Tooltip title="Annuler les modifications">
            <IconButton size="small" onClick={handleRowCancel} aria-label="Annuler">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={dirty ? "Enregistrer" : "Aucune modification"}>
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  if (!dirty) return;
                  handleRowSave();
                }}
                aria-label="Enregistrer"
                disabled={!dirty}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </>
      ) : allowEdit || allowAdd ? (
        <Tooltip title="Modifier">
          <IconButton size="small" onClick={enterEditMode} aria-label={`Modifier ${attrDef.name}`}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Lecture seule">
          <span>
            <IconButton size="small" disabled aria-label="Lecture seule">
              <LockIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {!rowEditMode && !allowAdd && (
        <Tooltip title="Demander une action">
          <IconButton
            size="small"
            onClick={(e) =>
              onOpenMenu(e, `attr-${attrDef.id}-add`, attrDef, null, "", true, true, true, workingChips.map(c => ({ id: c.id, value: c.value })))
            }
            aria-label={`Demander une action pour ${attrDef.name}`}
          >
            <EditNoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  const labelNode = (
    <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
      {attrDef.name}
    </Typography>
  );

  const statusSlot = (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {rowEditMode && (
        <Tooltip title={`Valeurs : ${count} sur ${max}`}>
          <Chip
            size="small"
            variant="outlined"
            label={`${count} / ${max}`}
            sx={{
              "& .MuiChip-label": { px: 1.25 },
              fontSize: 12,
              height: 24,
              borderStyle: "dashed",
            }}
            aria-label={`Compteur : ${count} sur ${max}`}
          />
        </Tooltip>
      )}

      {pendingKeys.length > 0 && (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <PendingIcon fontSize="small" />
          <Typography variant="body2">{pendingKeys.length} en attente</Typography>
          <Tooltip title="Annuler toutes les demandes">
            <IconButton size="small" onClick={handleCancelAllPending} aria-label="Annuler toutes les demandes">
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Box ref={rowRef}>
        <AttributeRowLayout label={labelNode} statusSlot={statusSlot} actionsSlot={actions}>
          <Box
            className={ROW_HOVER_SCOPE}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1, sm: 1.5 },
              alignItems: "center",
              minWidth: 0,
            }}
          >
            {workingChips.map((pa) => (
              <AttributeChipValueItem
                key={pa.id}
                pa={pa}
                attrDef={attrDef}
                rowEditMode={rowEditMode}
                editingKey={editingKey}
                status={statusByKey[`pa-${pa.id}`] ?? "idle"}
                attrValue={attrValue}
                inputRef={inputRef}
                formatDisplayValue={formatDisplayValue}
                allowDelete={allowDelete}
                inlineEditOnChipClickInEditMode={inlineEditOnChipClickInEditMode}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onChangeAttrValue={onChangeAttrValue}
                onLocalUpdate={applyLocalUpdate}
                onLocalDelete={applyLocalDelete}
              />
            ))}

            {rowEditMode && allowAdd && canAddMore && (
              <Box key={addKey}>
                {isAdding ? (
                  <TypedValueInput
                    label={attrDef.name}
                    type={attrDef.type as any}
                    value={attrValue}
                    status={addStatus}
                    inputRef={inputRef}
                    onChange={onChangeAttrValue}
                    onSave={() => applyLocalAdd(attrValue)}
                    onCancel={onCancelEdit}
                    onBlur={() => {
                      /* pas d'auto-save au blur */
                    }}
                  />
                ) : (
                  <Tooltip title={`Ajouter ${attrDef.name}`}>
                    <Chip
                      icon={<AddIcon />}
                      label="Ajouter"
                      variant="outlined"
                      onClick={() => onStartEdit(addKey, attrDef.id, null, "")}
                      sx={{ borderStyle: "dashed", borderWidth: 1, opacity: 0.95 }}
                      aria-label={`Ajouter ${attrDef.name}`}
                    />
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </AttributeRowLayout>
      </Box>

      <Dialog open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Modifications non enregistrées</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Voulez-vous enregistrer vos changements, annuler les changements, ou revenir à l’édition ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeaveOpen(false)}>Revenir aux changements</Button>
          <Button
            color="error"
            onClick={() => {
              handleRowCancel();
              setConfirmLeaveOpen(false);
            }}
          >
            Annuler les changements
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleRowSave();
              setConfirmLeaveOpen(false);
            }}
            disabled={!dirty}
            startIcon={<SaveIcon />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AttributeRow;
