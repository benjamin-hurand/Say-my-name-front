import { Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type {
  CasingStrategy,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import DateRangeForm from "./constraintForms/DateRangeForm";
import EnumValuesForm from "./constraintForms/EnumValuesForm";
import GenderPresetSelector from "./constraintForms/GenderPresetSelector";
import NumberRangeForm from "./constraintForms/NumberRangeForm";
import TextCasingForm from "./constraintForms/TextCasingForm";
import FormSection from "./FormSection";
import {
  getSemanticPresetConfig,
  resolveEnumCopy,
} from "./attributeForm.semanticRegistry";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  errors: FieldErrors<AttributeCreateFormInput>;
  selectedConceptCode: string | null;
  selectedType: ValueType;
  casingApplicable: boolean;
  recommendedCasingStrategy: CasingStrategy | null;
  onCasingCustomizationChange: (
    isCustomized: boolean,
    strategy: CasingStrategy,
  ) => void;
};

type SectionText = {
  title: string;
  subtitle?: string;
};

export default function AttributeMainFormSection({
  control,
  watch,
  setValue,
  errors,
  selectedConceptCode,
  selectedType,
  casingApplicable,
  recommendedCasingStrategy,
  onCasingCustomizationChange,
}: Props) {
  const { t } = useTranslation();
  const enumOptionsError = errors.enumOptions?.message as string | undefined;

  const renderEnumSection = (texts: SectionText, label: string, placeholder: string) => (
    <FormSection title={texts.title} subtitle={texts.subtitle}>
      <EnumValuesForm
        control={control}
        watch={watch}
        setValue={setValue}
        label={label}
        placeholder={placeholder}
        errorMessage={enumOptionsError}
      />
    </FormSection>
  );

  const renderDateRangeSection = (texts: SectionText) => (
    <FormSection title={texts.title} subtitle={texts.subtitle}>
      <DateRangeForm control={control} watch={watch} setValue={setValue} />
    </FormSection>
  );

  const renderNumberRangeSection = (texts: SectionText) => (
    <FormSection title={texts.title} subtitle={texts.subtitle}>
      <NumberRangeForm control={control} watch={watch} setValue={setValue} />
    </FormSection>
  );

  const renderTextCasingSection = (texts: SectionText) => (
    <FormSection title={texts.title} subtitle={texts.subtitle}>
      <TextCasingForm
        control={control}
        selectedConceptCode={selectedConceptCode}
        recommendedCasingStrategy={recommendedCasingStrategy}
        onCustomizationChange={onCasingCustomizationChange}
      />
    </FormSection>
  );

  const semanticConfig = getSemanticPresetConfig(selectedConceptCode);
  const enumCopy = resolveEnumCopy(t, selectedConceptCode);

  const renderSemanticEnumAffordance = (): ReactNode | null => {
    if (semanticConfig?.enumAffordance !== "GENDER_PRESET") return null;

    return (
      <FormSection
        title={t("ATTRIBUTE_FORM.CONFIG_VALUES_TITLE_DIRECT", {
          defaultValue: "Choix proposés",
        })}
        subtitle={t("ATTRIBUTE_FORM.CONFIG_VALUES_SUBTITLE_GENDER", {
          defaultValue: "Liste fixe définie par SayMyName.",
        })}
      >
        <GenderPresetSelector setValue={setValue} />
      </FormSection>
    );
  };

  switch (selectedType) {
    case "TEXT":
      if (!casingApplicable) return null;

      return renderTextCasingSection({
        title: t("ATTRIBUTE_FORM.CONFIG_TEXT_CASING_TITLE_DIRECT", {
          defaultValue: "Format du texte",
        }),
      });

    case "ENUM":
      {
        const semanticAffordance = renderSemanticEnumAffordance();
        if (semanticAffordance) return semanticAffordance;
      }

      return renderEnumSection(
        {
          title: t("ATTRIBUTE_FORM.CONFIG_ENUM_TITLE_DIRECT", {
            defaultValue: "Choix proposés",
          }),
        },
        enumCopy.addLabel,
        enumCopy.placeholder,
      );

    case "NUMBER":
      return renderNumberRangeSection({
        title: t("ATTRIBUTE_FORM.CONFIG_NUMBER_TITLE_DIRECT", {
          defaultValue: "Valeurs autorisées",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_NUMBER_SUBTITLE", {
          defaultValue: "Laisse libre ou limite la plage.",
        }),
      });

    case "DATE":
    case "DATETIME":
      return renderDateRangeSection({
        title: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_TITLE_DIRECT", {
          defaultValue: "Période autorisée",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_SUBTITLE", {
          defaultValue: "Laisse libre ou limite la période.",
        }),
      });

    case "BOOLEAN":
      return null;

    default:
      return (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.5 }}
        >
          {t("ATTRIBUTE_FORM.CONFIG_DEFAULT_READY_TEXT", {
            defaultValue: "Ce champ peut être utilisé tel quel.",
          })}
        </Typography>
      );
  }
}
