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
import dayjs, { Dayjs } from "dayjs";
import { Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";
import { Attribute } from "../../../../../models/commons/Attribute/Attribute";

export type RowStatus = "idle" | "saving" | "success" | "error";

type Props = {
  attribute: Attribute | undefined;
  value: string;
  status: RowStatus;

  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onBlur?: () => void;

  inputRef?: React.Ref<any>;
  /** Optionnel : utilisé comme placeholder (pas comme label). */
  label?: string;

  /** Libellé custom pour l’option vide dans les Select (ENUM/SET/BOOLEAN). */
  selectEmptyLabel?: string;
  /** Cacher l’option vide (outre attribute.required). */
  hideEmptyOption?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

/** 🔧 Fix minimal anti-label coupé (sans doublons) */
const labelCutFixSx = {
  overflow: "visible",
  "& .MuiOutlinedInput-root": { overflow: "visible" },
} as const;

/** 🧩 Items shrinkables pour bien wrap en ligne */
const flexItemShrinkableSx = {
  display: "inline-flex",
  flex: "0 1 auto",
  maxWidth: "100%",
  overflow: "visible",
} as const;

/** 🧩 Style compact homogène pour Date/DateTime */
const compactFieldSx = {
  width: 170,
  maxWidth: "100%",
  "& .MuiInputBase-root": { height: 36, overflow: "visible" },
  "& input": { paddingTop: 0.5, paddingBottom: 0.5 },
  ...labelCutFixSx,
} as const;

// ---------- utils bas niveau ----------
function toRegExp(pattern?: string, caseInsensitive?: boolean): RegExp | null {
  if (!pattern) return null;
  try { return new RegExp(pattern, caseInsensitive ? "i" : undefined); }
  catch { return null; }
}

function numberInRange(n: number, min?: number | null, max?: number | null, inclusive = true): boolean {
  if (min != null && (inclusive ? n < min : n <= min)) return false;
  if (max != null && (inclusive ? n > max : n >= max)) return false;
  return true;
}

function parseMaybeNumber(s?: string | null): number | null {
  if (s == null || s === "") return null;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toDayjsDateOnly(s?: string | null): Dayjs | null {
  if (!s) return null;
  const str = s.length >= 10 ? s.substring(0, 10) : s;
  const d = dayjs(str, "YYYY-MM-DD", true);
  return d.isValid() ? d : null;
}

function clamp(n: number, min?: number | null, max?: number | null): number {
  let v = n;
  if (min != null) v = Math.max(v, min);
  if (max != null) v = Math.min(v, max);
  return v;
}
// --------------------------------------------

function getEffectiveNumberBounds(attribute?: Attribute): {
  min?: number; max?: number; step?: number
} {
  if (!attribute) return {};
  const r = attribute.constraint?.range;
  const step = r?.step ?? undefined;

  const minFromRange = parseMaybeNumber(r?.min);
  const maxFromRange = parseMaybeNumber(r?.max);
  if (minFromRange != null || maxFromRange != null) {
    return { min: minFromRange ?? undefined, max: maxFromRange ?? undefined, step };
  }

  const sMin = parseMaybeNumber(attribute.stats?.observedMin);
  const sMax = parseMaybeNumber(attribute.stats?.observedMax);
  if (sMin != null || sMax != null) {
    return { min: sMin ?? undefined, max: sMax ?? undefined, step };
  }
  return { step };
}

function getEffectiveDateBounds(attribute?: Attribute): {
  minD?: Dayjs; maxD?: Dayjs; minStr?: string; maxStr?: string;
} {
  if (!attribute) return {};
  const r = attribute.constraint?.range;
  const rMin = toDayjsDateOnly(r?.min) ?? undefined;
  const rMax = toDayjsDateOnly(r?.max) ?? undefined;
  if (rMin || rMax) {
    return {
      minD: rMin, maxD: rMax,
      minStr: rMin?.format("YYYY-MM-DD"),
      maxStr: rMax?.format("YYYY-MM-DD")
    };
  }
  const sMin = toDayjsDateOnly(attribute.stats?.observedMin) ?? undefined;
  const sMax = toDayjsDateOnly(attribute.stats?.observedMax) ?? undefined;
  if (sMin || sMax) {
    return {
      minD: sMin, maxD: sMax,
      minStr: sMin?.format("YYYY-MM-DD"),
      maxStr: sMax?.format("YYYY-MM-DD")
    };
  }
  return {};
}

function coerceOnBlurValue(attribute: Attribute | undefined, raw: string): string {
  if (!attribute) return raw;
  const trimmed = (raw ?? "").trim();

  if (attribute.type === "NUMBER") {
    const n = Number(trimmed.replace(",", "."));
    if (!Number.isFinite(n)) return raw;
    const { min, max, step } = getEffectiveNumberBounds(attribute);
    let v = clamp(n, min, max);
    if (step && step > 0) {
      const base = (min ?? 0);
      v = base + Math.round((v - base) / step) * step;
      v = clamp(v, min, max);
    }
    return String(v);
  }

  if (attribute.type === "DATE" || attribute.type === "DATETIME") {
    const d = trimmed ? dayjs(trimmed) : null;
    if (!d || !d.isValid()) return raw;
    const { minD, maxD } = getEffectiveDateBounds(attribute);
    let v = d;
    if (minD && v.isBefore(minD, "day")) v = minD;
    if (maxD && v.isAfter(maxD, "day")) v = maxD;
    return attribute.type === "DATE" ? v.format("YYYY-MM-DD") : v.toISOString();
  }
  return raw;
}

// ===== libellé “vide” intelligent =====
function emptyLabelFor(attribute?: Attribute, override?: string): string {
  if (override) return override;
  if (!attribute) return "Non renseigné";

  switch ((attribute.type ?? "").toUpperCase()) {
    case "DATE":
      return "Aucune date";
    case "DATETIME":
      return "Aucune date/heure";
    case "BOOLEAN":
      return "Non renseigné";
    default:
      return "Non renseigné";
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
    {status === "success" && <Typography sx={{ fontSize: 12, ml: 0.5 }}>✔</Typography>}
    {status === "error" && (
      <Typography color="error" sx={{ fontSize: 12, ml: 0.5 }}>Erreur</Typography>
    )}
    <IconButton
      size="small"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      disabled={disableSave}
      onClick={(e) => { e.stopPropagation(); onSave(); }}
      aria-label="Enregistrer"
    >
      <SaveIcon fontSize="inherit" />
    </IconButton>
    <IconButton
      size="small"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); onCancel(); }}
      aria-label="Annuler"
    >
      <CloseIcon fontSize="inherit" />
    </IconButton>
  </>
);

const TypedValueInput: React.FC<Props> = ({
  attribute,
  value,
  status,
  onChange,
  onSave,
  onCancel,
  onBlur,
  inputRef,
  label,
  selectEmptyLabel,
  hideEmptyOption,
}) => {
  const [touched, setTouched] = React.useState(false);

  const lastCommittedRef = React.useRef<string | null>(null);
  const commitAndAutoSave = (next: string) => {
    if (lastCommittedRef.current === next && value === next) return;
    onChange(next);
    lastCommittedRef.current = next;
    setTimeout(() => onSave(), 0);
  };

  React.useEffect(() => {
    setTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attribute?.id, inputRef]);

  const onUserChange = (v: string) => {
    if (!touched) setTouched(true);
    onChange(v);
  };

  // --------- validation ----------
  const constraint = attribute?.constraint;
  const kind = constraint?.kind; // "NONE" | "RANGE" | "REGEX" | "ENUM" | "SET"
  const trimmed = (value ?? "").trim();

  let invalid = false;
  let helper = "";

  switch (attribute?.type) {
    case "NUMBER": {
      if (trimmed !== "") {
        const n = Number(trimmed.replace(",", "."));
        if (Number.isNaN(n)) {
          invalid = true; helper = "Entrez un nombre valide";
        } else {
          const { min, max } = getEffectiveNumberBounds(attribute);
          const incl = constraint?.range?.inclusive ?? true;
          if (!numberInRange(n, min, max, incl)) {
            invalid = true; helper = `Hors bornes (${min ?? "-∞"} – ${max ?? "+∞"}${incl ? " inclus" : ""})`;
          }
        }
      }
      break;
    }
    case "DATE": {
      if (trimmed !== "" && !dayjs(trimmed).isValid()) {
        invalid = true; helper = "Format invalide (YYYY-MM-DD)";
      } else if (trimmed !== "") {
        const { minD, maxD } = getEffectiveDateBounds(attribute);
        const d = dayjs(trimmed);
        if (minD && d.isBefore(minD, "day")) { invalid = true; helper = `Date ≥ ${minD.format("YYYY-MM-DD")}`; }
        if (!invalid && maxD && d.isAfter(maxD, "day")) { invalid = true; helper = `Date ≤ ${maxD.format("YYYY-MM-DD")}`; }
      }
      break;
    }
    case "DATETIME": {
      if (trimmed !== "" && !dayjs(trimmed).isValid()) {
        invalid = true; helper = "Format invalide (ISO 8601)";
      } else if (trimmed !== "") {
        const { minD, maxD } = getEffectiveDateBounds(attribute);
        const d = dayjs(trimmed);
        if (minD && d.isBefore(minD)) { invalid = true; helper = `Date/heure ≥ ${minD.format("YYYY-MM-DD")}`; }
        if (!invalid && maxD && d.isAfter(maxD)) { invalid = true; helper = `Date/heure ≤ ${maxD.format("YYYY-MM-DD")}`; }
      }
      break;
    }
    case "BOOLEAN": {
      if (trimmed !== "" && !(trimmed === "true" || trimmed === "false")) {
        invalid = true; helper = "Valeur booléenne requise";
      }
      break;
    }
    case "URL": {
      if (trimmed !== "" && !URL_RE.test(trimmed)) { invalid = true; helper = "URL invalide (http(s)://...)"; }
      break;
    }
    case "EMAIL": {
      if (trimmed !== "" && !EMAIL_RE.test(trimmed)) { invalid = true; helper = "Email invalide"; }
      break;
    }
  }

  if (!invalid && kind === "REGEX" && constraint?.regex) {
    const rx = toRegExp(constraint.regex.pattern ?? undefined, constraint.regex.caseInsensitive ?? false);
    if (trimmed !== "" && rx && !rx.test(trimmed)) { invalid = true; helper = "Format non conforme au motif requis"; }
    if (!invalid && constraint.regex.minLength != null && trimmed.length < constraint.regex.minLength) {
      invalid = true; helper = `Taille min: ${constraint.regex.minLength}`;
    }
    if (!invalid && constraint.regex.maxLength != null && trimmed.length > constraint.regex.maxLength) {
      invalid = true; helper = `Taille max: ${constraint.regex.maxLength}`;
    }
  }

  if (!invalid && kind === "SET" && constraint?.set) {
    const allowed = constraint.set.values ?? [];
    if (trimmed !== "" && !allowed.includes(trimmed) && constraint.set.strict !== false) {
      invalid = true; helper = "Valeur non autorisée";
    }
  }

  if (!invalid && attribute?.type === "ENUM") {
    const opts = attribute.options ?? [];
    const storeCode = attribute.constraint?.enumRule?.storeCode ?? true;
    if (trimmed !== "") {
      const exists = storeCode ? opts.some(o => o.code === trimmed) : opts.some(o => o.label === trimmed);
      if (!exists) { invalid = true; helper = "Choisissez une option de la liste"; }
    }
  }

  const showError = touched && invalid;
  const disableSave = showError || status === "saving";

  const trySave = () => { if (!disableSave) onSave(); };
  const tryBlur = () => {
    const coerced = coerceOnBlurValue(attribute, value);
    if (coerced !== value) onChange(coerced);
    if (!touched) setTouched(true);
    onBlur?.();
  };

  const placeholder = (label ?? attribute?.name ?? "") || undefined;

  // ===== Helpers Select communs =====
  const showEmptyOption = !attribute?.required && !hideEmptyOption;
  const emptyOptionLabel = emptyLabelFor(attribute, selectEmptyLabel);
  const commonMenuProps = {
    MenuProps: {
      PaperProps: { sx: { maxHeight: 320, mt: 0.5 } },
      MenuListProps: { dense: true, "aria-label": placeholder },
    },
  } as const;

  // ===== ENUM -> Select (Autosave, PAS de boutons) =====
  if (attribute?.type === "ENUM") {
    const opts = attribute.options ?? [];
    const storeCode = attribute.constraint?.enumRule?.storeCode ?? true;
    const currentValue = value ?? "";

    return (
      <FormControl size="small" sx={{ width: 220, ...flexItemShrinkableSx, ...labelCutFixSx }} error={showError}>
        <Select
          displayEmpty
          value={currentValue}
          onChange={(e: SelectChangeEvent) => {
            const next = e.target.value as string;
            if (!touched) setTouched(true);
            commitAndAutoSave(next);
          }}
          onBlur={tryBlur}
          renderValue={(v) =>
            v
              ? (storeCode
                  ? (opts.find(o => o.code === v)?.label ?? (v as string))
                  : (v as string))
              : <span style={{ color: "#888" }}>{placeholder ?? "Choisir…"}</span>
          }
          inputProps={{ "aria-label": placeholder }}
          {...commonMenuProps}
        >
          {showEmptyOption && (
            <MenuItem value="">
              <em>{emptyOptionLabel}</em>
            </MenuItem>
          )}
          {opts.map(o => (
            <MenuItem key={o.id ?? `${o.code}-${o.label}`} value={storeCode ? o.code : o.label}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
        {showError && <FormHelperText sx={{ m: 0, mt: 0.25 }}>{helper}</FormHelperText>}
      </FormControl>
    );
  }

  // ===== SET -> Select (Autosave, PAS de boutons) =====
  if (kind === "SET" && attribute?.constraint?.set?.values?.length) {
    const allowed = attribute.constraint.set.values;
    return (
      <FormControl size="small" sx={{ width: 220, ...flexItemShrinkableSx, ...labelCutFixSx }} error={showError}>
        <Select
          displayEmpty
          value={value ?? ""}
          onChange={(e: SelectChangeEvent) => {
            const next = e.target.value as string;
            if (!touched) setTouched(true);
            commitAndAutoSave(next);
          }}
          onBlur={tryBlur}
          renderValue={(v) =>
            v ? (v as string) : <span style={{ color: "#888" }}>{placeholder ?? "Choisir…"}</span>
          }
          inputProps={{ "aria-label": placeholder }}
          {...commonMenuProps}
        >
          {showEmptyOption && (
            <MenuItem value="">
              <em>{emptyOptionLabel}</em>
            </MenuItem>
          )}
          {allowed.map(v => (
            <MenuItem key={v} value={v}>{v}</MenuItem>
          ))}
        </Select>
        {showError && <FormHelperText sx={{ m: 0, mt: 0.25 }}>{helper}</FormHelperText>}
      </FormControl>
    );
  }

  // ===== DATE — autosave onAccept =====
  if (attribute?.type === "DATE") {
    const { minD, maxD, minStr, maxStr } = getEffectiveDateBounds(attribute);

    return (
      <Box sx={{ ...flexItemShrinkableSx, alignSelf: "flex-start" }}>
        <DatePicker
          value={value ? dayjs(value) : null}
          onChange={(nv) => {
            if (nv && nv.isValid()) onUserChange(nv.format("YYYY-MM-DD"));
            else onUserChange("");
          }}
          onAccept={(nv) => {
            const next = nv && nv.isValid() ? nv.format("YYYY-MM-DD") : "";
            commitAndAutoSave(next);
          }}
          minDate={minD}
          maxDate={maxD}
          slotProps={{
            textField: {
              size: "small",
              sx: compactFieldSx,
              inputRef,
              placeholder,
              inputProps: { min: minStr, max: maxStr, "aria-label": placeholder },
            },
            openPickerButton: { size: "small" },
          }}
        />
        {showError && <FormHelperText error sx={{ m: 0, mt: 0.25 }}>{helper}</FormHelperText>}
      </Box>
    );
  }

  // ===== DATETIME — autosave onAccept =====
  if (attribute?.type === "DATETIME") {
    const { minD, maxD } = getEffectiveDateBounds(attribute);

    return (
      <Box sx={{ ...flexItemShrinkableSx, alignSelf: "flex-start" }}>
        <DateTimePicker
          value={value ? dayjs(value) : null}
          onChange={(nv) => {
            if (nv && nv.isValid()) onUserChange(nv.toISOString());
            else onUserChange("");
          }}
          onAccept={(nv) => {
            const next = nv && nv.isValid() ? nv.toISOString() : "";
            commitAndAutoSave(next);
          }}
          minDateTime={minD}
          maxDateTime={maxD}
          slotProps={{
            textField: {
              size: "small",
              sx: { ...compactFieldSx, width: 200 },
              inputRef,
              placeholder,
            },
            openPickerButton: { size: "small" },
          }}
        />
        {showError && <FormHelperText error sx={{ m: 0, mt: 0.25 }}>{helper}</FormHelperText>}
      </Box>
    );
  }

  // ===== BOOLEAN -> Select (Autosave, PAS de boutons) =====
  if (attribute?.type === "BOOLEAN") {
    return (
      <FormControl size="small" sx={{ width: 220, ...flexItemShrinkableSx, ...labelCutFixSx }} error={showError}>
        <Select
          value={value === "true" ? "true" : value === "false" ? "false" : ""}
          displayEmpty
          onChange={(e: SelectChangeEvent) => {
            const next = e.target.value as string;
            if (!touched) setTouched(true);
            commitAndAutoSave(next);
          }}
          onBlur={tryBlur}
          renderValue={(v) =>
            v ? (v === "true" ? "Oui" : "Non") : <span style={{ color: "#888" }}>{placeholder ?? "Choisir…"}</span>
          }
          inputProps={{ "aria-label": placeholder }}
          {...commonMenuProps}
        >
          {showEmptyOption && (
            <MenuItem value="">
              <em>{emptyOptionLabel}</em>
            </MenuItem>
          )}
          <MenuItem value="true">Oui</MenuItem>
          <MenuItem value="false">Non</MenuItem>
        </Select>
        {showError && <FormHelperText sx={{ m: 0, mt: 0.25 }}>{helper}</FormHelperText>}
      </FormControl>
    );
  }

  // ===== TEXT / NUMBER / EMAIL / URL (avec boutons save/cancel) =====
  const inputType =
    attribute?.type === "NUMBER" ? "number" :
    attribute?.type === "EMAIL" ? "email" :
    attribute?.type === "URL" ? "url" : "text";

  const { min: minAttr, max: maxAttr, step } = attribute?.type === "NUMBER"
    ? getEffectiveNumberBounds(attribute)
    : {};

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const coerced = coerceOnBlurValue(attribute, value);
      if (coerced !== value) onChange(coerced);
      setTouched(true);
      setTimeout(() => onSave(), 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <Box sx={{ ...flexItemShrinkableSx, alignSelf: "flex-start" }}>
      <TextField
        type={inputType}
        placeholder={label ?? attribute?.name ?? ""}
        value={value}
        onChange={(e) => onUserChange(e.target.value)}
        size="small"
        autoFocus
        inputRef={inputRef}
        onKeyDown={onKeyDown}
        onBlur={tryBlur}
        sx={{ width: 220, ...labelCutFixSx }}
        inputProps={{
          step: step ?? undefined,
          min: minAttr,
          max: maxAttr,
          pattern: kind === "REGEX" && attribute?.constraint?.regex?.pattern
            ? attribute.constraint.regex.pattern
            : undefined,
          "aria-label": label ?? attribute?.name ?? "",
          inputMode: attribute?.type === "NUMBER" ? "decimal" : undefined,
        }}
        InputProps={{
          endAdornment: (
            <EndAdornment
              status={status}
              disableSave={showError || status === "saving"}
              onSave={() => { if (!(showError || status === "saving")) onSave(); }}
              onCancel={onCancel}
            />
          )
        }}
        error={showError}
        helperText={showError ? helper : undefined}
      />
    </Box>
  );
};

export default TypedValueInput;
