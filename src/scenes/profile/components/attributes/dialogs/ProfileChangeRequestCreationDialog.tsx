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
  Collapse,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

import { Attribute } from "../../../../../models/commons/Attribute/Attribute";

/** Réutilise les briques existantes (même UX que la ligne en édition) */
import TypedValueInput from "../inputs/TypedValueInput";
import AttributeChipValueItem, {
  RowStatus as ChipRowStatus,
} from "../rows/components/AttributeChipValueItem";

/* =======================
   Anti-clip label flottant
======================= */
const floatLabelUnclipSx = {
  overflow: "visible",
  "& .MuiFormControl-root": { overflow: "visible" },
  "& .MuiInputBase-root": { overflow: "visible" },
  "& .MuiOutlinedInput-root": { overflow: "visible" },
} as const;

/* =======================
   Props publiques
======================= */

interface Props {
  open: boolean;
  attr: Attribute | null;
  /** Valeurs initiales (id + value) à l’ouverture */
  chips: { id: number; value: string }[];
  /** Formatage affichage selon type */
  formatDisplayValue: (type: string | null | undefined, value: string) => string;
  onClose: () => void;
  /**
   * Callback d’envoi (facultatif) : vous recevrez le lot de changements + motif global.
   */
  onSubmit: (payload: {
    attributeId: number;
    added: { value: string }[];
    updated: { id: number; value: string }[];
    deleted: { id: number }[];
    globalReason: string;
  }) => void | Promise<void>;
  /** Si vrai, le motif global doit être non vide pour activer "Envoyer". (par défaut: true) */
  requireGlobalReason?: boolean;
}

/* =======================
   Types internes
======================= */

type LocalRowStatus = ChipRowStatus;

type CreateOp = { id: string; kind: "CREATE"; tempId: number; newValue: string };
type UpdateOp = { id: string; kind: "UPDATE"; paId: number; oldValue: string; newValue: string };
type DeleteOp = { id: string; kind: "DELETE"; paId: number; oldValue: string };

type ChangeOp = CreateOp | UpdateOp | DeleteOp;

// variantes "sans id" (pour créer une op)
type CreateOpNoId = Omit<CreateOp, "id">;
type UpdateOpNoId = Omit<UpdateOp, "id">;
type DeleteOpNoId = Omit<DeleteOp, "id">;
type NewChangeOp = CreateOpNoId | UpdateOpNoId | DeleteOpNoId;

/* =======================
   Component
======================= */

const ChangeRequestDialog: React.FC<Props> = ({
  open,
  attr,
  chips,
  formatDisplayValue,
  onClose,
  onSubmit,
  requireGlobalReason = true,
}) => {
  const attrId = attr?.id ?? 0;
  const max = Math.max(1, attr?.maxValues ?? 1);
  const required = !!attr?.required;

  /** Snapshot initial (mis à jour à chaque ouverture + changement de chips) */
  type ChipPA = { id: number; value: string };
  const initialRef = React.useRef<ChipPA[]>([]);

  /** Lot d’opérations (“diff” local) */
  const [ops, setOps] = React.useState<ChangeOp[]>([]);
  const addOp = (op: NewChangeOp) =>
    setOps((prev) => [...prev, { ...op, id: crypto.randomUUID() } as ChangeOp]);
  const removeOpsBy = (predicate: (o: ChangeOp) => boolean) =>
    setOps((prev) => prev.filter((o) => !predicate(o)));

  /** Motif global */
  const [globalReason, setGlobalReason] = React.useState<string>("");

  /** Inline edit */
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [attrValue, setAttrValue] = React.useState<string>("");
  const [statusByKey, setStatusByKey] = React.useState<Record<string, LocalRowStatus>>({});
  const editInputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (editInputRef.current) editInputRef.current.focus();
  }, [editingKey]);
  const setStatus = (key: string, status: LocalRowStatus) =>
    setStatusByKey((prev) => ({ ...prev, [key]: status }));

  /** 🔧 Sync initialRef + reset local state quand on ouvre / quand chips changent */
  React.useEffect(() => {
    if (!open) return;
    initialRef.current = (chips ?? []).map((c) => ({ id: c.id, value: c.value }));
    // reset état local pour coller à l'ouverture
    setOps([]);
    setEditingKey(null);
    setAttrValue("");
    setGlobalReason("");
  }, [open, chips]);

  /** État de travail = initial + ops (preview live) */
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

  /** Ops index pour marquage rapide */
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

  /** Normalisation simple */
  const norm = (s: string) => (s ?? "").trim().replace(/\s+/g, " ");
  const same = (a?: string, b?: string) => norm(a ?? "") === norm(b ?? "");

  /** Helpers “undo delete si même valeur” */
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

  /** Démarrer édition d’une chip existante */
  const startEditChip = (id: number, currentValue: string) => {
    setEditingKey(`pa-${id}`);
    setAttrValue(currentValue);
    setStatus(`pa-${id}`, "idle");
  };

  const cancelInlineEdit = () => {
    setEditingKey(null);
    setAttrValue("");
  };

  /** Confirmer UPDATE (ou ajuster un CREATE) */
  const confirmUpdate = (paId: number, newValue: string) => {
    const v = newValue ?? "";

    // 🔁 1) Si une DeleteOp porte exactement cette valeur, on annule la DELETE au lieu d’update/ajouter.
    const deletedIdx = findIndexOfDeleteByValue(v);
    if (deletedIdx >= 0) {
      setOps((prev) => {
        const copy = [...prev];

        // Supprimer la DeleteOp par valeur
        const delIdx = copy.findIndex((o) => o.kind === "DELETE" && same((o as DeleteOp).oldValue, v));
        if (delIdx >= 0) copy.splice(delIdx, 1);

        // Si on éditait un CREATE (tempId === paId), on supprime ce CREATE pour “réactiver” l’ancienne valeur
        const createIdx = copy.findIndex((o) => o.kind === "CREATE" && (o as CreateOp).tempId === paId);
        if (createIdx >= 0) {
          copy.splice(createIdx, 1);
          return copy;
        }

        // Sinon, si une UPDATE existe déjà pour ce paId, on la retire (retour à l’état sans modif)
        const updIdx = copy.findIndex((o) => o.kind === "UPDATE" && (o as UpdateOp).paId === paId);
        if (updIdx >= 0) copy.splice(updIdx, 1);

        return copy;
      });

      cancelInlineEdit();
      return;
    }

    // 2) Comportement normal si pas de “undo delete” à faire
    const initialVal =
      initialRef.current.find((c) => c.id === paId)?.value ??
      workingChips.find((c) => c.id === paId)?.value ??
      "";

    setOps((prev) => {
      const createIdx = prev.findIndex((o) => o.kind === "CREATE" && (o as CreateOp).tempId === paId);
      if (createIdx >= 0) {
        const copy = [...prev] as ChangeOp[];
        const c = copy[createIdx] as CreateOp;
        copy[createIdx] = { ...c, newValue: v };
        return copy;
      }
      if (same(initialVal, v)) {
        return prev.filter((o) => !(o.kind === "UPDATE" && (o as UpdateOp).paId === paId));
      }
      const idx = prev.findIndex((o) => o.kind === "UPDATE" && (o as UpdateOp).paId === paId);
      if (idx >= 0) {
        const copy = [...prev] as ChangeOp[];
        const u = copy[idx] as UpdateOp;
        copy[idx] = { ...u, newValue: v };
        return copy;
      }
      return [...prev, { kind: "UPDATE", paId, oldValue: initialVal, newValue: v } as UpdateOp];
    });

    cancelInlineEdit();
  };

  /** Supprimer : DELETE (ou retirer CREATE) */
  const markDelete = (paId: number) => {
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

  /** Annuler une suppression (Undo) */
  const undoDelete = (paId: number) => {
    setOps((prev) => prev.filter((o) => !(o.kind === "DELETE" && (o as DeleteOp).paId === paId)));
  };

  /** Ajouter : CREATE */
  const tempIdRef = React.useRef<number>(-1);
  const addKey = `cr-add-${attrId}`;
  const isAdding = editingKey === addKey;
  const addStatus = (statusByKey[addKey] ?? "idle") as LocalRowStatus;

  const startAdd = () => {
    if (!canAddMore) return;
    setEditingKey(addKey);
    setAttrValue("");
    setStatus(addKey, "idle");
  };

  const confirmAdd = (value: string) => {
    const v = value ?? "";
    if (!v.trim()) return cancelInlineEdit();

    // 🔁 1) Si une DeleteOp porte exactement cette valeur, on annule la DELETE ET on n’ajoute pas de CREATE
    const deletedIdx = findIndexOfDeleteByValue(v);
    if (deletedIdx >= 0) {
      undoOneDeleteByValue(v);
      cancelInlineEdit();
      return;
    }

    // 2) Sinon on ajoute normalement
    const tid = tempIdRef.current--;
    addOp({ kind: "CREATE", tempId: tid, newValue: v });
    cancelInlineEdit();
  };

  /** Refresh (🔄) — placé dans le titre */
  const handleRefresh = () => {
    setOps([]);
    setEditingKey(null);
    setAttrValue("");
    setGlobalReason("");
    initialRef.current = (chips ?? []).map((c) => ({ id: c.id, value: c.value }));
  };

  /** Auto-save clic hors input */
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
  }, [editingKey, attrValue, addKey, findIndexOfDeleteByValue]); // dépendances utiles

  /** Contraintes + bouton Envoyer */
  const canSend =
    ops.length > 0 &&
    !(count > max || (required && count < 1)) &&
    (!requireGlobalReason || globalReason.trim().length > 0);

  const hasBlockingError = count > max || (required && count < 1);

  const handleSend = async () => {
    if (!onSubmit || !attrId || !canSend) {
      onClose();
      return;
    }
    const added = ops.filter((o): o is CreateOp => o.kind === "CREATE").map((o) => ({ value: o.newValue }));
    const updated = ops.filter((o): o is UpdateOp => o.kind === "UPDATE").map((o) => ({
      id: o.paId,
      value: o.newValue,
    }));
    const deleted = ops.filter((o): o is DeleteOp => o.kind === "DELETE").map((o) => ({ id: o.paId }));

    await onSubmit({
      attributeId: attrId,
      added,
      updated,
      deleted,
      globalReason: globalReason.trim(),
    });
    onClose();
  };

  /** Autorisation suppression : uniquement selon `required` */
  const allowDeleteForChip = () => (required ? count > 1 : true);

  /** Section “Suppressions (N)” repliable */
  const [showDeleted, setShowDeleted] = React.useState(false);
  const toggleDeleted = () => setShowDeleted((v) => !v);

  /** Raccourci clavier: Ctrl/Cmd + Enter => envoyer */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (canSend) handleSend();
    }
  };

  /** Checklist de raisons expliquant pourquoi le bouton est désactivé */
  const reasons: string[] = [];
  if (ops.length === 0) reasons.push("Ajoutez au moins un changement");
  if (hasBlockingError) {
    if (count > max) reasons.push(`Nombre maximum atteint (${max})`);
    if (required && count < 1) reasons.push("Au moins une valeur requise");
  }
  if (requireGlobalReason && !globalReason.trim()) reasons.push("Renseignez le motif global");

  const hasMarkers = createMap.size > 0 || updateSet.size > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth onKeyDown={onKeyDown}>
      {/* Title */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Demander une modification
        </Typography>
        {attr?.name && (
          <Chip size="small" label={attr.name} color="primary" variant="filled" sx={{ fontWeight: 500 }} />
        )}
        <Box sx={{ flex: 1 }} />
        {/* Refresh global, accessible et affordant */}
        <Tooltip title="Réinitialiser (perd les changements en cours)">
          <IconButton size="small" onClick={handleRefresh} aria-label="Réinitialiser">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fermer">
          <IconButton size="small" onClick={onClose} aria-label="Fermer">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          ...floatLabelUnclipSx, // ✅ empêche le clip global dans le contenu du dialog
        }}
      >
        {/* Zone A — Édition live (chips) */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 1.5 },
            alignItems: "center",
            minWidth: 0,
            ...floatLabelUnclipSx, // ✅ empêche le clip au niveau de la grille de chips
          }}
        >
          {workingChips.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune valeur pour cet attribut.
            </Typography>
          ) : (
            workingChips.map((pa) => {
              const marker: "create" | "update" | null =
                createMap.has(pa.id) ? "create" : updateSet.has(pa.id) ? "update" : null;
              return (
                <AttributeChipValueItem
                  key={pa.id}
                  pa={{ id: pa.id, value: pa.value, validFrom: "", validTo: null, pendingDelete: false }}
                  attrDef={attr ?? ({ id: 0, name: "", type: "TEXT" } as Attribute)}
                  rowEditMode={true}
                  editingKey={editingKey}
                  status={statusByKey[`pa-${pa.id}`] ?? "idle"}
                  attrValue={attrValue}
                  inputRef={editInputRef}
                  formatDisplayValue={formatDisplayValue}
                  allowDelete={allowDeleteForChip()}
                  inlineEditOnChipClickInEditMode={true}
                  changeMarker={marker}
                  onStartEdit={(_, __, ___, currentValue) => startEditChip(pa.id, currentValue)}
                  onCancelEdit={cancelInlineEdit}
                  onChangeAttrValue={setAttrValue}
                  onLocalUpdate={confirmUpdate}
                  onLocalDelete={(id) => {
                    if (required && count <= 1) return;
                    markDelete(id);
                  }}
                />
              );
            })
          )}

          {/* Chip "Ajouter" */}
          {canAddMore && (
            <Box key={addKey} sx={{ ...floatLabelUnclipSx }}>
              {isAdding ? (
                <TypedValueInput
                  label={attr?.name ?? "Valeur"}
                  attribute={attr ?? undefined}
                  value={attrValue}
                  status={addStatus}
                  inputRef={editInputRef}
                  onChange={setAttrValue}
                  onSave={() => confirmAdd(attrValue)}
                  onCancel={cancelInlineEdit}
                  onBlur={() => {}}
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

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Compteur près de la liste (conserve le lien visuel) */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
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
          </Box>
        </Box>

        {/* Légende minimale (seulement s'il y a des marqueurs) */}
        {hasMarkers && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5, opacity: 0.8 }}>
            + Ajout • ✏ Modifié
          </Typography>
        )}

        {/* Bloc “Suppressions (N)” */}
        {deletedList.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Suppressions ({deletedList.length})
              </Typography>
              <IconButton size="small" onClick={toggleDeleted} aria-label="Voir/masquer">
                {showDeleted ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={showDeleted} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 1, sm: 1.5 },
                  alignItems: "center",
                  minWidth: 0,
                  mt: 1,
                  p: 1,
                  border: (t) => `1px dashed ${t.palette.divider}`,
                  borderRadius: 1,
                  backgroundColor: (t) => t.palette.action.hover,
                  ...floatLabelUnclipSx, // ✅ au cas où un input apparaisse ici plus tard
                }}
              >
                {deletedList.map((d) => (
                  <AttributeChipValueItem
                    key={`ghost-${d.id}`}
                    pa={{ id: d.id, value: d.value, validFrom: "", validTo: null, pendingDelete: false }}
                    attrDef={attr ?? ({ id: 0, name: "", type: "TEXT" } as Attribute)}
                    rowEditMode={false}
                    editingKey={null}
                    status={"idle"}
                    attrValue={""}
                    inputRef={{} as any}
                    formatDisplayValue={formatDisplayValue}
                    allowDelete={false}
                    inlineEditOnChipClickInEditMode={false}
                    ghost
                    changeMarker={null}
                    onUndoDelete={undoDelete}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                    onChangeAttrValue={() => {}}
                    onLocalUpdate={() => {}}
                    onLocalDelete={() => {}}
                  />
                ))}
              </Box>
            </Collapse>
            <Divider sx={{ mt: 1 }} />
          </Box>
        )}

        {/* Motif global unique */}
        <TextField
          label={requireGlobalReason ? "Motif global (obligatoire)" : "Motif global (optionnel)"}
          value={globalReason}
          onChange={(e) => setGlobalReason(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          placeholder="Expliquez brièvement la raison de votre demande…"
          inputProps={{ maxLength: 1024 }}
          helperText={
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <span>{requireGlobalReason ? "Requis pour l’envoi" : "Optionnel"}</span>
              <span>
                {globalReason.length} / 1024
              </span>
            </Box>
          }
          FormHelperTextProps={{ sx: { mx: 0 } }}
        />
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          position: "sticky",
          bottom: 0,
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          zIndex: 1,
        }}
      >
        <Button startIcon={<CloseIcon />} onClick={onClose}>
          Annuler
        </Button>

        <Badge
          color="error"
          badgeContent={hasBlockingError ? (count > max ? `max ${max}` : "min 1") : undefined}
          invisible={!hasBlockingError}
        >
          {/* Tooltip checklist quand le bouton est désactivé */}
          <Tooltip
            title={(() => {
              const reasons: string[] = [];
              if (ops.length === 0) reasons.push("Ajoutez au moins un changement");
              if (hasBlockingError) {
                if (count > max) reasons.push(`Nombre maximum atteint (${max})`);
                if (required && count < 1) reasons.push("Au moins une valeur requise");
              }
              if (requireGlobalReason && !globalReason.trim()) reasons.push("Renseignez le motif global");
              return reasons.length ? reasons.join(" • ") : "";
            })()}
            disableHoverListener={!(ops.length === 0 || hasBlockingError || (requireGlobalReason && !globalReason.trim()))}
          >
            <span>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={
                  !(
                    ops.length > 0 &&
                    !hasBlockingError &&
                    (!requireGlobalReason || globalReason.trim().length > 0)
                  )
                }
                onClick={handleSend}
              >
                Envoyer la demande ({ops.length})
              </Button>
            </span>
          </Tooltip>
        </Badge>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRequestDialog;
