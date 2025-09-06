// src/scenes/profile/components/attributes/layout/AttributeRowLayout.tsx
import React from "react";
import { Box } from "@mui/material";

type Props = {
  label: React.ReactNode;
  children: React.ReactNode;        // zone valeurs
  statusSlot?: React.ReactNode;     // optionnel : badge(s) de statut
  actionsSlot?: React.ReactNode;    // icônes à droite
  labelMin?: number;                // (compat)
  labelMax?: number;                // fallback
  gap?: number;

  /** Largeur fixe locale de la colonne label (sinon --attr-label-w ou labelMax) */
  labelWidthPx?: number;

  /** Icônes d’actions atténuées, révélées au hover/focus (desktop) */
  revealActionsOnHover?: boolean;

  /** Opacité initiale des actions (desktop) quand reveal actif */
  actionsInitialOpacity?: number;
};

const AttributeRowLayout: React.FC<Props> = ({
  label,
  children,
  statusSlot,
  actionsSlot,
  labelMax = 110,
  gap = 1.5,
  labelWidthPx,
  revealActionsOnHover = true,
  actionsInitialOpacity = 0.65,
}) => {
  const hasStatus = Boolean(statusSlot);

  // Largeur de la colonne label : fixe (CSS var possible)
  const labelFixed = labelWidthPx
    ? `${labelWidthPx}px`
    : `var(--attr-label-w, ${labelMax}px)`;

  const labelCol = `${labelFixed}`;
  const valueCol = `minmax(0, 1fr)`;
  const statusCol = `fit-content(160px)`;
  const actionsCol = `fit-content(120px)`;

  const colsSm = hasStatus
    ? `${labelCol} ${valueCol} ${statusCol} ${actionsCol}`
    : `${labelCol} ${valueCol} ${actionsCol}`;

  const areasXs = hasStatus
    ? `"label" "value" "status" "actions"`
    : `"label" "value" "actions"`;

  const areasSm = hasStatus
    ? `"label value status actions"`
    : `"label value actions"`;

  return (
    <Box
      className="attr-row"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: colsSm },
        gridTemplateAreas: { xs: areasXs, sm: areasSm },
        columnGap: { xs: gap, sm: gap },
        rowGap: { xs: 0.75, sm: 1 },
        alignItems: "center",
        borderRadius: 1.5,
        px: 0,
        py: 0.75,
        transition: "background-color 160ms ease, outline-color 160ms ease",

        // ❌ plus de surbrillance des chips/tokens au hover de la ligne
        // (on ne modifie ni borderColor ni backgroundColor ici)

        // Révélation des actions : desktop = atténué par défaut, plein au hover / focus-within
        "& .attr-actions": {
          opacity: { xs: 1, sm: revealActionsOnHover ? actionsInitialOpacity : 1 },
          transition: "opacity 160ms ease",
        },
        "&:hover .attr-actions, &:focus-within .attr-actions": {
          opacity: 1,
        },
      }}
    >
      <Box sx={{ gridArea: "label", minWidth: 0 }}>{label}</Box>

      <Box
        sx={{
          gridArea: "value",
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          alignItems: "center",
          minWidth: 0,
        }}
      >
        {children}
      </Box>

      {hasStatus && (
        <Box
          className="attr-status"
          sx={{
            gridArea: "status",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 0.5,
            minWidth: 0,
          }}
        >
          {statusSlot}
        </Box>
      )}

      <Box
        className="attr-actions"
        sx={{
          gridArea: "actions",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          minWidth: 0,
        }}
      >
        {actionsSlot}
      </Box>
    </Box>
  );
};

export default AttributeRowLayout;
