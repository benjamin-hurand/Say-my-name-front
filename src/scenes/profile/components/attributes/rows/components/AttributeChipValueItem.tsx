import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import dayjs from "dayjs";
import { Attribute } from "../../../../../../models/commons/Attribute";
import { isFuture, PersonAttributeFull } from "../../../../../../models/commons/PersonAttribute";
import TypedValueInput from "../../inputs/TypedValueInput";


/** Gardé local ici pour éviter un 3ᵉ fichier "types". */
export type RowStatus = "idle" | "saving" | "success" | "error";

type ChipPA = Pick<PersonAttributeFull, "id" | "value" | "validFrom" | "validTo" | "pendingDelete">;
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
      }}
    >
      {display || "—"}
    </Box>
  );

  const tooltipTitle = (
    <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 480 }}>
      {isTruncated ? (display || "—") : null}
      {rowEditMode && inlineEditOnChipClickInEditMode && (
        <Typography variant="caption" sx={{ display: "block", opacity: 0.7, mt: 0.5 }}>
          Cliquer pour modifier
        </Typography>
      )}
    </Box>
  );

  const chipVisual = (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <Chip
        className={rowEditMode ? "attr-chip--edit" : "attr-chip"}
        label={clampedLabel}
        variant="outlined"
        onClick={
          rowEditMode && inlineEditOnChipClickInEditMode
            ? () => onStartEdit(chipKey, attrDef.id, pa.id, raw)
            : undefined
        }
        onDelete={rowEditMode && allowDelete ? () => onLocalDelete(pa.id) : undefined}
        sx={{
          borderStyle: "solid",
          borderWidth: 1,
          "& .MuiChip-label": {
            px: 2,
            py: isMultiline ? 0.9 : 0.4,
          },
          maxWidth: { xs: "100%", sm: 360, md: 420 },
          alignSelf: "flex-start",
        }}
        aria-label={`${attrDef.name} : ${display || "vide"}`}
      />

      {isFutureChip(pa) && (
        <Tooltip
          title={
            pa.validFrom
              ? `Disponible à partir du ${dayjs(pa.validFrom).format("DD/MM/YYYY HH:mm")}`
              : "À venir"
          }
          arrow
        >
          <Box
            sx={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              backdropFilter: "blur(2px)",
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <HourglassTopOutlinedIcon sx={{ fontSize: 10, opacity: 0.8 }} />
          </Box>
        </Tooltip>
      )}
    </Box>
  );

  const showTooltip = isTruncated || (rowEditMode && inlineEditOnChipClickInEditMode);

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
      {isFieldEditing ? (
        <TypedValueInput
          label={attrDef.name}
          type={attrDef.type as any}
          value={attrValue}
          status={status}
          inputRef={inputRef}
          onChange={onChangeAttrValue}
          onSave={() => onLocalUpdate(pa.id, attrValue)}
          onCancel={onCancelEdit}
          onBlur={() => {
            /* no auto-save */
          }}
        />
      ) : showTooltip ? (
        <Tooltip title={tooltipTitle} arrow>
          {chipVisual}
        </Tooltip>
      ) : (
        chipVisual
      )}
    </Box>
  );
};

export default AttributeChipValueItem;
