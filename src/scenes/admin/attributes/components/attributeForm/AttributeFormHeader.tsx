import { Box, Chip, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { AttributeFormHeaderChip } from "./attributeForm.types";

type Props = {
  isEdit: boolean;
  summaryChips: AttributeFormHeaderChip[];
};

export default function AttributeFormHeader({ isEdit, summaryChips }: Props) {
  const { t } = useTranslation();

  return (
    <DialogTitle sx={{ pb: 1.5, flexShrink: 0 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={1}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {isEdit
              ? t("ATTRIBUTE_FORM.TITLE_EDIT", { defaultValue: "Modifier l’attribut" })
              : t("ATTRIBUTE_FORM.TITLE_CREATE", { defaultValue: "Créer un attribut" })}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {isEdit
              ? t("ATTRIBUTE_FORM.SUBTITLE_EDIT", {
                  defaultValue: "Ajuste cet attribut sans exposer toute la complexité technique.",
                })
              : t("ATTRIBUTE_FORM.SUBTITLE_CREATE", {
                  defaultValue:
                    "Choisis ce que représente cet attribut. Le formulaire s’adapte automatiquement.",
                })}
          </Typography>
        </Box>

        {summaryChips.length > 0 && (
          <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
            {summaryChips.map((chip) => (
              <Chip key={chip.label} size="small" label={chip.label} color={chip.color} />
            ))}
          </Stack>
        )}
      </Stack>
    </DialogTitle>
  );
}