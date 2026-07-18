import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import type { MutableRefObject } from "react";
import { Controller } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import AttributeMainFormSection from "./AttributeMainFormSection";
import FormSection from "./FormSection";
import SelectedFieldSummary from "./SelectedFieldSummary";
import type { ConceptLabelGetter } from "./attributeForm.types";

type Props = {
  control: Control<AttributeCreateFormInput>;
  errors: FieldErrors<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  watchedName: string;
  selectedConcept: Concept | null;
  selectedConceptCode: string | null;
  selectedType: ValueType;
  valueTypeLabel: string;
  isCustom: boolean;
  identityComponentEligible: boolean;
  getConceptLabel: ConceptLabelGetter;
  hasUserEditedNameRef: MutableRefObject<boolean>;
  onChangeConcept: () => void;
  onChangeType: () => void;
};

export default function FieldConfigScreen({
  control,
  errors,
  watch,
  setValue,
  watchedName,
  selectedConcept,
  selectedConceptCode,
  selectedType,
  valueTypeLabel,
  isCustom,
  identityComponentEligible,
  getConceptLabel,
  hasUserEditedNameRef,
  onChangeConcept,
  onChangeType,
}: Props) {
  const { t } = useTranslation();

  return (
    <Stack spacing={3.5}>
      <SelectedFieldSummary
        selectedConcept={selectedConcept}
        effectiveValueType={selectedType}
        valueTypeLabel={valueTypeLabel}
        isCustom={isCustom}
        getConceptLabel={getConceptLabel}
        onChangeConcept={onChangeConcept}
        onChangeType={onChangeType}
      />

      <FormSection
        title={t("ATTRIBUTE_FORM.SECTION_NAME_TITLE", {
          defaultValue: "Comment l'appelle-t-on ?",
        })}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("ATTRIBUTE_FORM.NAME_LABEL", {
                defaultValue: "Nom du champ",
              })}
              fullWidth
              error={!!errors.name}
              onChange={(event) => {
                hasUserEditedNameRef.current = true;
                field.onChange(event);
              }}
              InputLabelProps={{
                shrink: !!watchedName,
              }}
              InputProps={{
                sx: {
                  fontSize: { xs: "1rem", sm: "1.04rem" },
                  fontWeight: 600,
                },
              }}
              helperText={errors.name?.message}
            />
          )}
        />
      </FormSection>

      <FormSection
        title={t("ATTRIBUTE_FORM.SECTION_OPTIONS_TITLE", {
          defaultValue: "Comment ce champ sera-t-il utilise ?",
        })}
      >
        <Stack spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
            <Controller
              name="required"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("ATTRIBUTE_FORM.OPTION_REQUIRED", { defaultValue: "Obligatoire" })}
                />
              )}
            />

            <Controller
              name="filter"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("ATTRIBUTE_FORM.OPTION_FILTER", { defaultValue: "Filtrable" })}
                />
              )}
            />

            <Controller
              name="sort"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("ATTRIBUTE_FORM.OPTION_SORT", { defaultValue: "Triable" })}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("ATTRIBUTE_FORM.OPTION_CATEGORY", { defaultValue: "Categorie" })}
                />
              )}
            />

            <Controller
              name="primaryField"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value && identityComponentEligible}
                      disabled={!identityComponentEligible}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("ATTRIBUTE_FORM.OPTION_PRIMARY_FIELD", {
                    defaultValue: "Source d'identite",
                  })}
                />
              )}
            />
          </Stack>

          <Controller
            name="maxValues"
            control={control}
            render={({ field }) => (
              <TextField
                label={t("ATTRIBUTE_FORM.MAX_VALUES_LABEL", {
                  defaultValue: "Nombre maximal de valeurs",
                })}
                type="number"
                value={field.value ?? 1}
                onChange={(event) => field.onChange(Number(event.target.value) || 1)}
                inputProps={{ min: 1 }}
                sx={{ maxWidth: { sm: 260 } }}
              />
            )}
          />
        </Stack>
      </FormSection>

      <AttributeMainFormSection
        control={control}
        watch={watch}
        setValue={setValue}
        selectedConceptCode={selectedConceptCode}
        selectedType={selectedType}
      />
    </Stack>
  );
}
