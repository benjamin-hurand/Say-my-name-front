import { DialogTitle, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  currentStep: 1 | 2;
  isEdit: boolean;
  summary?: ReactNode;
};

export default function AttributeFormHeader({ currentStep, isEdit, summary }: Props) {
  const { t } = useTranslation();

  return (
    <DialogTitle sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1.5, flexShrink: 0 }}>
      <Stack spacing={0.4}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={2}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.15 }}>
            {isEdit
              ? t("ATTRIBUTE_FORM.WIZARD_TITLE_EDIT", {
                  defaultValue: "Modifier le champ",
                })
              : currentStep === 1
                ? t("ATTRIBUTE_FORM.WIZARD_TITLE_CREATE", {
                    defaultValue: "Créer un champ",
                  })
                : t("ATTRIBUTE_FORM.WIZARD_TITLE_CONFIGURE", {
                    defaultValue: "Configurer le champ",
                  })}
          </Typography>
          {!isEdit ? (
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {t("ATTRIBUTE_FORM.WIZARD_STEP", {
                current: currentStep,
                total: 2,
                defaultValue: "Étape {{current}} sur {{total}}",
              })}
            </Typography>
          ) : null}
        </Stack>
        {summary}
      </Stack>
    </DialogTitle>
  );
}
