import { Alert, FormControlLabel, FormHelperText, Stack, Switch } from "@mui/material";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import FormSection from "./FormSection";
import type { ConceptPreset } from "./attributeForm.types";

type Props = {
  control: Control<AttributeCreateFormInput>;
  selectedConceptCode: string | null;
  selectedPreset?: ConceptPreset;
  showRequiredField: boolean;
  isRequiredLocked: boolean;
};

export default function AttributeFormUsageSection({
  control,
  selectedConceptCode,
  selectedPreset,
  showRequiredField,
  isRequiredLocked,
}: Props) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t("ATTRIBUTE_FORM.SECTION_USAGE_TITLE", {
        defaultValue: "Présence de la donnée",
      })}
      subtitle={t("ATTRIBUTE_FORM.SECTION_USAGE_SUBTITLE", {
        defaultValue: "À activer seulement si cette information doit exister pour chaque personne.",
      })}
    >
      <Stack spacing={1.25}>
        {showRequiredField ? (
          <Stack spacing={0.5}>
            <Controller
              name="required"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={isRequiredLocked}
                    />
                  }
                  label={t("ATTRIBUTE_FORM.REQUIRED_LABEL", {
                    defaultValue: "Champ requis",
                  })}
                />
              )}
            />
            <FormHelperText sx={{ mt: 0 }}>
              {selectedConceptCode === "GENDER"
                ? "Conseillé pour améliorer la cohérence des données."
                : selectedConceptCode === "DEPARTMENT" || selectedConceptCode === "PROMOTION"
                  ? "Active-le seulement si cette information doit toujours être présente."
                  : "Laisse désactivé sauf si cette donnée doit exister pour tous les profils."}
            </FormHelperText>
          </Stack>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2.5 }}>
            {selectedPreset?.forcedRequired
              ? "Ce concept est automatiquement requis."
              : "Ce concept fixe automatiquement les règles de présence."}
          </Alert>
        )}
      </Stack>
    </FormSection>
  );
}