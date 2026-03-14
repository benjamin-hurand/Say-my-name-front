import { Typography } from "@mui/material";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type { AttributeType } from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import DateRangeForm from "./constraintForms/DateRangeForm";
import EnumValuesForm from "./constraintForms/EnumValuesForm";
import GenderPresetSelector from "./constraintForms/GenderPresetSelector";
import NumberRangeForm from "./constraintForms/NumberRangeForm";
import FormSection from "./FormSection";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  selectedConcept: Concept | null;
  selectedConceptCode: string | null;
  selectedType: AttributeType;
};

export default function AttributeMainFormSection({
  control,
  watch,
  setValue,
  selectedConcept,
  selectedConceptCode,
  selectedType,
}: Props) {
  if (selectedConceptCode === "GENDER") {
    return (
      <FormSection
        title="Valeurs proposées"
        subtitle="Choisis un modèle prêt à l’emploi ou crée ta propre liste."
      >
        <GenderPresetSelector control={control} watch={watch} setValue={setValue} />
      </FormSection>
    );
  }

  if (selectedConceptCode === "DEPARTMENT") {
    return (
      <FormSection
        title="Valeurs proposées"
        subtitle="Définis les départements disponibles."
      >
        <EnumValuesForm
          control={control}
          watch={watch}
          setValue={setValue}
          label="Ajouter un département"
          placeholder="Ex. Marketing"
        />
      </FormSection>
    );
  }

  if (selectedConceptCode === "PROMOTION") {
    return (
      <FormSection
        title="Valeurs proposées"
        subtitle="Définis les promotions disponibles."
      >
        <EnumValuesForm
          control={control}
          watch={watch}
          setValue={setValue}
          label="Ajouter une promotion"
          placeholder="Ex. 2026"
        />
      </FormSection>
    );
  }

  if (selectedConceptCode === "ARRIVAL_DATE") {
    return (
      <FormSection
        title="Période autorisée"
        subtitle="Tu peux laisser ce champ libre ou limiter la période."
      >
        <DateRangeForm control={control} watch={watch} setValue={setValue} />
      </FormSection>
    );
  }

  if (
    selectedConceptCode === "FIRST_NAME" ||
    selectedConceptCode === "LAST_NAME" ||
    selectedConceptCode === "IDENTITY"
  ) {
    return (
      <FormSection
        title="Configuration"
        subtitle="Aucun réglage supplémentaire n’est nécessaire."
      >
        <Typography variant="body2" color="text.secondary">
          Ce champ sera configuré automatiquement.
        </Typography>
      </FormSection>
    );
  }

  if (!selectedConcept) {
    if (selectedType === "ENUM") {
      return (
        <FormSection
          title="Valeurs proposées"
          subtitle="Définis les choix disponibles pour cet attribut."
        >
          <EnumValuesForm
            control={control}
            watch={watch}
            setValue={setValue}
            label="Ajouter une valeur"
            placeholder="Ex. Senior"
          />
        </FormSection>
      );
    }

    if (selectedType === "NUMBER") {
      return (
        <FormSection
          title="Valeurs autorisées"
          subtitle="Tu peux laisser ce champ libre ou limiter la plage."
        >
          <NumberRangeForm control={control} watch={watch} setValue={setValue} />
        </FormSection>
      );
    }

    if (selectedType === "DATE" || selectedType === "DATETIME") {
      return (
        <FormSection
          title="Période autorisée"
          subtitle="Tu peux laisser ce champ libre ou limiter la période."
        >
          <DateRangeForm control={control} watch={watch} setValue={setValue} />
        </FormSection>
      );
    }
  }

  return null;
}