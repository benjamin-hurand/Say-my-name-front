import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { AttributeDeletionImpact } from "../../../../models/commons/Attribute/Attribute";

type Props = {
  open: boolean;
  attributeName: string;
  impact: AttributeDeletionImpact | null;
  onClose: () => void;
};

export default function AttributeDeletionBlockedDialog({
  open,
  attributeName,
  impact,
  onClose,
}: Props) {
  const { t } = useTranslation();

  const usageLines: string[] = [];
  if (impact) {
    if (impact.personCount > 0) {
      usageLines.push(
        t("ATTRIBUTE_UI.DELETE_BLOCKED_USED_BY_PERSONS", { count: impact.personCount })
      );
    }
    if (impact.courseCount > 0) {
      usageLines.push(
        t("ATTRIBUTE_UI.DELETE_BLOCKED_USED_BY_COURSES", { count: impact.courseCount })
      );
    }
    if (impact.pendingChangeRequestCount > 0) {
      usageLines.push(
        t("ATTRIBUTE_UI.DELETE_BLOCKED_PENDING_REQUESTS", {
          count: impact.pendingChangeRequestCount,
        })
      );
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {t("ATTRIBUTE_UI.DELETE_BLOCKED_TITLE", {
          name: attributeName,
          defaultValue: `Impossible de supprimer « ${attributeName} »`,
        })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <DialogContentText>
            {t("ATTRIBUTE_UI.DELETE_BLOCKED_REASON", {
              defaultValue: "Ce champ ne peut pas être supprimé car il contient des données.",
            })}
          </DialogContentText>
          {usageLines.length > 0 && (
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
              {usageLines.map((line) => (
                <Typography key={line} component="li" variant="body2" color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" autoFocus>
          {t("ATTRIBUTE_UI.DELETE_BLOCKED_CLOSE", { defaultValue: "Fermer" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
