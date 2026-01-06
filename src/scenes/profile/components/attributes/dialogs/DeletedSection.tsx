import { Typography, IconButton, Collapse, Divider } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { Attribute } from "../../../../../models/commons/Attribute/Attribute";
import AttributeChipValueItem from "../rows/components/AttributeChipValueItem";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

export const DeletedSection: React.FC<{
  deletedList: { id: number; value: string }[];
  attr: Attribute | null;
  formatDisplayValue: (type: string | null | undefined, value: string) => string;
  editMode: boolean;
  onUndo: (paId: number) => void;
}> = ({ deletedList, attr, formatDisplayValue, editMode, onUndo }) => {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Suppressions ({deletedList.length})
        </Typography>
        <IconButton size="small" onClick={toggle} aria-label="Voir/masquer">
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
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
            overflow: "visible",
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
              onUndoDelete={editMode ? () => onUndo(d.id) : undefined}
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
  );
};
