import { DialogTitle, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  isEdit: boolean;
};

export default function AttributeFormHeader({ isEdit }: Props) {
  const { t } = useTranslation();

  return (
    <DialogTitle sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1.75, flexShrink: 0 }}>
      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.15 }}>
        {isEdit
          ? t("ATTRIBUTE_FORM.TITLE_EDIT", { defaultValue: "Modifier le champ" })
          : t("ATTRIBUTE_FORM.TITLE_CREATE", { defaultValue: "Creer un champ" })}
      </Typography>
    </DialogTitle>
  );
}
