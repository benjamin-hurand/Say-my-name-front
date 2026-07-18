import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Fade,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import AttributeFormAlerts from "./attributeForm/AttributeFormAlerts";
import AttributeFormHeader from "./attributeForm/AttributeFormHeader";
import ConceptPickerScreen from "./attributeForm/ConceptPickerScreen";
import FieldConfigScreen from "./attributeForm/FieldConfigScreen";
import ValueTypePickerScreen from "./attributeForm/ValueTypePickerScreen";
import {
  makeDefaultValues,
} from "./attributeForm/attributeForm.helpers";
import {
  DEFAULT_CUSTOM_VALUE_TYPE,
  resolveFieldSemanticContext,
} from "./attributeForm/attributeForm.semantic";
import {
  sanitizeConfigForValueType,
  type SanitizedAttributeConfig,
} from "./attributeForm/attributeForm.compatibility";
import type {
  AttributeFormDrawerProps,
  ConceptCardOption,
  DrawerMode,
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
  type EditPolicy,
  type ValueType,
} from "../../../../models/commons/Attribute/Attribute";
import {
  createAdminAttribute,
  updateAdminAttribute,
} from "../../../../services/business/admin/admin.attributes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import { glassDialog } from "../../../../styles/glassStyles";

function getValueTypeLabel(
  valueType: ValueType,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  switch (valueType) {
    case "TEXT":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.TEXT", { defaultValue: "Texte" });
    case "ENUM":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.ENUM", { defaultValue: "Liste de choix" });
    case "NUMBER":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.NUMBER", { defaultValue: "Nombre" });
    case "DATE":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.DATE", { defaultValue: "Date" });
    case "DATETIME":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.DATETIME", { defaultValue: "Date & heure" });
    case "BOOLEAN":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.BOOLEAN", { defaultValue: "Oui / Non" });
    default:
      return valueType;
  }
}

export default function AttributeFormDrawer({
  open,
  initial,
  onClose,
  conceptOptions,
  allAttributes,
}: AttributeFormDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = Boolean(initial?.id);

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(
    isEdit ? "field-config" : "concept-selection",
  );
  const [hasConfirmedConceptChoice, setHasConfirmedConceptChoice] = useState(isEdit);

  const hasUserEditedNameRef = useRef(false);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const previousEffectiveValueTypeRef = useRef<ValueType | null>(null);

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
    setDrawerMode(initial?.id ? "field-config" : "concept-selection");
    setHasConfirmedConceptChoice(Boolean(initial?.id));
    hasUserEditedNameRef.current = false;
    previousEffectiveValueTypeRef.current = null;
  }, [open, initial, reset]);

  useEffect(() => {
    if (!open) return;

    dialogContentRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [drawerMode, open]);

  const watchedConceptId = watch("conceptId");
  const watchedType = watch("type");
  const watchedName = watch("name");

  const fieldContext = useMemo(
    () =>
      resolveFieldSemanticContext({
        conceptOptions,
        conceptId: watchedConceptId,
        formType: watchedType,
        initial,
        fallbackValueType: DEFAULT_CUSTOM_VALUE_TYPE,
      }),
    [conceptOptions, initial, watchedConceptId, watchedType],
  );

  const selectedConcept = fieldContext.concept;
  const selectedConceptCode = fieldContext.semanticPresetCode;
  const selectedValueType = fieldContext.effectiveValueType;

  const getConceptLabel = useCallback(
    (concept: Concept | null | undefined): string => {
      if (!concept) {
        return t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
          defaultValue: "Champ personnalise",
        });
      }

      return t(`CONCEPTS.${concept.code}.LABEL`, {
        defaultValue: concept.code,
      });
    },
    [t],
  );

  const selectedConceptDerived = fieldContext.isDerived;
  const selectedIdentityEligible = fieldContext.identityComponentEligible;

  const currentAttributeId = initial?.id ?? null;

  const duplicateConceptCount = useMemo(() => {
    if (!selectedConceptCode) return 0;

    return allAttributes.filter(
      (attribute) =>
        attribute.conceptCode === selectedConceptCode && attribute.id !== currentAttributeId,
    ).length;
  }, [allAttributes, currentAttributeId, selectedConceptCode]);

  const duplicateSingleUseConceptBlocked =
    !!selectedConcept &&
    selectedConcept.tenantUsagePolicy === "SINGLE" &&
    duplicateConceptCount > 0;

  const conceptCardOptions = useMemo<ConceptCardOption[]>(() => {
    return conceptOptions.map((concept) => {
      const duplicateCount = allAttributes.filter(
        (attribute) =>
          attribute.conceptCode === concept.code && attribute.id !== currentAttributeId,
      ).length;

      return {
        ...concept,
        blocked: concept.tenantUsagePolicy === "SINGLE" && duplicateCount > 0,
        duplicateCount,
      };
    });
  }, [conceptOptions, allAttributes, currentAttributeId]);

  const applySanitizedConfig = useCallback(
    (patch: SanitizedAttributeConfig) => {
      if (patch.enumOptions !== undefined) {
        setValue("enumOptions", patch.enumOptions, { shouldDirty: true });
      }

      if (patch.casingStrategy !== undefined) {
        setValue("casingStrategy", patch.casingStrategy, { shouldDirty: true });
      }

      if (patch.constraintKind !== undefined) {
        setValue("constraintKind", patch.constraintKind, { shouldDirty: true });
      }

      if (patch.constraintPayload !== undefined) {
        setValue("constraintPayload", patch.constraintPayload, { shouldDirty: true });
      }
    },
    [setValue],
  );

  useEffect(() => {
    if (!open) return;

    const nextValueType = fieldContext.effectiveValueType;
    const previousValueType = previousEffectiveValueTypeRef.current;

    if (previousValueType == null) {
      previousEffectiveValueTypeRef.current = nextValueType;
      return;
    }

    if (previousValueType === nextValueType) return;

    const patch = sanitizeConfigForValueType({
      previousValueType,
      nextValueType,
      values: getValues(),
    });

    applySanitizedConfig(patch);
    previousEffectiveValueTypeRef.current = nextValueType;
  }, [applySanitizedConfig, fieldContext.effectiveValueType, getValues, open]);

  const applyConceptDefaults = useCallback(
    (concept: Concept) => {
      const conceptLabel = getConceptLabel(concept);

      if (!hasUserEditedNameRef.current && !getValues("name")) {
        setValue("name", conceptLabel, { shouldDirty: true });
      }

      setValue("type", concept.valueType, { shouldDirty: true });

      if (!concept.identityComponentEligible) {
        setValue("primaryField", false, { shouldDirty: true });
      }

      if (concept.derived && getValues("editPolicy") !== "DERIVED") {
        setValue("editPolicy", "DERIVED", { shouldDirty: true });
      }

      if (concept.defaultCasingStrategy && getValues("casingStrategy") === "NONE") {
        setValue("casingStrategy", concept.defaultCasingStrategy, { shouldDirty: true });
      }
    },
    [getConceptLabel, getValues, setValue],
  );

  const handleSelectConcept = useCallback(
    (nextConceptId: number | null) => {
      setHasConfirmedConceptChoice(true);
      setValue("conceptId", nextConceptId, { shouldDirty: true });

      if (nextConceptId == null) {
        setDrawerMode("type-selection");
        return;
      }

      const nextConcept = conceptOptions.find((concept) => concept.id === nextConceptId);
      if (nextConcept) {
        applyConceptDefaults(nextConcept);
      }

      setDrawerMode("field-config");
    },
    [applyConceptDefaults, conceptOptions, setValue],
  );

  const handleSelectValueType = useCallback(
    (nextType: ValueType) => {
      setValue("type", nextType, { shouldDirty: true });
      setDrawerMode("field-config");
    },
    [setValue],
  );

  const conceptTypeMismatch =
    !!selectedConcept && !!watchedType && watchedType !== selectedConcept.valueType;

  const onSubmit: SubmitHandler<AttributeCreateFormOutput> = async (data) => {
    try {
      if (duplicateSingleUseConceptBlocked) {
        notifyError(
          t("ATTRIBUTE_FORM.ERROR_DUPLICATE_SYSTEM_CONCEPT", {
            defaultValue: "Ce modele ne peut etre utilise qu'une seule fois dans cet espace.",
          }),
        );
        return;
      }

      const effectiveEditPolicy: EditPolicy = selectedConceptDerived ? "DERIVED" : data.editPolicy;
      const effectivePrimaryField = selectedIdentityEligible ? data.primaryField : false;
      const effectiveType: ValueType = fieldContext.effectiveValueType;

      const commonPayload = {
        name: data.name,
        conceptId: data.conceptId ?? null,
        primaryField: effectivePrimaryField,
        category: data.category,
        maxValues: data.maxValues,
        filter: data.filter,
        sort: data.sort,
        required: data.required,
        type: effectiveType,
        editPolicy: effectiveEditPolicy,
        casingStrategy: data.casingStrategy,
        constraintKind: data.constraintKind,
        constraintPayload: data.constraintPayload ?? null,
        ...(effectiveType === "ENUM" ? { enumOptions: data.enumOptions ?? [] } : {}),
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
            defaultValue: "Champ mis a jour",
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
            defaultValue: "Champ cree",
          }),
        );
      }

      onClose(true);
    } catch (error: unknown) {
      notifyError(
        (error instanceof Error ? error.message : null) ||
          t("ATTRIBUTE_FORM.ERROR_SAVE", {
            defaultValue: "Erreur lors de l'enregistrement",
          }),
      );
    }
  };

  const handleClose = () => {
    if (
      isDirty &&
      !window.confirm(
        t("ATTRIBUTE_FORM.CONFIRM_CLOSE_DIRTY", {
          defaultValue: "Des modifications non enregistrees vont etre perdues. Fermer ?",
        }),
      )
    ) {
      return;
    }

    onClose(false);
  };

  const renderDrawerMode = () => {
    switch (drawerMode) {
      case "concept-selection":
        return (
          <ConceptPickerScreen
            options={conceptCardOptions}
            value={hasConfirmedConceptChoice ? watchedConceptId ?? null : undefined}
            onSelect={handleSelectConcept}
            getConceptLabel={getConceptLabel}
            initialConceptId={initial?.conceptId ?? null}
          />
        );

      case "type-selection":
        return (
          <ValueTypePickerScreen
            value={selectedValueType}
            onSelect={handleSelectValueType}
          />
        );

      case "field-config":
        return (
          <FieldConfigScreen
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            watchedName={watchedName}
            selectedConcept={selectedConcept}
            selectedConceptCode={selectedConceptCode}
            selectedType={selectedValueType}
            valueTypeLabel={getValueTypeLabel(selectedValueType, t)}
            isCustom={fieldContext.isCustom}
            identityComponentEligible={fieldContext.identityComponentEligible}
            getConceptLabel={getConceptLabel}
            hasUserEditedNameRef={hasUserEditedNameRef}
            onChangeConcept={() => setDrawerMode("concept-selection")}
            onChangeType={() => setDrawerMode("type-selection")}
          />
        );

      default:
        return null;
    }
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
      <AttributeFormHeader isEdit={isEdit} />

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <DialogContent
          ref={dialogContentRef}
          dividers
          className="scrollable-content"
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2, sm: 3 },
            py: { xs: 2.25, sm: 3 },
            backgroundColor: alpha(theme.palette.primary.main, 0.015),
          }}
        >
          <Stack spacing={3.5}>
            <AttributeFormAlerts
              duplicateSystemConceptBlocked={duplicateSingleUseConceptBlocked}
              conceptTypeMismatch={conceptTypeMismatch}
            />

            <Fade key={drawerMode} in timeout={160}>
              <Box
                sx={(muiTheme) => ({
                  transition: muiTheme.transitions.create(["opacity", "transform"], {
                    duration: muiTheme.transitions.duration.shortest,
                  }),
                  transform: "translateY(0)",
                })}
              >
                {renderDrawerMode()}
              </Box>
            </Fade>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.25, sm: 1.5 },
            flexShrink: 0,
            borderTop: (muiTheme) => `1px solid ${alpha(muiTheme.palette.divider, 0.6)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.45),
            backdropFilter: "blur(8px)",
            justifyContent: "space-between",
            gap: 1.25,
            flexWrap: "wrap",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            {drawerMode === "type-selection" ? (
              <Button
                type="button"
                onClick={() => setDrawerMode("concept-selection")}
                color="inherit"
              >
                {t("ATTRIBUTE_FORM.BACK", { defaultValue: "Retour" })}
              </Button>
            ) : null}

            <Button onClick={handleClose} color="inherit">
              {t("ATTRIBUTE_FORM.CANCEL", { defaultValue: "Annuler" })}
            </Button>

            {drawerMode === "field-config" ? (
              <Button
                type="submit"
                variant="contained"
                disabled={
                  isSubmitting || duplicateSingleUseConceptBlocked || conceptTypeMismatch
                }
              >
                {isEdit
                  ? t("ATTRIBUTE_FORM.SAVE", { defaultValue: "Enregistrer" })
                  : t("ATTRIBUTE_FORM.CREATE", { defaultValue: "Creer le champ" })}
              </Button>
            ) : null}
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
