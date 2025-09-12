import React from "react";
import {
  Add as AddIcon,
  Edit as EditIcon,
  EditNote as EditNoteIcon,
  Lock as LockIcon,
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
  Badge,
} from "@mui/material";

import { Attribute } from "../../../../../models/commons/Attribute";
import { PersonAttributeFull } from "../../../../../models/commons/PersonAttribute";

import AttributeChipValueItem, {
  RowStatus as ChipRowStatus,
} from "./components/AttributeChipValueItem";

import {
  ChangeRequestSummary,
  ChangeStatus,
} from "../../../../../models/commons/Profile/ChangeRequest";
import AttributeRowLayout from "../layout/AttributeRowLayout";
import TypedValueInput from "../inputs/TypedValueInput";

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

  formatDisplayValue: (type: string | null | undefined, value: string) => string;

  onStartEdit: (rowKey: string, attributeId: number, paId: number | null, currentValue: string) => void;
  onCancelEdit: () => void;

  onOpenChangeRequest: (attr: Attribute, rowValues: { id: number; value: string }[]) => void;

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

  /** Enveloppes CR (typiquement "open") et callback pour ouvrir une CR existante */
  changeRequests: ChangeRequestSummary[];
  onOpenExistingChangeRequest: (crId: number) => void;
};

const ROW_HOVER_SCOPE = "row-hover-scope";

const statusColor = (s: ChangeStatus): string => {
  switch (s) {
    case "PENDING":
      return "warning.main";
    case "APPROVED":
      return "success.main";
    case "REJECTED":
      return "error.main";
    case "CANCELED":
    default:
      return "text.disabled";
  }
};

const statusLabel = (s: ChangeStatus): string => {
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

  formatDisplayValue,

  onStartEdit,
  onCancelEdit,

  onOpenChangeRequest,

  inlineEditOnChipClickInEditMode = true,
  hasUnsavedChanges,
  onRowSave,
  onRowCancel,
  confirmOnOutsideClick = true,

  changeRequests,
  onOpenExistingChangeRequest,
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

  // === Marqueurs de modifications pour le rendu en mode édition ===
  const createdSet = React.useMemo(() => {
    const origIds = new Set(originalChipsRef.current.map((p) => p.id));
    const s = new Set<number>();
    for (const p of workingChips) {
      if (!origIds.has(p.id)) s.add(p.id);
    }
    return s;
  }, [workingChips]);

  const updatedSet = React.useMemo(() => {
    const origMap = new Map(originalChipsRef.current.map((p) => [p.id, norm(p.value)]));
    const s = new Set<number>();
    for (const p of workingChips) {
      if (origMap.has(p.id) && norm(p.value) !== origMap.get(p.id)) {
        s.add(p.id);
      }
    }
    return s;
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

  // === CR existante pour CET attribut (enveloppe porte attributeId)
  const existingCrForAttr = React.useMemo(
    () => (changeRequests ?? []).find((cr) => (cr as any).attributeId === attrDef.id) ?? null,
    [changeRequests, attrDef.id]
  );

  // Map des chips ciblés par la CR : paId -> tooltip
  const crTargetsByPaId = React.useMemo(() => {
    const map = new Map<number, string>();
    if (!existingCrForAttr) return map;

    for (const it of existingCrForAttr.items ?? []) {
      if (!it.personAttributeId) continue; // CREATE n'est pas relié à un chip existant
      if (it.action === "UPDATE") {
        const pv = (it.proposedValue ?? "").toString();
        map.set(it.personAttributeId, `Demande : mettre à jour cette valeur → « ${pv} »`);
      } else if (it.action === "DELETE") {
        map.set(it.personAttributeId, "Demande : supprimer cette valeur");
      }
    }
    return map;
  }, [existingCrForAttr]);

  const pendingBadge = existingCrForAttr?.status === "PENDING" ? 1 : 0;

  const handleOpenCr = () => {
    if (rowEditMode) return; // désactivé en mode édition
    if (existingCrForAttr) {
      onOpenExistingChangeRequest(existingCrForAttr.id);
    } else {
      const pairs = workingChips.map((c) => ({ id: c.id, value: c.value }));
      onOpenChangeRequest(attrDef, pairs);
    }
  };

  // === Actions (boutons de droite) ===
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
        // --- Mode éditable : UNIQUEMENT le bouton "modifier"
        <Tooltip title="Modifier">
          <IconButton size="small" onClick={enterEditMode} aria-label={`Modifier ${attrDef.name}`}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        // --- Mode lecture seule : cadenas + bouton CR (avec badge si PENDING)
        <>
          <Tooltip title="Lecture seule">
            <span>
              <IconButton size="small" disabled aria-label="Lecture seule">
                <LockIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip
            title={
              existingCrForAttr
                ? `Voir la demande (${statusLabel(existingCrForAttr.status)})`
                : `Demander une modification`
            }
          >
            <span>
              <Badge
                color="warning"
                badgeContent={pendingBadge || undefined}
                invisible={pendingBadge === 0}
                overlap="circular"
              >
                <IconButton
                  size="small"
                  onClick={handleOpenCr}
                  aria-label={
                    existingCrForAttr
                      ? `Voir la demande ${statusLabel(existingCrForAttr.status)}`
                      : `Demander une modification pour ${attrDef.name}`
                  }
                >
                  <EditNoteIcon fontSize="small" />
                </IconButton>
              </Badge>
            </span>
          </Tooltip>
        </>
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
            {workingChips.map((pa) => {
              const marker: "create" | "update" | null = rowEditMode
                ? createdSet.has(pa.id)
                  ? "create"
                  : updatedSet.has(pa.id)
                  ? "update"
                  : null
                : null;

              const crTooltip = crTargetsByPaId.get(pa.id);
              const chipNode = (
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
                  changeMarker={marker}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onChangeAttrValue={onChangeAttrValue}
                  onLocalUpdate={applyLocalUpdate}
                  onLocalDelete={applyLocalDelete}
                />
              );

              // Si la CR cible ce chip (UPDATE/DELETE), on lui met un dot + tooltip
              return crTooltip ? (
                <Tooltip key={pa.id} title={crTooltip}>
                  <Badge
                    variant="dot"
                    color="warning"
                    overlap="circular"
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    sx={{
                      "& .MuiBadge-badge": {
                        transform: "scale(1)",
                      },
                    }}
                  >
                    {chipNode}
                  </Badge>
                </Tooltip>
              ) : (
                chipNode
              );
            })}

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
