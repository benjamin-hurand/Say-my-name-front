import { Alert, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

type Props = {
  duplicateSystemConceptBlocked: boolean;
  conceptTypeMismatch: boolean;
};

export default function AttributeFormAlerts({
  duplicateSystemConceptBlocked,
  conceptTypeMismatch,
}: Props) {
  const { t } = useTranslation();

  const commonSx = (theme: Theme) => ({
    py: 0.25,
    px: 0.75,
    borderRadius: 2,
    alignItems: "center",
    border: `1px solid ${alpha(theme.palette.error.main, 0.18)}`,
    backgroundColor: alpha(theme.palette.error.main, 0.05),
    "& .MuiAlert-icon": {
      py: 0.75,
      fontSize: 18,
    },
    "& .MuiAlert-message": {
      py: 0.8,
      fontSize: theme.typography.body2.fontSize,
      lineHeight: 1.45,
    },
  });

  return (
    <Stack spacing={1.25}>
      {duplicateSystemConceptBlocked ? (
        <Alert severity="error" sx={commonSx}>
          {t("ATTRIBUTE_FORM.DUPLICATE_SYSTEM_CONCEPT_TEXT", {
            defaultValue: "Ce modele ne peut etre utilise qu'une seule fois dans cet espace.",
          })}
        </Alert>
      ) : null}

      {conceptTypeMismatch ? (
        <Alert severity="error" sx={commonSx}>
          {t("ATTRIBUTE_FORM.TYPE_MISMATCH_TEXT", {
            defaultValue: "Le type de donnee ne correspond pas au modele selectionne.",
          })}
        </Alert>
      ) : null}
    </Stack>
  );
}
