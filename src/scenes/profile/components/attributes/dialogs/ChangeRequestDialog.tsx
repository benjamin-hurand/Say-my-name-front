import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { EditNote as EditNoteIcon } from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import dayjs from "dayjs";
import { Attribute } from "../../../../../models/commons/Attribute";

type ChangeAction = "UPDATE" | "DELETE" | "CREATE";

interface Props {
  open: boolean;
  mode: ChangeAction;
  attr: Attribute | null;
  originalValue: string;
  proposedValue: string;
  reason: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeProposed: (v: string) => void;
  onChangeReason: (v: string) => void;
  formatDisplayValue: (type: string | null | undefined, value: string) => string;

  // NEW: candidats + sélection
  paCandidates?: { id: number; value: string }[];
  selectedPaId?: number | null;
  onChangeSelectedPaId?: (id: number | null) => void;
}

const ChangeRequestDialog: React.FC<Props> = ({
  open,
  mode,
  attr,
  originalValue,
  proposedValue,
  reason,
  submitting,
  onClose,
  onSubmit,
  onChangeProposed,
  onChangeReason,
  formatDisplayValue,
  paCandidates,
  selectedPaId,
  onChangeSelectedPaId,
}) => {
  const title =
    mode === "UPDATE"
      ? "Demander une modification"
      : mode === "DELETE"
      ? "Demander une suppression"
      : "Demander un ajout";

  const renderOriginalValue = () => {
    if (!attr || mode === "CREATE") return null;

    if (paCandidates && paCandidates.length > 1) {
      return (
        <>
          <Typography variant="body2" color="text.secondary">
            Choisis la valeur à {mode === "DELETE" ? "supprimer" : "modifier"} :
          </Typography>
          <TextField
            select
            fullWidth
            label={mode === "DELETE" ? "Valeur à supprimer" : "Valeur à modifier"}
            value={selectedPaId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onChangeSelectedPaId?.(v === "" ? null : Number(v));
            }}
            SelectProps={{ displayEmpty: true }}
            sx={{ mt: 1 }}
          >
            {paCandidates?.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {formatDisplayValue(attr?.type, c.value)}
              </MenuItem>
            ))}
          </TextField>
        </>
      );
    }

    const ov = originalValue ? formatDisplayValue(attr?.type, originalValue) : "";
    return (
      <Typography variant="body2" color="text.secondary">
        Valeur actuelle : <strong>{ov}</strong>
      </Typography>
    );
  };

  const renderProposedInput = () => {
    if (!attr || (mode !== "UPDATE" && mode !== "CREATE")) return null;

    const t = attr.type;
    if (t === "DATE") {
      return (
        <DatePicker
          label={`${mode === "CREATE" ? "Valeur à ajouter" : "Nouvelle valeur"} (${attr.name})`}
          value={proposedValue ? dayjs(proposedValue) : null}
          onChange={(nv) => onChangeProposed(nv?.toISOString() || "")}
        />
      );
    }
    if (t === "DATETIME") {
      return (
        <DateTimePicker
          label={`${mode === "CREATE" ? "Valeur à ajouter" : "Nouvelle valeur"} (${attr.name})`}
          value={proposedValue ? dayjs(proposedValue) : null}
          onChange={(nv) => onChangeProposed(nv?.toISOString() || "")}
        />
      );
    }
    if (t === "BOOLEAN") {
      return (
        <Select
          value={proposedValue === "true" ? "true" : proposedValue === "false" ? "false" : ""}
          onChange={(e: SelectChangeEvent) => onChangeProposed(e.target.value as string)}
          displayEmpty
        >
          <MenuItem value="">
            <em>Choisir…</em>
          </MenuItem>
          <MenuItem value="true">Oui</MenuItem>
          <MenuItem value="false">Non</MenuItem>
        </Select>
      );
    }
    const inputType =
      t === "NUMBER" ? "number" :
      t === "EMAIL"  ? "email"  :
      t === "URL"    ? "url"    : "text";
    return (
      <TextField
        type={inputType}
        label={`${mode === "CREATE" ? "Valeur à ajouter" : "Nouvelle valeur"} (${attr.name})`}
        value={proposedValue}
        onChange={(e) => onChangeProposed(e.target.value)}
        fullWidth
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {attr && (
          <Typography variant="body2" color="text.secondary">
            Attribut : <strong>{attr.name}</strong>
          </Typography>
        )}

        {(mode === "UPDATE" || mode === "DELETE") && renderOriginalValue()}

        {renderProposedInput()}

        <TextField
          label="Motif (obligatoire)"
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          placeholder="Expliquez pourquoi ce changement est nécessaire…"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : <EditNoteIcon />}
        >
          {mode === "UPDATE"
            ? "Envoyer la demande"
            : mode === "DELETE"
            ? "Demander la suppression"
            : "Demander l'ajout"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRequestDialog;
