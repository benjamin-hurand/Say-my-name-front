// src/scenes/profile/components/attributes/inputs/TypedValueInput.tsx
import React from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";

export type RowStatus = "idle" | "saving" | "success" | "error";
export type AttributeType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "URL"
  | "EMAIL";

type Props = {
  label: string;
  type: AttributeType;

  value: string;                   // valeur contrôlée (parent)
  status: RowStatus;               // état ligne (idle/saving/success/error)

  onChange: (v: string) => void;   // setAttrValue(...)
  onSave: () => void;              // handleManualSave(...)
  onCancel: () => void;            // handleCancelEdit(...)
  onBlur?: () => void;             // handleBlurRow(...)

  inputRef?: React.Ref<any>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

function getTypeValidation(type: AttributeType, value: string) {
  const v = (value ?? "").trim();
  switch (type) {
    case "TEXT":
      return { error: false, helper: "" };
    case "NUMBER": {
      if (v === "") return { error: true, helper: "Nombre requis" };
      const n = Number(v);
      return Number.isNaN(n)
        ? { error: true, helper: "Entrez un nombre valide" }
        : { error: false, helper: "" };
    }
    case "DATE": {
      if (v === "") return { error: true, helper: "Date requise" };
      const ok = dayjs(v).isValid();
      return ok
        ? { error: false, helper: "" }
        : { error: true, helper: "Format invalide (YYYY-MM-DD)" };
    }
    case "DATETIME": {
      if (v === "") return { error: true, helper: "Date/heure requise" };
      const ok = dayjs(v).isValid();
      return ok
        ? { error: false, helper: "" }
        : { error: true, helper: "Format invalide (ISO 8601)" };
    }
    case "BOOLEAN": {
      if (v === "") return { error: true, helper: "Choix requis" };
      const ok = v === "true" || v === "false";
      return ok
        ? { error: false, helper: "" }
        : { error: true, helper: "Valeur booléenne requise" };
    }
    case "URL": {
      if (v === "") return { error: true, helper: "URL requise" };
      return URL_RE.test(v)
        ? { error: false, helper: "" }
        : { error: true, helper: "URL invalide (http(s)://...)" };
    }
    case "EMAIL": {
      if (v === "") return { error: true, helper: "Email requis" };
      return EMAIL_RE.test(v)
        ? { error: false, helper: "" }
        : { error: true, helper: "Email invalide" };
    }
    default:
      return { error: false, helper: "" };
  }
}

const EndAdornment: React.FC<{
  status: RowStatus;
  disableSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}> = ({ status, disableSave, onSave, onCancel }) => (
  <>
    {status === "saving" && <CircularProgress size={16} />}
    {status === "success" && (
      <Typography sx={{ fontSize: 12, ml: 0.5 }}>✔</Typography>
    )}
    {status === "error" && (
      <Typography color="error" sx={{ fontSize: 12, ml: 0.5 }}>
        Erreur
      </Typography>
    )}
    <IconButton
      size="small"
      onMouseDown={(e) => e.preventDefault()}
      disabled={disableSave}
      onClick={onSave}
    >
      <SaveIcon fontSize="inherit" />
    </IconButton>
    <IconButton
      size="small"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onCancel}
    >
      <CloseIcon fontSize="inherit" />
    </IconButton>
  </>
);

const TypedValueInput: React.FC<Props> = ({
  label,
  type,
  value,
  status,
  onChange,
  onSave,
  onCancel,
  onBlur,
  inputRef,
}) => {
  const { error, helper } = getTypeValidation(type, value);
  const disableSave = error || status === "saving";

  const trySave = () => {
    if (!disableSave) onSave();
  };

  const tryBlur = () => {
    if (!error) onBlur?.();
  };

  // DATE
  if (type === "DATE") {
    return (
      <DatePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(nv) => onChange(nv?.toISOString() || "")}
        onAccept={tryBlur}
        onClose={tryBlur}
        slotProps={{
          textField: {
            size: "small",
            sx: { minWidth: 180 },
            inputRef,
            helperText: helper,
            error,
            InputProps: {
              endAdornment: (
                <EndAdornment
                  status={status}
                  disableSave={disableSave}
                  onSave={trySave}
                  onCancel={onCancel}
                />
              ),
            },
          },
        }}
      />
    );
  }

  // DATETIME
  if (type === "DATETIME") {
    return (
      <DateTimePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(nv) => onChange(nv?.toISOString() || "")}
        onAccept={tryBlur}
        onClose={tryBlur}
        slotProps={{
          textField: {
            size: "small",
            sx: { minWidth: 220 },
            inputRef,
            helperText: helper,
            error,
            InputProps: {
              endAdornment: (
                <EndAdornment
                  status={status}
                  disableSave={disableSave}
                  onSave={trySave}
                  onCancel={onCancel}
                />
              ),
            },
          },
        }}
      />
    );
  }

  // BOOLEAN
  if (type === "BOOLEAN") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Select
          size="small"
          value={value === "true" ? "true" : value === "false" ? "false" : ""}
          onChange={(e: SelectChangeEvent) => onChange(e.target.value as string)}
          onBlur={tryBlur}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="true">Oui</MenuItem>
          <MenuItem value="false">Non</MenuItem>
        </Select>
        <EndAdornment
          status={status}
          disableSave={disableSave}
          onSave={trySave}
          onCancel={onCancel}
        />
      </Box>
    );
  }

  // TEXT / NUMBER / EMAIL / URL → TextField
  const inputType =
    type === "NUMBER" ? "number" : type === "EMAIL" ? "email" : type === "URL" ? "url" : "text";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      trySave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <TextField
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      autoFocus
      inputRef={inputRef}
      onKeyDown={onKeyDown}
      onBlur={tryBlur}
      sx={{ minWidth: 200 }}
      error={error}
      helperText={helper}
      InputProps={{
        endAdornment: (
          <EndAdornment
            status={status}
            disableSave={disableSave}
            onSave={trySave}
            onCancel={onCancel}
          />
        ),
      }}
    />
  );
};

export default TypedValueInput;
