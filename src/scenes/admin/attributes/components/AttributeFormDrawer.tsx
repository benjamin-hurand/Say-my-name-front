import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Dialog, DialogActions, DialogContent, Stack, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import AttributeMainFormSection from "./attributeForm/AttributeMainFormSection";
import AttributeFormAlerts from "./attributeForm/AttributeFormAlerts";
import AttributeFormBasicsSection from "./attributeForm/AttributeFormBasicsSection";
import AttributeFormHeader from "./attributeForm/AttributeFormHeader";
import {
  CONCEPT_PRESETS,
  UNIQUE_SYSTEM_CONCEPT_CODES,
} from "./attributeForm/attributeForm.constants";
import {
  getAllowedTypesFromConcept,
  getConceptCode,
  getConceptValueType,
  isConceptDerived,
  isIdentityComponentEligible,
  makeDefaultValues,
} from "./attributeForm/attributeForm.helpers";
import type {
  AttributeFormDrawerProps,
  ConceptCardOption,
} from "./attributeForm/attributeForm.types";
import {
  attributeCreateSchema,
  type AttributeCreateFormInput,
  type AttributeCreateFormOutput,
} from "../validation/attributeCreate.schema";
import type {
  CreateAttributePayload,
  UpdateAttributePayload,
} from "../../../../models/commons/Attribute/Attribute.dto";
import type { Concept } from "../../../../models/commons/Concept/Concept";
import {
  type AttributeType,
  type EditPolicy,
} from "../../../../models/commons/Attribute/Attribute";
import {
  createAdminAttribute,
  updateAdminAttribute,
} from "../../../../services/business/admin/admin.attributes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import { glassDialog } from "../../../../styles/glassStyles";

export default function AttributeFormDrawer({
  open,
  initial,
  onClose,
  conceptOptions,
  allAttributes,
}: AttributeFormDrawerProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial?.id);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [appliedSuggestionMessage, setAppliedSuggestionMessage] = useState<string | null>(null);

  const hasUserEditedNameRef = useRef(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<AttributeCreateFormInput, unknown, AttributeCreateFormOutput>({
    resolver: zodResolver(attributeCreateSchema),
    defaultValues: makeDefaultValues(initial),
  });

  useEffect(() => {
    if (!open) return;
    reset(makeDefaultValues(initial));
    setAppliedSuggestionMessage(null);
    hasUserEditedNameRef.current = false;
  }, [open, initial, reset]);

  const watchedConceptId = watch("conceptId");
  const watchedType = watch("type");
  const watchedName = watch("name");

  const selectedConcept = useMemo(
    () => conceptOptions.find((c) => c.id === watchedConceptId) ?? null,
    [conceptOptions, watchedConceptId],
  );

  const getConceptLabel = useCallback(
    (concept: Concept | null | undefined): string => {
      if (!concept) {
        return t("ATTRIBUTE_FORM.CUSTOM_CONCEPT", {
          defaultValue: "Attribut personnalisé",
        });
      }
      return t(`CONCEPTS.${concept.code}.LABEL`, {
        defaultValue: concept.code,
      });
    },
    [t],
  );

  const getConceptDescription = useCallback(
    (concept: Concept | null | undefined): string | null => {
      if (!concept) return null;
      const translated = t(`CONCEPTS.${concept.code}.DESCRIPTION`, { defaultValue: "" });
      return translated || null;
    },
    [t],
  );

  const selectedConceptCode = selectedConcept?.code ?? getConceptCode(initial) ?? null;
  const selectedConceptValueType =
    selectedConcept?.valueType ?? getConceptValueType(initial) ?? null;
  const selectedConceptDerived =
    selectedConcept?.derived ?? (selectedConcept ? false : isConceptDerived(initial));
  const selectedIdentityEligible =
    selectedConcept?.identityComponentEligible ??
    (selectedConcept ? false : isIdentityComponentEligible(initial));
  const selectedPreset = selectedConceptCode ? CONCEPT_PRESETS[selectedConceptCode] : undefined;

  const allowedTypes = useMemo(() => getAllowedTypesFromConcept(selectedConcept), [selectedConcept]);

  const currentAttributeId = initial?.id ?? null;

  const duplicateConceptCount = useMemo(() => {
    if (!selectedConceptCode) return 0;
    return allAttributes.filter(
      (a) => a.conceptCode === selectedConceptCode && a.id !== currentAttributeId,
    ).length;
  }, [allAttributes, currentAttributeId, selectedConceptCode]);

  const duplicateSystemConceptBlocked =
    !!selectedConceptCode &&
    UNIQUE_SYSTEM_CONCEPT_CODES.has(selectedConceptCode) &&
    duplicateConceptCount > 0;

  const conceptCardOptions = useMemo<ConceptCardOption[]>(() => {
    return conceptOptions.map((concept) => {
      const duplicateCount = allAttributes.filter(
        (a) => a.conceptCode === concept.code && a.id !== currentAttributeId,
      ).length;
      const blocked = UNIQUE_SYSTEM_CONCEPT_CODES.has(concept.code) && duplicateCount > 0;

      return {
        ...concept,
        blocked,
        duplicateCount,
      };
    });
  }, [conceptOptions, allAttributes, currentAttributeId]);

  useEffect(() => {
    if (!selectedConcept) {
      setAppliedSuggestionMessage(null);

      if (!allowedTypes.includes(getValues("type"))) {
        setValue("type", allowedTypes[0] ?? "TEXT", { shouldDirty: true });
      }

      return;
    }

    const preset = CONCEPT_PRESETS[selectedConcept.code];
    const conceptLabel = getConceptLabel(selectedConcept);
    let hasAppliedAutoConfig = false;

    if (!preset) {
      if (!hasUserEditedNameRef.current && !getValues("name")) {
        setValue("name", conceptLabel, { shouldDirty: true });
        hasAppliedAutoConfig = true;
      }

      if (!selectedIdentityEligible) {
        setValue("primaryField", false, { shouldDirty: true });
      }

      if (selectedConcept.derived) {
        setValue("editPolicy", "DERIVED", { shouldDirty: true });
      }

      if (watchedType && !getAllowedTypesFromConcept(selectedConcept).includes(watchedType)) {
        setValue("type", getAllowedTypesFromConcept(selectedConcept)[0] ?? "TEXT", {
          shouldDirty: true,
        });
        hasAppliedAutoConfig = true;
      }

      setAppliedSuggestionMessage(
        hasAppliedAutoConfig
          ? t("ATTRIBUTE_FORM.AUTO_CONFIG_APPLIED_SIMPLE", {
              defaultValue: "Configuration automatique appliquée pour ce concept.",
            })
          : null,
      );
      return;
    }

    const shouldForceConceptName = preset.forceNameFromConcept;
    const currentName = getValues("name");

    if (
      shouldForceConceptName &&
      (!hasUserEditedNameRef.current || !currentName || currentName === preset.suggestedName)
    ) {
      setValue("name", conceptLabel, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    } else if (!hasUserEditedNameRef.current && !currentName) {
      setValue("name", conceptLabel, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    }

    if (preset.forcedType) {
      setValue("type", preset.forcedType, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    } else if (!allowedTypes.includes(getValues("type"))) {
      const fallback = allowedTypes[0] ?? "TEXT";
      setValue("type", fallback, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    } else if (preset.suggested.type && !getValues("type")) {
      setValue("type", preset.suggested.type, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    }

    if (preset.forcedMaxValues != null) {
      setValue("maxValues", preset.forcedMaxValues, { shouldDirty: true });
    } else if (preset.suggested.maxValues != null) {
      setValue("maxValues", preset.suggested.maxValues, { shouldDirty: true });
    }

    if (preset.forcedEditPolicy) {
      setValue("editPolicy", preset.forcedEditPolicy, { shouldDirty: true });
    } else if (preset.suggested.editPolicy) {
      setValue("editPolicy", preset.suggested.editPolicy, { shouldDirty: true });
    }

    if (preset.forcedConstraintKind) {
      setValue("constraintKind", preset.forcedConstraintKind, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    } else if (preset.suggested.constraintKind) {
      setValue("constraintKind", preset.suggested.constraintKind, { shouldDirty: true });
      hasAppliedAutoConfig = true;
    }

    if (preset.forcedPrimaryField != null) {
      setValue("primaryField", preset.forcedPrimaryField, { shouldDirty: true });
    } else if (!selectedIdentityEligible) {
      setValue("primaryField", false, { shouldDirty: true });
    } else if (preset.suggested.primaryField != null) {
      setValue("primaryField", preset.suggested.primaryField, { shouldDirty: true });
    }

    if (preset.forcedRequired != null) {
      setValue("required", preset.forcedRequired, { shouldDirty: true });
    } else if (preset.suggested.required != null) {
      setValue("required", preset.suggested.required, { shouldDirty: true });
    }

    if (preset.forcedCategory != null) {
      setValue("category", preset.forcedCategory, { shouldDirty: true });
    } else if (preset.suggested.category != null) {
      setValue("category", preset.suggested.category, { shouldDirty: true });
    }

    if (preset.forcedFilter != null) {
      setValue("filter", preset.forcedFilter, { shouldDirty: true });
    } else if (preset.suggested.filter != null) {
      setValue("filter", preset.suggested.filter, { shouldDirty: true });
    }

    if (preset.forcedSort != null) {
      setValue("sort", preset.forcedSort, { shouldDirty: true });
    } else if (preset.suggested.sort != null) {
      setValue("sort", preset.suggested.sort, { shouldDirty: true });
    }

    if (preset.suggested.casingStrategy) {
      setValue("casingStrategy", preset.suggested.casingStrategy, { shouldDirty: true });
    }

    if (preset.suggested.constraintPayload != null) {
      setValue("constraintPayload", preset.suggested.constraintPayload, {
        shouldDirty: true,
      });
      hasAppliedAutoConfig = true;
    }

    setAppliedSuggestionMessage(
      hasAppliedAutoConfig
        ? t("ATTRIBUTE_FORM.AUTO_CONFIG_APPLIED_SIMPLE", {
            defaultValue: "Configuration automatique appliquée pour ce concept.",
          })
        : null,
    );
  }, [
    selectedConcept,
    allowedTypes,
    getValues,
    getConceptLabel,
    selectedIdentityEligible,
    setValue,
    t,
    watchedType,
  ]);

  const conceptTypeMismatch =
    !!selectedConcept && !!watchedType && !allowedTypes.includes(watchedType as AttributeType);

  const summaryChips = [
    selectedConcept
      ? {
          label: getConceptLabel(selectedConcept),
          color: "primary" as const,
        }
      : null,
    duplicateSystemConceptBlocked
      ? {
          label: t("ATTRIBUTE_FORM.ALREADY_USED", {
            defaultValue: "Déjà utilisé",
          }),
          color: "error" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    color: "default" | "primary" | "warning" | "error";
  }>;

  const onSubmit: SubmitHandler<AttributeCreateFormOutput> = async (data) => {
    try {
      if (duplicateSystemConceptBlocked) {
        notifyError(
          t("ATTRIBUTE_FORM.ERROR_DUPLICATE_SYSTEM_CONCEPT", {
            defaultValue: "Ce concept système est déjà utilisé dans ce tenant.",
          }),
        );
        return;
      }

      const effectiveEditPolicy: EditPolicy =
        selectedConceptDerived || selectedPreset?.forcedEditPolicy
          ? selectedPreset?.forcedEditPolicy ?? "DERIVED"
          : data.editPolicy;

      const effectivePrimaryField =
        selectedPreset?.forcedPrimaryField ?? data.primaryField;

      const effectiveType =
        isEdit && initial?.type ? initial.type : selectedPreset?.forcedType ?? data.type;

      const effectiveCategory = selectedPreset?.forcedCategory ?? data.category;
      const effectiveFilter = selectedPreset?.forcedFilter ?? data.filter;
      const effectiveSort = selectedPreset?.forcedSort ?? data.sort;
      const effectiveRequired = selectedPreset?.forcedRequired ?? data.required;

      const commonPayload = {
        name: data.name,
        conceptId: data.conceptId ?? null,
        primaryField: effectivePrimaryField,
        category: effectiveCategory,
        maxValues: selectedPreset?.forcedMaxValues ?? data.maxValues,
        filter: effectiveFilter,
        sort: effectiveSort,
        required: effectiveRequired,
        type: effectiveType,
        editPolicy: effectiveEditPolicy,
        casingStrategy: data.casingStrategy,
        constraintKind: selectedPreset?.forcedConstraintKind ?? data.constraintKind,
        constraintPayload: data.constraintPayload ?? null,
      };

      if (isEdit && initial) {
        const payload: UpdateAttributePayload = {
          id: initial.id,
          displayOrder: initial.displayOrder ?? null,
          ...commonPayload,
        };

        await updateAdminAttribute(initial.id, payload, { useIfMatch: true });

        notifySuccess(
          t("ATTRIBUTE_FORM.SUCCESS_UPDATED", {
            defaultValue: "Attribut mis à jour",
          }),
        );
      } else {
        const payload: CreateAttributePayload = {
          ...commonPayload,
          displayOrder: undefined,
        };

        await createAdminAttribute(payload);

        notifySuccess(
          t("ATTRIBUTE_FORM.SUCCESS_CREATED", {
            defaultValue: "Attribut créé",
          }),
        );
      }

      onClose(true);
    } catch (e: any) {
      notifyError(
        e?.message ||
          t("ATTRIBUTE_FORM.ERROR_SAVE", {
            defaultValue: "Erreur lors de l’enregistrement",
          }),
      );
    }
  };

  const handleClose = () => {
    if (
      isDirty &&
      !window.confirm(
        t("ATTRIBUTE_FORM.CONFIRM_CLOSE_DIRTY", {
          defaultValue: "Des modifications non enregistrées vont être perdues. Fermer ?",
        }),
      )
    ) {
      return;
    }
    onClose(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...(glassDialog(theme, 0.85) as object),
          overflow: "hidden",
          borderRadius: { xs: 0, sm: 3 },
          display: "flex",
          flexDirection: "column",
          maxHeight: { sm: "90vh" },
        },
      }}
    >
      <AttributeFormHeader isEdit={isEdit} summaryChips={summaryChips} />

      <DialogContent
        dividers
        className="scrollable-content"
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 2.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.015),
        }}
      >
        <AttributeFormAlerts
          isEdit={isEdit}
          appliedSuggestionMessage={appliedSuggestionMessage}
          duplicateSystemConceptBlocked={duplicateSystemConceptBlocked}
          conceptTypeMismatch={conceptTypeMismatch}
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <AttributeFormBasicsSection
              control={control}
              errors={errors}
              watchedName={watchedName}
              selectedConcept={selectedConcept}
              selectedType={watchedType as AttributeType}
              conceptCardOptions={conceptCardOptions}
              getConceptLabel={getConceptLabel}
              getConceptDescription={getConceptDescription}
              initialConceptId={initial?.conceptId ?? null}
              hasUserEditedNameRef={hasUserEditedNameRef}
            />

            <AttributeMainFormSection
              control={control}
              watch={watch}
              setValue={setValue}
              selectedConcept={selectedConcept}
              selectedConceptCode={selectedConceptCode}
              selectedType={watchedType as AttributeType}
            />
          </Stack>
        </form>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          flexShrink: 0,
          borderTop: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Button onClick={handleClose}>
          {t("ATTRIBUTE_FORM.CANCEL", { defaultValue: "Annuler" })}
        </Button>

        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting || duplicateSystemConceptBlocked || conceptTypeMismatch}
        >
          {isEdit
            ? t("ATTRIBUTE_FORM.SAVE", { defaultValue: "Enregistrer" })
            : t("ATTRIBUTE_FORM.CREATE", { defaultValue: "Créer l’attribut" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}