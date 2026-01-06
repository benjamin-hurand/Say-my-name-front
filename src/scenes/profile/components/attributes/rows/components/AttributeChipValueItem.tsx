import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import dayjs from "dayjs";
import { alpha } from "@mui/material/styles";
import { Attribute } from "../../../../../../models/commons/Attribute/Attribute";
import { isFuture, PersonAttribute } from "../../../../../../models/commons/PersonAttribute";
import TypedValueInput from "../../inputs/TypedValueInput";

/** Gardé local ici pour éviter un 3ᵉ fichier "types". */
export type RowStatus = "idle" | "saving" | "success" | "error";

type ChipPA = Pick<PersonAttribute, "id" | "value" | "validFrom" | "validTo" | "pendingDelete">;
const isFutureChip = (pa: ChipPA) => isFuture({ validFrom: pa.validFrom });

export type ChipValueItemProps = {
  pa: ChipPA;
  attrDef: Attribute;
  rowEditMode: boolean;
  editingKey: string | null;
  status: RowStatus;
  attrValue: string;
  inputRef: React.Ref<any>;
  formatDisplayValue: (type: string | null | undefined, value: string) => string;
  allowDelete: boolean;
  inlineEditOnChipClickInEditMode: boolean;

  /** Marqueur de changement (utilisé dans le compositeur) : create/update ; delete géré via ghost list */
  changeMarker?: "create" | "update" | null;
  /** Rend la chip “fantôme” (suppression) : barrée, désaturée */
  ghost?: boolean;
  /** Callback pour annuler une suppression (utilisé pour les chips ghost) */
  onUndoDelete?: (paId: number) => void;

  onStartEdit: (rowKey: string, attributeId: number, paId: number | null, currentValue: string) => void;
  onCancelEdit: () => void;
  onChangeAttrValue: (v: string) => void;
  onLocalUpdate: (paId: number, newValue: string) => void;
  onLocalDelete: (paId: number) => void;
};

const AttributeChipValueItem: React.FC<ChipValueItemProps> = ({
  pa,
  attrDef,
  rowEditMode,
  editingKey,
  status,
  attrValue,
  inputRef,
  formatDisplayValue,
  allowDelete,
  inlineEditOnChipClickInEditMode,
  changeMarker = null,
  ghost = false,
  onUndoDelete,
  onStartEdit,
  onCancelEdit,
  onChangeAttrValue,
  onLocalUpdate,
  onLocalDelete,
}) => {
  const chipKey = `pa-${pa.id}`;
  const isFieldEditing = editingKey === chipKey;
  const raw = pa.value;
  const display = formatDisplayValue(attrDef.type, raw);

  // 🔒 Toujours prendre la dernière valeur tapée/choisie (évite stale closures)
  const latestValueRef = React.useRef(attrValue);
  React.useEffect(() => { latestValueRef.current = attrValue; }, [attrValue]);

  const labelRef = React.useRef<HTMLDivElement | null>(null);
  const [isMultiline, setIsMultiline] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = labelRef.current;
    if (!el) return;

    const measure = () => {
      requestAnimationFrame(() => {
        if (!labelRef.current) return;
        const node = labelRef.current;
        const EPS = 2;

        const cs = window.getComputedStyle(node);
        const lineHeight = parseFloat(cs.lineHeight || "0");
        const h = node.getBoundingClientRect().height;
        setIsMultiline(lineHeight > 0 ? h >= lineHeight * 1.5 : h > 24);

        const overflowY = node.scrollHeight - node.clientHeight > EPS;
        const overflowX = node.scrollWidth - node.clientWidth > EPS;
        setIsTruncated(overflowY || overflowX);
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const onWin = () => measure();
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [display, rowEditMode]);

  const clampedLabel = (
    <Box
      ref={labelRef}
      sx={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "normal",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        lineHeight: 1.25,
        textDecoration: ghost ? "line-through" : "none",
        color: ghost ? "text.secondary" : undefined,
      }}
    >
      {display || "—"}
    </Box>
  );

  const futureInfoText =
    isFutureChip(pa) && pa.validFrom
      ? `Actif le ${dayjs(pa.validFrom).format("DD/MM/YYYY HH:mm")}`
      : isFutureChip(pa)
      ? "Actif ultérieurement"
      : "";

  const markerInfoText =
    changeMarker === "create" ? "Ajout" : changeMarker === "update" ? "Modifié" : "";

  const tooltipTitle = (
    <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 480 }}>
      {isTruncated ? (display || "—") : null}

      {!rowEditMode && futureInfoText && (
        <Typography variant="caption" sx={{ display: "block", opacity: 0.8, mt: 0.5 }}>
          {futureInfoText}
        </Typography>
      )}

      {rowEditMode && markerInfoText && (
        <Typography variant="caption" sx={{ display: "block", opacity: 0.8, mt: 0.5 }}>
          {markerInfoText}
        </Typography>
      )}

      {rowEditMode && inlineEditOnChipClickInEditMode && !ghost && (
        <Typography variant="caption" sx={{ display: "block", opacity: 0.7, mt: 0.5 }}>
          Cliquer pour modifier
        </Typography>
      )}
    </Box>
  );

  const leadingIcon = !ghost
    ? !rowEditMode && isFutureChip(pa)
      ? <HourglassTopOutlinedIcon fontSize="small" />
      : changeMarker === "create"
      ? <AddRoundedIcon fontSize="small" />
      : changeMarker === "update"
      ? <EditOutlinedIcon fontSize="small" />
      : undefined
    : undefined;

  const borderTint = (t: any) => {
    if (ghost) return t.palette.divider;
    if (changeMarker === "create") return alpha(t.palette.success.main, 0.7);
    if (changeMarker === "update") return alpha(t.palette.info.main, 0.7);
    return undefined;
  };

  const showTooltip =
    isTruncated ||
    (!rowEditMode && !!futureInfoText) ||
    (rowEditMode && (inlineEditOnChipClickInEditMode || !!markerInfoText) && !ghost);

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, overflow: "visible" }}>
      {isFieldEditing ? (
        <Box>
          {/* ✅ Utiliser toujours TypedValueInput avec l’attribut complet */}
          <TypedValueInput
            attribute={attrDef}
            label={attrDef.name}
            value={attrValue}
            status={status}
            inputRef={inputRef}
            onChange={onChangeAttrValue}
            onSave={() => onLocalUpdate(pa.id, latestValueRef.current)}
            onCancel={onCancelEdit}
            onBlur={() => {
              /* pas d'auto-save au blur ici */
            }}
          />
          {/* Helper 'future' en édition */}
          {isFutureChip(pa) && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.secondary" }}>
              {futureInfoText || "Actif ultérieurement"}
            </Typography>
          )}
        </Box>
      ) : showTooltip ? (
        <Tooltip title={tooltipTitle} arrow>
          <Box sx={{ display: "inline-flex" }}>
            <Chip
              className={rowEditMode ? "attr-chip--edit" : "attr-chip"}
              icon={leadingIcon}
              label={clampedLabel}
              variant="outlined"
              onClick={
                rowEditMode && inlineEditOnChipClickInEditMode && !ghost
                  ? () => onStartEdit(chipKey, attrDef.id, pa.id, raw)
                  : undefined
              }
              onDelete={
                ghost
                  ? (onUndoDelete ? () => onUndoDelete(pa.id) : undefined)
                  : rowEditMode && allowDelete
                  ? () => onLocalDelete(pa.id)
                  : undefined
              }
              deleteIcon={ghost ? <UndoOutlinedIcon fontSize="small" /> : undefined}
              sx={{
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: (t) => borderTint(t) ?? (ghost ? t.palette.divider : undefined),
                opacity: ghost ? 0.75 : 1,
                "& .MuiChip-label": {
                  px: 2,
                  py: isMultiline ? 0.9 : 0.4,
                },
                maxWidth: { xs: "100%", sm: 360, md: 420 },
                alignSelf: "flex-start",
              }}
              aria-label={`${attrDef.name} : ${display || "vide"}${
                futureInfoText && !rowEditMode ? ` (${futureInfoText})` : ""
              }${markerInfoText && rowEditMode ? ` (${markerInfoText})` : ""}`}
            />
          </Box>
        </Tooltip>
      ) : (
        <Chip
          className={rowEditMode ? "attr-chip--edit" : "attr-chip"}
          icon={leadingIcon}
          label={clampedLabel}
          variant="outlined"
          onClick={
            rowEditMode && inlineEditOnChipClickInEditMode && !ghost
              ? () => onStartEdit(chipKey, attrDef.id, pa.id, raw)
              : undefined
          }
          onDelete={
            ghost
              ? (onUndoDelete ? () => onUndoDelete(pa.id) : undefined)
              : rowEditMode && allowDelete
              ? () => onLocalDelete(pa.id)
              : undefined
          }
          deleteIcon={ghost ? <UndoOutlinedIcon fontSize="small" /> : undefined}
          sx={{
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: (t) => borderTint(t) ?? (ghost ? t.palette.divider : undefined),
            opacity: ghost ? 0.75 : 1,
            "& .MuiChip-label": {
              px: 2,
              py: isMultiline ? 0.9 : 0.4,
            },
            maxWidth: { xs: "100%", sm: 360, md: 420 },
            alignSelf: "flex-start",
          }}
          aria-label={`${attrDef.name} : ${display || "vide"}${
            futureInfoText && !rowEditMode ? ` (${futureInfoText})` : ""
          }${markerInfoText && rowEditMode ? ` (${markerInfoText})` : ""}`}
        />
      )}
    </Box>
  );
};

export default AttributeChipValueItem;
