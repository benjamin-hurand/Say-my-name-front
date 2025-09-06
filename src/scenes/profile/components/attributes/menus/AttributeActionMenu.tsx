// src/scenes/profile/components/attributes/menus/AttributeActionMenu.tsx
import React from "react";
import { Menu, MenuItem } from "@mui/material";

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;

  canRequestUpdate?: boolean;
  canRequestDelete?: boolean;
  canRequestCreate?: boolean;

  onRequestUpdate?: () => void;
  onRequestDelete?: () => void;
  onRequestCreate?: () => void;
};

const AttributeActionMenu: React.FC<Props> = ({
  anchorEl,
  open,
  onClose,
  canRequestUpdate,
  canRequestDelete,
  canRequestCreate,
  onRequestUpdate,
  onRequestDelete,
  onRequestCreate,
}) => {
  const hasAny =
    !!canRequestUpdate || !!canRequestDelete || !!canRequestCreate;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {canRequestUpdate && (
        <MenuItem
          onClick={() => {
            onClose();
            onRequestUpdate?.();
          }}
        >
          Demander une modification
        </MenuItem>
      )}
      {canRequestDelete && (
        <MenuItem
          onClick={() => {
            onClose();
            onRequestDelete?.();
          }}
        >
          Demander la suppression
        </MenuItem>
      )}
      {canRequestCreate && (
        <MenuItem
          onClick={() => {
            onClose();
            onRequestCreate?.();
          }}
        >
          Demander un ajout
        </MenuItem>
      )}
      {!hasAny && <MenuItem disabled>Aucune action disponible</MenuItem>}
    </Menu>
  );
};

export default AttributeActionMenu;
