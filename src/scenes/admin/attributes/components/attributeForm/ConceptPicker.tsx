import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import { Box } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getConceptIcon } from "./attributeForm.helpers";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import {
  filterAvailableConcepts,
  type ConceptAvailability,
} from "./attributeForm.conceptAvailability";
import type { ConceptLabelGetter } from "./attributeForm.types";
import ChoiceCard from "./shared/ChoiceCard";

type Props = {
  options: Concept[];
  value?: number | null;
  onChange: (next: number | null) => void;
  getLabel: ConceptLabelGetter;
  availabilityByConceptId: ReadonlyMap<number, ConceptAvailability>;
};

export default function ConceptPicker({
  options,
  value,
  onChange,
  getLabel,
  availabilityByConceptId,
}: Props) {
  const { t } = useTranslation();
  const availableOptions = useMemo(
    () => filterAvailableConcepts(options, availabilityByConceptId),
    [availabilityByConceptId, options],
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: { xs: 1, sm: 1.25 },
      }}
    >
      {availableOptions.map((concept) => {
        const Icon = getConceptIcon(concept);

        return (
          <ChoiceCard
            key={concept.id}
            selected={value === concept.id}
            title={getLabel(concept)}
            icon={<Icon fontSize="small" />}
            onClick={() => onChange(concept.id)}
          />
        );
      })}

      <ChoiceCard
        selected={value === null}
        title={t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
          defaultValue: "Champ personnalisé",
        })}
        subtitle={t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE_SUBTITLE", {
          defaultValue: "Définir une information spécifique",
        })}
        icon={<ExtensionRoundedIcon fontSize="small" />}
        onClick={() => onChange(null)}
      />
    </Box>
  );
}
