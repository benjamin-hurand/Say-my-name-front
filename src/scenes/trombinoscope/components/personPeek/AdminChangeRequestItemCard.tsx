import React from "react";
import {
  Box,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

import { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { ChangeRequestItemSummary } from "../../../../models/commons/Profile/ChangeRequest";

// Types depuis le dialog parent
export type ItemDecision = "APPROVE" | "REJECT" | null;

type Props = {
  item: ChangeRequestItemSummary;
  attribute: Attribute | null;
  currentValue?: string; // pour UPDATE/DELETE
  decision: ItemDecision;
  onChangeDecision: (itemId: number, value: ItemDecision) => void;
  formatDisplayValue: (type: string | null | undefined, value: string) => string;
};

const ActionBadge: React.FC<{ action: "CREATE" | "UPDATE" | "DELETE" }> = ({ action }) => {
  if (action === "CREATE") {
    return <Chip size="small" icon={<AddRoundedIcon />} label="Ajouter" color="success" variant="outlined" sx={{ fontWeight: 600 }} />;
  }
  if (action === "UPDATE") {
    return <Chip size="small" icon={<EditRoundedIcon />} label="Modifier" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />;
  }
  return <Chip size="small" icon={<DeleteOutlineRoundedIcon />} label="Supprimer" color="error" variant="outlined" sx={{ fontWeight: 600 }} />;
};

/** Chip de valeur — plein largeur, neutre, avec option highlight */
const ValueChip: React.FC<{
  label: string;
  strike?: boolean;
  dim?: boolean;
  highlight?: boolean;
}> = ({ label, strike, dim, highlight }) => (
  <Chip
    size="small"
    variant="outlined"
    label={label || "—"}
    sx={(t) => ({
      width: "100%",
      borderRadius: 2,
      borderColor: alpha(t.palette.common.white, highlight ? 0.28 : 0.18),
      backgroundColor: highlight
        ? alpha(t.palette.primary.main, 0.10)
        : alpha(t.palette.common.white, 0.06),
      boxShadow: highlight ? `inset 0 0 0 1px ${alpha(t.palette.primary.main, 0.18)}` : "none",
      "& .MuiChip-label": {
        width: "100%",
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: "center",
        fontWeight: highlight ? 600 : 500,
        textDecoration: strike ? "line-through" : "none",
        opacity: dim ? 0.9 : 1,
        paddingTop: 0.5,     // un poil plus d’air
        paddingBottom: 0.5,
        letterSpacing: 0.2,
      },
    })}
  />
);

const AdminChangeRequestItemCard: React.FC<Props> = ({
  item,
  attribute,
  currentValue,
  decision,
  onChangeDecision,
  formatDisplayValue,
}) => {
  const type = attribute?.type ?? "TEXT";
  const proposed = item.proposedValue != null ? formatDisplayValue(type, item.proposedValue) : "—";
  const current = currentValue != null ? formatDisplayValue(type, currentValue) : "—";

  return (
    <Box
      sx={{
        p: 1,
        border: (t) => `1px solid ${alpha(t.palette.common.white, 0.12)}`,
        borderRadius: 1.25,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
        <ActionBadge action={item.action} />
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={decision}
          onChange={(_, val: ItemDecision) => onChangeDecision(item.id, val)}
          aria-label={`Décision item ${item.id}`}
        >
          <ToggleButton value="APPROVE" aria-label="Approuver">
            <DoneRoundedIcon fontSize="small" />
            &nbsp;Approuver
          </ToggleButton>
          <ToggleButton value="REJECT" aria-label="Rejeter">
            <ClearRoundedIcon fontSize="small" />
            &nbsp;Rejeter
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* CREATE — on met la valeur en "highlight" */}
      {item.action === "CREATE" && <ValueChip label={proposed} highlight />}

      {/* UPDATE — Actuel (neutre) vs Proposé (highlight) */}
      {item.action === "UPDATE" && (
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flexWrap: "wrap" }}>
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Actuel
            </Typography>
            <ValueChip label={current} />
          </Stack>
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Proposé
            </Typography>
            <ValueChip label={proposed} highlight />
          </Stack>
        </Stack>
      )}

      {/* DELETE — neutre barré */}
      {item.action === "DELETE" && (
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            À supprimer
          </Typography>
          <ValueChip label={current} strike dim />
        </Stack>
      )}
    </Box>
  );
};

export default AdminChangeRequestItemCard;
