import { Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { ConceptLabelGetter } from "./attributeForm.types";

type Props = {
  selectedConcept: Concept | null;
  valueTypeLabel: string;
  isCustom: boolean;
  requiredMaxValues: number | null;
  getConceptLabel: ConceptLabelGetter;
};

export default function SelectedFieldSummary({
  selectedConcept,
  valueTypeLabel,
  isCustom,
  requiredMaxValues,
  getConceptLabel,
}: Props) {
  const { t } = useTranslation();

  const title = selectedConcept
    ? getConceptLabel(selectedConcept)
    : t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
        defaultValue: "Champ personnalise",
      });

  return (
    <Stack spacing={0.15}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.35, overflowWrap: "anywhere" }}
      >
        <Typography component="span" variant="inherit" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {isCustom ? (
          <>
            <Typography component="span" variant="inherit" color="text.disabled" sx={{ mx: 0.75 }}>
              ·
            </Typography>
            <Typography component="span" variant="inherit">
              {valueTypeLabel}
            </Typography>
          </>
        ) : null}
      </Typography>

      {requiredMaxValues != null ? (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
          {requiredMaxValues === 1
            ? t("ATTRIBUTE_FORM.MODEL_MAX_VALUES_SINGLE", {
                defaultValue: "Le modele impose : une seule valeur par personne",
              })
            : t("ATTRIBUTE_FORM.MODEL_MAX_VALUES_MULTIPLE", {
                count: requiredMaxValues,
                defaultValue: "Le modele impose : jusqu'a {{count}} valeurs par personne",
              })}
        </Typography>
      ) : null}
    </Stack>
  );
}
