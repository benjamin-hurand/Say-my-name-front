import { Box, Stack, TextField } from "@mui/material";
import type { MutableRefObject } from "react";
import { Controller } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import type {
  CasingStrategy,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import AdvancedAttributeSettings from "./AdvancedAttributeSettings";
import AttributeCardinalityControl from "./AttributeCardinalityControl";
import AttributeMainFormSection from "./AttributeMainFormSection";
import FormSection from "./FormSection";
import SettingRow from "./shared/SettingRow";

type Props = {
  control: Control<AttributeCreateFormInput>;
  errors: FieldErrors<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  selectedConceptCode: string | null;
  selectedType: ValueType;
  casingApplicable: boolean;
  recommendedCasingStrategy: CasingStrategy | null;
  onCasingCustomizationChange: (
    isCustomized: boolean,
    strategy: CasingStrategy,
  ) => void;
  identitySourceEligible: boolean;
  requiredMaxValues: number | null;
  advancedSettingsInitiallyExpanded: boolean;
  isNameCustomizedRef: MutableRefObject<boolean>;
};

export default function FieldConfigScreen({
  control,
  errors,
  watch,
  setValue,
  selectedConceptCode,
  selectedType,
  casingApplicable,
  recommendedCasingStrategy,
  onCasingCustomizationChange,
  identitySourceEligible,
  requiredMaxValues,
  advancedSettingsInitiallyExpanded,
  isNameCustomizedRef,
}: Props) {
  const { t } = useTranslation();

  return (
    <Stack spacing={{ xs: 2.75, sm: 3.25 }}>
      <FormSection
        title={t("ATTRIBUTE_FORM.FIELD_NAME_TITLE", {
          defaultValue: "Nom du champ",
        })}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              placeholder={t("ATTRIBUTE_FORM.NAME_PLACEHOLDER", {
                defaultValue: "Ex. Bureau",
              })}
              error={!!errors.name}
              onChange={(event) => {
                isNameCustomizedRef.current = true;
                field.onChange(event);
              }}
              inputProps={{
                "aria-label": t("ATTRIBUTE_FORM.FIELD_NAME_TITLE", {
                  defaultValue: "Nom du champ",
                }),
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

      <AttributeMainFormSection
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
        selectedConceptCode={selectedConceptCode}
        selectedType={selectedType}
        casingApplicable={casingApplicable}
        recommendedCasingStrategy={recommendedCasingStrategy}
        onCasingCustomizationChange={onCasingCustomizationChange}
      />

      {requiredMaxValues == null ? (
        <FormSection
          title={t("ATTRIBUTE_FORM.CARDINALITY_TITLE", {
            defaultValue: "Nombre de valeurs par personne",
          })}
        >
          <AttributeCardinalityControl control={control} />
        </FormSection>
      ) : null}

      <Stack
        divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      >
        <Controller
          name="required"
          control={control}
          render={({ field }) => (
            <SettingRow
              label={t("ATTRIBUTE_FORM.SETTINGS.REQUIRED_LABEL", {
                defaultValue: "Valeur obligatoire",
              })}
              description={t("ATTRIBUTE_FORM.SETTINGS.REQUIRED_DESC", {
                defaultValue: "Chaque personne devra avoir une valeur.",
              })}
              checked={!!field.value}
              onChange={field.onChange}
            />
          )}
        />

        {identitySourceEligible ? (
          <Controller
            name="identitySource"
            control={control}
            render={({ field }) => (
              <SettingRow
                label={t("ATTRIBUTE_FORM.SETTINGS.IDENTITY_LABEL", {
                  defaultValue: "Utiliser pour identifier une personne",
                })}
                description={t("ATTRIBUTE_FORM.SETTINGS.IDENTITY_DESC", {
                  defaultValue: "Cette valeur participera au nom affiché de la personne.",
                })}
                checked={!!field.value}
                onChange={field.onChange}
              />
            )}
          />
        ) : null}
      </Stack>

      <AdvancedAttributeSettings
        control={control}
        initiallyExpanded={advancedSettingsInitiallyExpanded}
      />
    </Stack>
  );
}
