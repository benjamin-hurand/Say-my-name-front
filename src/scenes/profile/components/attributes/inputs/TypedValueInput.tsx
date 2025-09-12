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
  FormControl,
  FormHelperText,
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

function computeValidation(type: AttributeType, value: string) {
  const v = (value ?? "").trim();

  // On NE gère pas "requis" ici : seulement la validité si non vide.
  switch (type) {
    case "TEXT":
      return { invalid: false, helper: "" };

    case "NUMBER": {
      if (v === "") return { invalid: false, helper: "" };
      const n = Number(v.replace(",", ".")); // tolère la virgule
      return Number.isNaN(n)
        ? { invalid: true, helper: "Entrez un nombre valide" }
        : { invalid: false, helper: "" };
    }

    case "DATE": {
      if (v === "") return { invalid: false, helper: "" };
      const ok = dayjs(v).isValid();
      return ok
        ? { invalid: false, helper: "" }
        : { invalid: true, helper: "Format invalide (YYYY-MM-DD)" };
    }

    case "DATETIME": {
      if (v === "") return { invalid: false, helper: "" };
      const ok = dayjs(v).isValid();
      return ok
        ? { invalid: false, helper: "" }
        : { invalid: true, helper: "Format invalide (ISO 8601)" };
    }

    case "BOOLEAN": {
      if (v === "") return { invalid: false, helper: "" };
      const ok = v === "true" || v === "false";
      return ok
        ? { invalid: false, helper: "" }
        : { invalid: true, helper: "Valeur booléenne requise" };
    }

    case "URL": {
      if (v === "") return { invalid: false, helper: "" };
      return URL_RE.test(v)
        ? { invalid: false, helper: "" }
        : { invalid: true, helper: "URL invalide (http(s)://...)" };
    }

    case "EMAIL": {
      if (v === "") return { invalid: false, helper: "" };
      return EMAIL_RE.test(v)
        ? { invalid: false, helper: "" }
        : { invalid: true, helper: "Email invalide" };
    }

    default:
      return { invalid: false, helper: "" };
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
      onMouseDown={(e) => {
        // important : ne pas laisser filer au listener global (capture)
        e.preventDefault();
        e.stopPropagation();
      }}
      disabled={disableSave}
      onClick={(e) => {
        e.stopPropagation();
        onSave();
      }}
    >
      <SaveIcon fontSize="inherit" />
    </IconButton>
    <IconButton
      size="small"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <CloseIcon fontSize="inherit" />
    </IconButton>
  </>
);

// ancre l'input en haut de la ligne (évite le "sursaut" du centrage vertical)
const anchorTopSx = { alignSelf: "flex-start" } as const;

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
  // On n'affiche l'erreur qu'après interaction
  const [touched, setTouched] = React.useState(false);

  // reset quand on change de type / de ref (nouvelle édition)
  React.useEffect(() => {
    setTouched(false);
  }, [type, inputRef]);

  const onUserChange = (v: string) => {
    if (!touched) setTouched(true);
    onChange(v);
  };

  const { invalid, helper } = computeValidation(type, value);
  const showError = touched && invalid;

  // On bloque "save" seulement si invalide (après interaction) ou si saving
  const disableSave = showError || status === "saving";

  const trySave = () => {
    if (!disableSave) onSave();
  };

  const tryBlur = () => {
    if (!touched) setTouched(true);
    onBlur?.();
  };

  // DATE
  if (type === "DATE") {
    return (
      <Box sx={{ display: "inline-flex", flexDirection: "column", ...anchorTopSx }}>
        <DatePicker
          label={label}
          value={value ? dayjs(value) : null}
          onChange={(nv) => onUserChange(nv?.toISOString() || "")}
          onAccept={tryBlur}
          onClose={tryBlur}
          slotProps={{
            textField: {
              size: "small",
              sx: { minWidth: 180 },
              inputRef,
              // pas de helperText ici → pas d'espace tant qu'il n'y a pas d'erreur
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
        {showError && (
          <FormHelperText error sx={{ m: 0, mt: 0.25 }}>
            {helper}
          </FormHelperText>
        )}
      </Box>
    );
  }

  // DATETIME
  if (type === "DATETIME") {
    return (
      <Box sx={{ display: "inline-flex", flexDirection: "column", ...anchorTopSx }}>
        <DateTimePicker
          label={label}
          value={value ? dayjs(value) : null}
          onChange={(nv) => onUserChange(nv?.toISOString() || "")}
          onAccept={tryBlur}
          onClose={tryBlur}
          slotProps={{
            textField: {
              size: "small",
              sx: { minWidth: 220 },
              inputRef,
              // pas de helperText ici
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
        {showError && (
          <FormHelperText error sx={{ m: 0, mt: 0.25 }}>
            {helper}
          </FormHelperText>
        )}
      </Box>
    );
  }

  // BOOLEAN
  if (type === "BOOLEAN") {
    return (
      <FormControl size="small" sx={{ minWidth: 120, ...anchorTopSx }} error={showError}>
        <Select
          value={value === "true" ? "true" : value === "false" ? "false" : ""}
          onChange={(e: SelectChangeEvent) => {
            if (!touched) setTouched(true);
            onChange(e.target.value as string);
          }}
          onBlur={tryBlur}
        >
          <MenuItem value="true">Oui</MenuItem>
          <MenuItem value="false">Non</MenuItem>
        </Select>

        {showError && (
          <FormHelperText sx={{ m: 0, mt: 0.25 }}>{helper}</FormHelperText>
        )}

        <Box sx={{ mt: 0.5, ml: 0.5 }}>
          <EndAdornment
            status={status}
            disableSave={disableSave}
            onSave={trySave}
            onCancel={onCancel}
          />
        </Box>
      </FormControl>
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
    <Box sx={{ display: "inline-flex", flexDirection: "column", ...anchorTopSx }}>
      <TextField
        type={inputType}
        value={value}
        onChange={(e) => onUserChange(e.target.value)}
        size="small"
        autoFocus
        inputRef={inputRef}
        onKeyDown={onKeyDown}
        onBlur={tryBlur}
        sx={{ minWidth: 200 }}
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
      {showError && (
        <FormHelperText error sx={{ m: 0, mt: 0.25 }}>
          {helper}
        </FormHelperText>
      )}
    </Box>
  );
};

export default TypedValueInput;
