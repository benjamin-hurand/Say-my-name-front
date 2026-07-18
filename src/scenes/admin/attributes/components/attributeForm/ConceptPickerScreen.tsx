import { Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import ConceptPicker from "./ConceptPicker";
import FormSection from "./FormSection";
import type {
  ConceptCardOption,
  ConceptDescriptionGetter,
  ConceptLabelGetter,
} from "./attributeForm.types";
import type { Concept } from "../../../../../models/commons/Concept/Concept";

type Props = {
  options: ConceptCardOption[];
  value?: number | null;
  onSelect: (next: number | null) => void;
  getConceptLabel: ConceptLabelGetter;
  getConceptDescription: ConceptDescriptionGetter;
  initialConceptId?: number | null;
};

export default function ConceptPickerScreen({
  options,
  value,
  onSelect,
  getConceptLabel,
  getConceptDescription,
  initialConceptId,
}: Props) {
  const { t } = useTranslation();
  const hasSelection = value !== undefined;
  const selectedConcept =
    value == null ? null : options.find((concept) => concept.id === value) ?? null;

  const conceptTitle = hasSelection
    ? selectedConcept
      ? getConceptLabel(selectedConcept)
      : t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
          defaultValue: "Champ personnalise",
        })
    : t("ATTRIBUTE_FORM.CONCEPT_PICKER_EMPTY_TITLE", {
        defaultValue: "Selectionne un modele pour continuer",
      });

  const conceptDescription = hasSelection
    ? selectedConcept
      ? getConceptDescription(selectedConcept) ||
        t("ATTRIBUTE_FORM.CONCEPT_NO_DESCRIPTION", {
          defaultValue: "Ce modele applique une configuration recommandee.",
        })
      : t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE_DESCRIPTION", {
          defaultValue:
            "Utilise cette option si aucune information standard ne correspond a ton besoin.",
        })
    : t("ATTRIBUTE_FORM.CONCEPT_PICKER_EMPTY_DESCRIPTION", {
        defaultValue:
          "Les champs standards preconfigurent le type et les comportements metier.",
      });

  return (
    <FormSection
      eyebrow={t("ATTRIBUTE_FORM.SECTION_MODEL_LABEL", {
        defaultValue: "Modele",
      })}
      title={t("ATTRIBUTE_FORM.SECTION_MODEL_TITLE", {
        defaultValue: "Quel type d'information ?",
      })}
      subtitle={t("ATTRIBUTE_FORM.SECTION_MODEL_SUBTITLE", {
        defaultValue: "Choisis un modele recommande ou cree un champ personnalise.",
      })}
    >
      <Stack spacing={1.5}>
        <ConceptPicker
          options={options}
          value={value}
          onChange={onSelect}
          getLabel={(concept: Concept | null | undefined) => getConceptLabel(concept)}
          initialConceptId={initialConceptId ?? null}
        />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.5 }}
        >
          {conceptTitle}. {conceptDescription}
        </Typography>
      </Stack>
    </FormSection>
  );
}
