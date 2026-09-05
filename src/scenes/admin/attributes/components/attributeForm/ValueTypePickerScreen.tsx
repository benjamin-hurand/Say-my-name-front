import { useTranslation } from "react-i18next";

import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
import CustomAttributeTypePicker from "./CustomAttributeTypePicker";
import FormSection from "./FormSection";
import { CUSTOM_TYPE_OPTIONS } from "./attributeForm.constants";

type Props = {
  value: ValueType | null;
  onSelect: (next: ValueType) => void;
};

export default function ValueTypePickerScreen({ value, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t("ATTRIBUTE_FORM.SECTION_TYPE_TITLE", {
        defaultValue: "Quel type d'information souhaitez-vous enregistrer ?",
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
