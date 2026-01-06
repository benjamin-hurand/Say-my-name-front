import {
  Box,
  Button,
  Checkbox,
  Divider, List, ListItemButton,
  ListItemIcon, ListItemText,
  Popover
} from "@mui/material";
import { useMemo } from "react";
import { Attribute } from "../../../models/commons/Attribute/Attribute";

type ColumnMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  allColumns: Attribute[];     // toutes les colonnes "extra"
  visibleIds: number[];        // ids visibles actuels
  onChange: (nextIds: number[]) => void;

  // presets optionnels (tu peux les charger / sauver ailleurs, pas d'UI ici)
  defaultPresetIds?: number[]; // “Par défaut”
  minimalPresetIds?: number[]; // “Minimal”
  userPresetIds?: number[];    // “Mes colonnes”
};

export default function ColumnMenu({
  anchorEl, onClose,
  allColumns, visibleIds, onChange,
}: ColumnMenuProps) {
  const open = Boolean(anchorEl);

  const allIds = useMemo(() => allColumns.map(c => c.id), [allColumns]);

  const toggle = (id: number) => {
    onChange(visibleIds.includes(id) ? visibleIds.filter(x => x !== id) : [...visibleIds, id]);
  };

  const selectAll = () => onChange(allIds);
  const selectNone = () => onChange([]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{ sx: { width: 300, maxHeight: 420, p: 1 } }}
    >
      {/* Actions bulk */}
    <Box sx={{ p: 1, pt: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Button size="small" onClick={selectAll}>Tout sélectionner</Button>
      <Button size="small" onClick={selectNone}>Tout désélectionner</Button>
    </Box>
    <Divider />
      {/* Liste des colonnes (pas de recherche, < 10 items) */}
      <List dense disablePadding sx={{ overflowY: "auto" }}>
        {allColumns.map(col => {
          const checked = visibleIds.includes(col.id);
          return (
            <ListItemButton key={col.id} onClick={() => toggle(col.id)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox size="small" edge="start" checked={checked} tabIndex={-1} disableRipple />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ variant: "body2" }} primary={col.name} />
            </ListItemButton>
          );
        })}
      </List>
    </Popover>
  );
}
