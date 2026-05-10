import { Collapse, Fade, Stack, TextField, Typography } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
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
  selectedType: ValueType;
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

  const conceptTitle = selectedConcept
    ? getConceptLabel(selectedConcept)
    : t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
        defaultValue: "Champ personnalise",
      });

  const conceptDescription =
    selectedConcept
      ? getConceptDescription(selectedConcept) ||
        t("ATTRIBUTE_FORM.CONCEPT_NO_DESCRIPTION", {
          defaultValue: "Ce modele applique une configuration recommandee.",
        })
      : t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE_DESCRIPTION", {
          defaultValue:
            "Utilise cette option si aucune information standard ne correspond a ton besoin.",
        });

  return (
    <Stack spacing={4}>
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
          <Controller
            name="conceptId"
            control={control}
            render={({ field }) => (
              <ConceptPicker
                options={conceptCardOptions}
                value={field.value ?? null}
                onChange={(next) => field.onChange(next)}
                getLabel={getConceptLabel}
                initialConceptId={initialConceptId ?? null}
              />
            )}
          />

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
            {conceptTitle}. {conceptDescription}
          </Typography>
        </Stack>
      </FormSection>

      <FormSection
        eyebrow={t("ATTRIBUTE_FORM.SECTION_NAME_LABEL", {
          defaultValue: "Nom",
        })}
        title={t("ATTRIBUTE_FORM.SECTION_NAME_TITLE", {
          defaultValue: "Comment l'appelle-t-on ?",
        })}
        subtitle={t("ATTRIBUTE_FORM.SECTION_NAME_SUBTITLE", {
          defaultValue: "Donne un libelle clair et visible pour les equipes admin.",
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
              helperText={
                errors.name?.message ||
                (selectedConcept
                  ? t("ATTRIBUTE_FORM.NAME_HELP_MODEL", {
                      defaultValue:
                        "Le nom propose suit le modele choisi. Modifie-le seulement si necessaire.",
                    })
                  : t("ATTRIBUTE_FORM.NAME_HELP_CUSTOM", {
                      defaultValue:
                        "Commence par nommer l'information metier, puis choisis son type de donnee.",
                    }))
              }
            />
          )}
        />
      </FormSection>

      <Collapse in={!selectedConcept} timeout={220} unmountOnExit>
        <Fade in={!selectedConcept} timeout={220}>
          <div>
            <FormSection
              eyebrow={t("ATTRIBUTE_FORM.SECTION_TYPE_LABEL", {
                defaultValue: "Type de donnee",
              })}
              title={t("ATTRIBUTE_FORM.SECTION_TYPE_TITLE", {
                defaultValue: "Quel type de donnee ?",
              })}
              subtitle={t("ATTRIBUTE_FORM.CUSTOM_TYPE_SUBTITLE", {
                defaultValue: "Choisis le format de l'information a enregistrer.",
              })}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <CustomAttributeTypePicker
                    options={CUSTOM_TYPE_OPTIONS}
                    value={(field.value ?? selectedType) as ValueType}
                    onChange={(next) => field.onChange(next)}
                  />
                )}
              />
            </FormSection>
          </div>
        </Fade>
      </Collapse>
    </Stack>
  );
}
