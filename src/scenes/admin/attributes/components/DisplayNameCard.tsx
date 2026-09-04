import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { resolveDisplayNameSummary } from "./identity.utils";

type Props = {
  /** Attributes visible in the admin list (system IDENTITY already excluded). */
  attributes: Attribute[];
  onAddField: () => void;
};

/**
 * Purely informative: the backend now determines the displayed name
 * automatically from FIRST_NAME/LAST_NAME, in that fixed order. There is
 * nothing left here for the admin to configure or reorder.
 */
export default function DisplayNameCard({ attributes, onAddField }: Props) {
  const { t } = useTranslation();

  const firstName = attributes.find((a) => a.conceptCode === "FIRST_NAME") ?? null;
  const lastName = attributes.find((a) => a.conceptCode === "LAST_NAME") ?? null;
  const summary = resolveDisplayNameSummary(firstName, lastName);

  if (summary.kind === "empty") {
    return (
      <Card variant="outlined">
        <CardContent sx={{ py: 1.5, px: { xs: 2, sm: 2.5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <FingerprintRoundedIcon fontSize="small" color="disabled" />
              <Typography variant="body2" color="text.secondary">
                {t("ATTRIBUTE_UI.DISPLAY_NAME.EMPTY", {
                  defaultValue: "Ajoutez un champ Prénom ou Nom pour identifier les membres.",
                })}
              </Typography>
            </Stack>

            <Button
              type="button"
              size="small"
              variant="text"
              startIcon={<AddRoundedIcon />}
              onClick={onAddField}
              sx={{ whiteSpace: "nowrap", alignSelf: { xs: "stretch", sm: "center" } }}
            >
              {t("ATTRIBUTE_PAGE.ADD_ATTRIBUTE", { defaultValue: "Ajouter un champ" })}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const composedLabelDefaults: Record<typeof summary.labelKey, string> = {
    BOTH_LABEL: "Prénom + Nom",
    FIRST_ONLY_LABEL: "Prénom",
    LAST_ONLY_LABEL: "Nom",
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5, px: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <FingerprintRoundedIcon fontSize="small" color="primary" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" component="div">
                {t("ATTRIBUTE_UI.DISPLAY_NAME.LABEL", { defaultValue: "Nom affiché" })}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {t(`ATTRIBUTE_UI.DISPLAY_NAME.${summary.labelKey}`, {
                  defaultValue: composedLabelDefaults[summary.labelKey],
                })}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {t("ATTRIBUTE_UI.DISPLAY_NAME.PREVIEW", {
              value: summary.preview,
              defaultValue: `Aperçu : ${summary.preview}`,
            })}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
