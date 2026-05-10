import { Typography } from "@mui/material";
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

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  selectedConceptCode: string | null;
  selectedType: ValueType;
};

type SectionText = {
  eyebrow?: string;
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
    <FormSection eyebrow={texts.eyebrow} title={texts.title} subtitle={texts.subtitle}>
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
    <FormSection eyebrow={texts.eyebrow} title={texts.title} subtitle={texts.subtitle}>
      <DateRangeForm control={control} watch={watch} setValue={setValue} />
    </FormSection>
  );

  const renderNumberRangeSection = (texts: SectionText) => (
    <FormSection eyebrow={texts.eyebrow} title={texts.title} subtitle={texts.subtitle}>
      <NumberRangeForm control={control} watch={watch} setValue={setValue} />
    </FormSection>
  );

  const renderTextCasingSection = (texts: SectionText) => (
    <FormSection eyebrow={texts.eyebrow} title={texts.title} subtitle={texts.subtitle}>
      <TextCasingForm control={control} />
    </FormSection>
  );

  if (selectedConceptCode === "GENDER") {
    return (
      <FormSection
        eyebrow={t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
          defaultValue: "Configuration",
        })}
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
  }

  if (selectedConceptCode === "DEPARTMENT") {
    return renderEnumSection(
      {
        eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
          defaultValue: "Configuration",
        }),
        title: t("ATTRIBUTE_FORM.CONFIG_VALUES_TITLE", {
          defaultValue: "Quelles valeurs proposer ?",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_VALUES_SUBTITLE_DEPARTMENT", {
          defaultValue: "Définis les départements disponibles.",
        }),
      },
      t("ATTRIBUTE_FORM.ENUM_ADD_DEPARTMENT", {
        defaultValue: "Ajouter un département",
      }),
      t("ATTRIBUTE_FORM.ENUM_DEPARTMENT_PLACEHOLDER", {
        defaultValue: "Ex. Marketing",
      }),
    );
  }

  if (selectedConceptCode === "PROMOTION") {
    return renderEnumSection(
      {
        eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
          defaultValue: "Configuration",
        }),
        title: t("ATTRIBUTE_FORM.CONFIG_VALUES_TITLE", {
          defaultValue: "Quelles valeurs proposer ?",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_VALUES_SUBTITLE_PROMOTION", {
          defaultValue: "Définis les promotions disponibles.",
        }),
      },
      t("ATTRIBUTE_FORM.ENUM_ADD_PROMOTION", {
        defaultValue: "Ajouter une promotion",
      }),
      t("ATTRIBUTE_FORM.ENUM_PROMOTION_PLACEHOLDER", {
        defaultValue: "Ex. 2026",
      }),
    );
  }

  if (selectedConceptCode === "ARRIVAL_DATE") {
    return renderDateRangeSection({
      eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
        defaultValue: "Configuration",
      }),
      title: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_TITLE", {
        defaultValue: "Quelle période autoriser ?",
      }),
      subtitle: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_SUBTITLE", {
        defaultValue: "Laisse libre ou limite la période.",
      }),
    });
  }

  if (selectedType === "TEXT") {
    return renderTextCasingSection({
      eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
        defaultValue: "Configuration",
      }),
      title: t("ATTRIBUTE_FORM.CONFIG_TEXT_CASING_TITLE", {
        defaultValue: "Comment le texte doit-il être harmonisé ?",
      }),
      subtitle: t("ATTRIBUTE_FORM.CONFIG_TEXT_CASING_SUBTITLE", {
        defaultValue:
          "Définis la règle de mise en forme à appliquer pour garder un affichage cohérent.",
      }),
    });
  }

  if (!selectedConceptCode) {
    if (selectedType === "ENUM") {
      return renderEnumSection(
        {
          eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
            defaultValue: "Configuration",
          }),
          title: t("ATTRIBUTE_FORM.CONFIG_ENUM_TITLE", {
            defaultValue: "Quelles options proposer ?",
          }),
          subtitle: t("ATTRIBUTE_FORM.CONFIG_ENUM_SUBTITLE", {
            defaultValue: "Définis les choix disponibles.",
          }),
        },
        t("ATTRIBUTE_FORM.ENUM_ADD_OPTION", {
          defaultValue: "Ajouter une option",
        }),
        t("ATTRIBUTE_FORM.ENUM_OPTION_PLACEHOLDER", {
          defaultValue: "Ex. Senior",
        }),
      );
    }

    if (selectedType === "NUMBER") {
      return renderNumberRangeSection({
        eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
          defaultValue: "Configuration",
        }),
        title: t("ATTRIBUTE_FORM.CONFIG_NUMBER_TITLE", {
          defaultValue: "Quelles valeurs autoriser ?",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_NUMBER_SUBTITLE", {
          defaultValue: "Laisse libre ou limite la plage.",
        }),
      });
    }

    if (selectedType === "DATE" || selectedType === "DATETIME") {
      return renderDateRangeSection({
        eyebrow: t("ATTRIBUTE_FORM.CONFIG_SECTION_LABEL", {
          defaultValue: "Configuration",
        }),
        title: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_TITLE", {
          defaultValue: "Quelle période autoriser ?",
        }),
        subtitle: t("ATTRIBUTE_FORM.CONFIG_DATE_RANGE_SUBTITLE", {
          defaultValue: "Laisse libre ou limite la période.",
        }),
      });
    }

    if (selectedType === "BOOLEAN") {
      return null;
    }
  }

  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
      {t("ATTRIBUTE_FORM.CONFIG_DEFAULT_READY_TEXT", {
        defaultValue: "Ce champ peut être utilisé tel quel.",
      })}
    </Typography>
  );
}
