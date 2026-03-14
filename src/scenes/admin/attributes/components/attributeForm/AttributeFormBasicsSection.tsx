import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, AlertTitle, Stack, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { AttributeType } from "../../../../../models/commons/Attribute/Attribute";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import ConceptPicker from "./ConceptPicker";
import CustomAttributeTypePicker from "./CustomAttributeTypePicker";
import FormSection from "./FormSection";
import { CUSTOM_TYPE_OPTIONS } from "./attributeForm.constants";
import type {
  ConceptCardOption,
  ConceptDescriptionGetter,
  ConceptLabelGetter,
  NameEditRef,
} from "./attributeForm.types";

type Props = {
  control: Control<AttributeCreateFormInput>;
  errors: FieldErrors<AttributeCreateFormInput>;
  watchedName: string;
  selectedConcept: Concept | null;
  selectedType: AttributeType;
  conceptCardOptions: ConceptCardOption[];
  getConceptLabel: ConceptLabelGetter;
  getConceptDescription: ConceptDescriptionGetter;
  initialConceptId?: number | null;
  hasUserEditedNameRef: NameEditRef;
};

export default function AttributeFormBasicsSection({
  control,
  errors,
  watchedName,
  selectedConcept,
  selectedType,
  conceptCardOptions,
  getConceptLabel,
  getConceptDescription,
  initialConceptId,
  hasUserEditedNameRef,
}: Props) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t("ATTRIBUTE_FORM.SECTION_SEMANTICS_TITLE", {
        defaultValue: "Que veux-tu créer ?",
      })}
      subtitle={t("ATTRIBUTE_FORM.SECTION_SEMANTICS_SUBTITLE", {
        defaultValue: "Choisis un concept standard, ou crée un attribut personnalisé.",
      })}
    >
      <Stack spacing={2}>
        <Controller
          name="conceptId"
          control={control}
          render={({ field }) => (
            <ConceptPicker
              options={conceptCardOptions}
              value={field.value ?? null}
              onChange={(next) => field.onChange(next)}
              getLabel={getConceptLabel}
              getDescription={getConceptDescription}
              initialConceptId={initialConceptId ?? null}
            />
          )}
        />

        {selectedConcept && (
          <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2.5 }}>
            <AlertTitle>{getConceptLabel(selectedConcept)}</AlertTitle>
            {getConceptDescription(selectedConcept) ||
              t("ATTRIBUTE_FORM.CONCEPT_NO_DESCRIPTION", {
                defaultValue: "Ce concept apporte une configuration recommandée.",
              })}
          </Alert>
        )}

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("ATTRIBUTE_FORM.NAME_LABEL", {
                defaultValue: "Nom affiché",
              })}
              fullWidth
              error={!!errors.name}
              onChange={(e) => {
                hasUserEditedNameRef.current = true;
                field.onChange(e);
              }}
              InputLabelProps={{
                shrink: !!watchedName,
              }}
              helperText={
                errors.name?.message ||
                (selectedConcept
                  ? t("ATTRIBUTE_FORM.NAME_HELP_CONCEPT", {
                      defaultValue:
                        "Par défaut, conserve le nom proposé par le concept. Modifie-le seulement si nécessaire.",
                    })
                  : t("ATTRIBUTE_FORM.NAME_HELP_CUSTOM", {
                      defaultValue:
                        "Choisis d’abord le nom métier de l’information, puis son type.",
                    }))
              }
            />
          )}
        />

        {!selectedConcept && (
          <Stack spacing={1}>
            <Alert severity="info" sx={{ borderRadius: 2.5 }}>
              {t("ATTRIBUTE_FORM.CUSTOM_TYPE_HELP", {
                defaultValue:
                  "Choisis ensuite le type d’information à stocker. Le formulaire affichera seulement les réglages utiles.",
              })}
            </Alert>

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <CustomAttributeTypePicker
                  options={CUSTOM_TYPE_OPTIONS}
                  value={(field.value ?? selectedType) as AttributeType}
                  onChange={(next) => field.onChange(next)}
                />
              )}
            />
          </Stack>
        )}
      </Stack>
    </FormSection>
  );
}