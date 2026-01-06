import React from "react";
import { Slide, Paper, Stack, Button, Chip, Tooltip } from "@mui/material";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import PersonRemoveAlt1OutlinedIcon from "@mui/icons-material/PersonRemoveAlt1Outlined";
import ClearAllIcon from "@mui/icons-material/ClearAll";

type Props = {
  visible: boolean;
  selectionLabel: string;
  selectionCount: number;
  onClearSelection: () => void;
  onBulkFollow?: () => void;
  onBulkUnfollow?: () => void;
};

const SelectionToolbar: React.FC<Props> = ({
  visible, selectionLabel, selectionCount, onClearSelection, onBulkFollow, onBulkUnfollow,
}) => {
  return (
    <Slide in={visible} direction="down" mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) => t.palette.action.hover,
          px: 1, py: 0.75,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
          {/* Compteur centré */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, justifyContent: "center" }}>
            <Chip label={selectionLabel} color="primary" variant="outlined" />
          </Stack>

          {/* CTAs à droite */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              startIcon={<PersonAddAlt1OutlinedIcon />}
              disabled={selectionCount === 0}
              onClick={onBulkFollow}
              variant="contained"
            >
              Suivre
            </Button>
            <Button
              size="small"
              startIcon={<PersonRemoveAlt1OutlinedIcon />}
              disabled={selectionCount === 0}
              onClick={onBulkUnfollow}
              variant="outlined"
            >
              Ne plus suivre
            </Button>

            <Tooltip title="Vider la sélection">
              <span>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ClearAllIcon />}
                  onClick={onClearSelection}
                  disabled={selectionCount === 0}
                >
                  Vider
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>
    </Slide>
  );
};

export default SelectionToolbar;
