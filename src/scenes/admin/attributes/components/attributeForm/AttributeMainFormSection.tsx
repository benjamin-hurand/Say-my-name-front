import { Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
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
  selectedConceptCode: string | null;
  selectedType: ValueType;
};

type SectionText = {
  title: string;
  subtitle: string;
};

export default function AttributeMainFormSection({
  control,
  watch,
  setValue,
  selectedConceptCode,
  selectedType,
}: Props) {
  const { t } = useTranslation();

  const renderEnumSection = (texts: SectionText, label: string, placeholder: string) => (
    <FormSection title={texts.title} subtitle={texts.subtitle}>
      <EnumValuesForm
        control={control}
        watch={watch}
        setValue={setValue}
        label={label}
        placeholder={placeholder}
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
      <TextCasingForm control={control} />
    </FormSection>
  );

  const semanticConfig = getSemanticPresetConfig(selectedConceptCode);
  const enumCopy = resolveEnumCopy(t, selectedConceptCode);

  const renderSemanticEnumAffordance = (): ReactNode | null => {
    if (semanticConfig?.enumAffordance !== "GENDER_PRESET") return null;

    return (
      <FormSection
        title={t("ATTRIBUTE_FORM.CONFIG_VALUES_TITLE", {
          defaultValue: "Quelles valeurs proposer ?",
        })}
        subtitle={t("ATTRIBUTE_FORM.CONFIG_VALUES_SUBTITLE_GENDER", {
          defaultValue: "Choisis une liste prête à l'emploi ou personnalise les valeurs.",
        })}
      >
        <GenderPresetSelector control={control} watch={watch} setValue={setValue} />
      </FormSection>
    );
  };

  switch (selectedType) {
    case "TEXT":
      return renderTextCasingSection({
        title: t("ATTRIBUTE_FORM.CONFIG_TEXT_CASING_TITLE", {
          defaultValue: "Comment le texte doit-il être harmonisé ?",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_TEXT_CASING_SUBTITLE", {
          defaultValue:
            "Définis la règle de mise en forme à appliquer pour garder un affichage cohérent.",
        }),
      });

    case "ENUM":
      {
        const semanticAffordance = renderSemanticEnumAffordance();
        if (semanticAffordance) return semanticAffordance;
      }

      return renderEnumSection(
        {
          title: enumCopy.title,
          subtitle: enumCopy.subtitle,
        },
        enumCopy.addLabel,
        enumCopy.placeholder,
      );

    case "NUMBER":
      return renderNumberRangeSection({
        title: t("ATTRIBUTE_FORM.CONFIG_NUMBER_TITLE", {
          defaultValue: "Quelles valeurs autoriser ?",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_NUMBER_SUBTITLE", {
          defaultValue: "Laisse libre ou limite la plage.",
        }),
      });

    case "DATE":
    case "DATETIME":
      return renderDateRangeSection({
        title: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_TITLE", {
          defaultValue: "Quelle période autoriser ?",
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
