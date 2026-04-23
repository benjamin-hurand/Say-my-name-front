import AbcRoundedIcon from "@mui/icons-material/AbcRounded";
import KeyboardCapslockRoundedIcon from "@mui/icons-material/KeyboardCapslockRounded";
import ShortTextRoundedIcon from "@mui/icons-material/ShortTextRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import { Box, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";
import type { CasingStrategy } from "../../../../../../models/commons/Attribute/Attribute";
import ChoiceCard from "../shared/ChoiceCard";

type Props = {
  control: Control<AttributeCreateFormInput>;
};

type CasingOption = {
  value: CasingStrategy;
  label: string;
  preview: string;
  icon: React.ReactNode;
};

export default function TextCasingForm({ control }: Props) {
  const { t } = useTranslation();

  const options: CasingOption[] = [
    {
      value: "NONE",
      label: t("ATTRIBUTE_FORM.CASING.NONE_LABEL", {
        defaultValue: "Saisie libre",
      }),
      preview: t("ATTRIBUTE_FORM.CASING.NONE_PREVIEW", {
        defaultValue: "direction produit",
      }),
      icon: <AbcRoundedIcon fontSize="small" />,
    },
    {
      value: "SENTENCE_PRESERVE",
      label: t("ATTRIBUTE_FORM.CASING.SENTENCE_PRESERVE_LABEL", {
        defaultValue: "Première lettre en majuscule",
      }),
      preview: t("ATTRIBUTE_FORM.CASING.SENTENCE_PRESERVE_PREVIEW", {
        defaultValue: "Direction produit",
      }),
      icon: <ShortTextRoundedIcon fontSize="small" />,
    },
    {
      value: "TITLE_CASE",
      label: t("ATTRIBUTE_FORM.CASING.TITLE_CASE_LABEL", {
        defaultValue: "Chaque mot en capitale",
      }),
      preview: t("ATTRIBUTE_FORM.CASING.TITLE_CASE_PREVIEW", {
        defaultValue: "Direction Produit",
      }),
      icon: <TitleRoundedIcon fontSize="small" />,
    },
    {
      value: "UPPERCASE",
      label: t("ATTRIBUTE_FORM.CASING.UPPERCASE_LABEL", {
        defaultValue: "Tout en majuscules",
      }),
      preview: t("ATTRIBUTE_FORM.CASING.UPPERCASE_PREVIEW", {
        defaultValue: "DIRECTION PRODUIT",
      }),
      icon: <KeyboardCapslockRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <Controller
      name="casingStrategy"
      control={control}
      render={({ field }) => (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {options.map((option) => {
            const selected = field.value === option.value;

            return (
              <ChoiceCard
                key={option.value}
                selected={selected}
                onClick={() => field.onChange(option.value)}
                icon={option.icon}
                minHeight={124}
                title={
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      letterSpacing: option.value === "UPPERCASE" ? 0.45 : 0,
                    }}
                  >
                    {option.preview}
                  </Typography>
                }
                subtitle={option.label}
              />
            );
          })}
        </Box>
      )}
    />
  );
}