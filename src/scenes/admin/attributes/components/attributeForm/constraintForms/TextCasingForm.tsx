import { Box, Button } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";
import type { CasingStrategy } from "../../../../../../models/commons/Attribute/Attribute";
import { applyCasingPreview } from "../attributeForm.casing";
import { resolveCasingPreviewSource } from "../attributeForm.semanticRegistry";
import ChoiceCard from "../shared/ChoiceCard";

type Props = {
  control: Control<AttributeCreateFormInput>;
  selectedConceptCode: string | null;
  recommendedCasingStrategy: CasingStrategy | null;
  onCustomizationChange: (
    isCustomized: boolean,
    strategy: CasingStrategy,
  ) => void;
};

type CasingOption = {
  value: CasingStrategy;
  label: string;
};

export default function TextCasingForm({
  control,
  selectedConceptCode,
  recommendedCasingStrategy,
  onCustomizationChange,
}: Props) {
  const { t } = useTranslation();
  const previewSource = resolveCasingPreviewSource(selectedConceptCode);

  const options: CasingOption[] = [
    {
      value: "NONE",
      label: t("ATTRIBUTE_FORM.CASING.NONE_LABEL", {
        defaultValue: "Conserver la saisie",
      }),
    },
    {
      value: "SENTENCE_PRESERVE",
      label: t("ATTRIBUTE_FORM.CASING.SENTENCE_PRESERVE_LABEL", {
        defaultValue: "Majuscule initiale",
      }),
    },
    {
      value: "TITLE_CASE",
      label: t("ATTRIBUTE_FORM.CASING.TITLE_CASE_LABEL", {
        defaultValue: "Majuscule a chaque mot",
      }),
    },
    {
      value: "UPPERCASE",
      label: t("ATTRIBUTE_FORM.CASING.UPPERCASE_LABEL", {
        defaultValue: "Tout en majuscules",
      }),
    },
  ];

  return (
    <Controller
      name="casingStrategy"
      control={control}
      render={({ field }) => {
        const currentValue = field.value ?? "NONE";

        return (
          <>
            <Box
              role="group"
              aria-label={t("ATTRIBUTE_FORM.CASING.GROUP_LABEL", {
                defaultValue: "Format du texte",
              })}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {options.map((option) => (
                <ChoiceCard
                  key={option.value}
                  selected={currentValue === option.value}
                  title={option.label}
                  subtitle={applyCasingPreview(previewSource, option.value)}
                  minHeight={82}
                  onClick={() => {
                    field.onChange(option.value);
                    onCustomizationChange(true, option.value);
                  }}
                />
              ))}
            </Box>

            {recommendedCasingStrategy != null &&
            currentValue !== recommendedCasingStrategy ? (
              <Button
                type="button"
                variant="text"
                size="small"
                onClick={() => {
                  field.onChange(recommendedCasingStrategy);
                  onCustomizationChange(false, recommendedCasingStrategy);
                }}
                sx={{ mt: 0.5, px: 0.75 }}
              >
                {t("ATTRIBUTE_FORM.CASING.USE_RECOMMENDED", {
                  defaultValue: "Utiliser le format recommande",
                })}
              </Button>
            ) : null}
          </>
        );
      }}
    />
  );
}
