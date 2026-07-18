import { useTranslation } from "react-i18next";

import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
import CustomAttributeTypePicker from "./CustomAttributeTypePicker";
import FormSection from "./FormSection";
import { CUSTOM_TYPE_OPTIONS } from "./attributeForm.constants";

type Props = {
  value: ValueType;
  onSelect: (next: ValueType) => void;
};

export default function ValueTypePickerScreen({ value, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <FormSection
      eyebrow={t("ATTRIBUTE_FORM.SECTION_TYPE_LABEL", {
        defaultValue: "Type de donnee",
      })}
      title={t("ATTRIBUTE_FORM.SECTION_TYPE_TITLE", {
        defaultValue: "Quel type de donnee ?",
      })}
      subtitle={t("ATTRIBUTE_FORM.CUSTOM_TYPE_SUBTITLE", {
        defaultValue: "Choisis le format de l'information a enregistrer.",
      })}
    >
      <CustomAttributeTypePicker
        options={CUSTOM_TYPE_OPTIONS}
        value={value}
        onChange={onSelect}
      />
    </FormSection>
  );
}
