import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import { Box } from "@mui/material";

import { getConceptIcon } from "./attributeForm.helpers";
import type { ConceptCardOption, ConceptLabelGetter } from "./attributeForm.types";
import ChoiceCard from "./shared/ChoiceCard";

type Props = {
  options: ConceptCardOption[];
  value?: number | null;
  onChange: (next: number | null) => void;
  getLabel: ConceptLabelGetter;
  initialConceptId?: number | null;
};

export default function ConceptPicker({
  options,
  value,
  onChange,
  getLabel,
  initialConceptId,
}: Props) {
  const visibleOptions = options.filter(
    (concept) => !concept.blocked || concept.id === initialConceptId,
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
      {visibleOptions.map((concept) => {
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
        title="Champ personnalise"
        subtitle="Definir une information specifique"
        icon={<ExtensionRoundedIcon fontSize="small" />}
        onClick={() => onChange(null)}
      />
    </Box>
  );
}
