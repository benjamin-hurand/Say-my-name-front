import { Box, Chip, DialogTitle, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { AttributeFormHeaderChip } from "./attributeForm.types";

type Props = {
  isEdit: boolean;
  summaryChips: AttributeFormHeaderChip[];
};

export default function AttributeFormHeader({ isEdit, summaryChips }: Props) {
  const { t } = useTranslation();

  return (
    <DialogTitle sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1.75, flexShrink: 0 }}>
      <Stack spacing={1.25}>
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: "block", lineHeight: 1.2, letterSpacing: "0.12em", fontWeight: 700 }}
          >
            {t("ATTRIBUTE_FORM.HEADER_OVERLINE", {
              defaultValue: "Configuration du champ",
            })}
          </Typography>

          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.15 }}>
            {isEdit
              ? t("ATTRIBUTE_FORM.TITLE_EDIT", { defaultValue: "Modifier le champ" })
              : t("ATTRIBUTE_FORM.TITLE_CREATE", { defaultValue: "Creer un champ" })}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, maxWidth: 640 }}>
            {isEdit
              ? t("ATTRIBUTE_FORM.SUBTITLE_EDIT", {
                  defaultValue: "Ajuste ce champ sans exposer toute la complexite technique.",
                })
              : t("ATTRIBUTE_FORM.SUBTITLE_CREATE", {
                  defaultValue:
                    "Choisis l'information a ajouter. Le formulaire s'adapte automatiquement.",
                })}
          </Typography>
        </Box>

        {summaryChips.length > 0 ? (
          <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
            {summaryChips.map((chip) => (
              <Chip
                key={chip.label}
                size="small"
                label={chip.label}
                variant="outlined"
                sx={(theme) => ({
                  fontWeight: 600,
                  borderColor:
                    chip.color === "primary"
                      ? alpha(theme.palette.primary.main, 0.35)
                      : chip.color === "warning"
                        ? alpha(theme.palette.warning.main, 0.3)
                        : chip.color === "error"
                          ? alpha(theme.palette.error.main, 0.3)
                          : alpha(theme.palette.text.primary, 0.12),
                  backgroundColor:
                    chip.color === "primary"
                      ? alpha(theme.palette.primary.main, 0.08)
                      : chip.color === "warning"
                        ? alpha(theme.palette.warning.main, 0.08)
                        : chip.color === "error"
                          ? alpha(theme.palette.error.main, 0.08)
                          : alpha(theme.palette.text.primary, 0.04),
                })}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </DialogTitle>
  );
}
