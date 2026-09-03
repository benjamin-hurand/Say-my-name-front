import { Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import ConfiguredConceptList from "./ConfiguredConceptList";
import ConceptPicker from "./ConceptPicker";
import FormSection from "./FormSection";
import type { Attribute } from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { ConceptAvailability } from "./attributeForm.conceptAvailability";
import type {
  ConfiguredConceptItem,
  ConceptLabelGetter,
} from "./attributeForm.types";

type Props = {
  options: Concept[];
  value?: number | null;
  onSelect: (next: number | null) => void;
  getConceptLabel: ConceptLabelGetter;
  availabilityByConceptId: ReadonlyMap<number, ConceptAvailability>;
  configuredConceptItems: ConfiguredConceptItem[];
  onEditAttribute: (attribute: Attribute) => void;
};

export default function ConceptPickerScreen({
  options,
  value,
  onSelect,
  getConceptLabel,
  availabilityByConceptId,
  configuredConceptItems,
  onEditAttribute,
}: Props) {
  const { t } = useTranslation();
  return (
    <Stack spacing={3.5}>
      <FormSection
        title={t("ATTRIBUTE_FORM.SECTION_MODEL_TITLE", {
          defaultValue: "Quelle information voulez-vous ajouter ?",
        })}
      >
        <ConceptPicker
          options={options}
          value={value}
          onChange={onSelect}
          getLabel={(concept: Concept | null | undefined) => getConceptLabel(concept)}
          availabilityByConceptId={availabilityByConceptId}
        />
      </FormSection>

      <ConfiguredConceptList
        items={configuredConceptItems}
        onEditAttribute={onEditAttribute}
      />
    </Stack>
  );
}
