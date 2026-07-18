import { useTranslation } from "react-i18next";

import ConceptPicker from "./ConceptPicker";
import FormSection from "./FormSection";
import type { ConceptCardOption, ConceptLabelGetter } from "./attributeForm.types";
import type { Concept } from "../../../../../models/commons/Concept/Concept";

type Props = {
  options: ConceptCardOption[];
  value?: number | null;
  onSelect: (next: number | null) => void;
  getConceptLabel: ConceptLabelGetter;
  initialConceptId?: number | null;
};

export default function ConceptPickerScreen({
  options,
  value,
  onSelect,
  getConceptLabel,
  initialConceptId,
}: Props) {
  const { t } = useTranslation();
  return (
    <FormSection
      title={t("ATTRIBUTE_FORM.SECTION_MODEL_TITLE", {
        defaultValue: "Quel type d'information ?",
      })}
    >
      <ConceptPicker
        options={options}
        value={value}
        onChange={onSelect}
        getLabel={(concept: Concept | null | undefined) => getConceptLabel(concept)}
        initialConceptId={initialConceptId ?? null}
      />
    </FormSection>
  );
}
