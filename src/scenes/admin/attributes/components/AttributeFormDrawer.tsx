import { zodResolver } from "@hookform/resolvers/zod";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
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
import SelectedFieldSummary from "./attributeForm/SelectedFieldSummary";
import ValueTypePickerScreen from "./attributeForm/ValueTypePickerScreen";
import {
  makeDefaultValues,
  getValueTypeLabel,
} from "./attributeForm/attributeForm.helpers";
import {
  DEFAULT_CUSTOM_VALUE_TYPE,
  resolveFieldSemanticContext,
} from "./attributeForm/attributeForm.semantic";
import {
  confirmCustomTypeSelection,
  resetCustomTypeSelection,
  resolvePickerValue,
} from "./attributeForm/attributeForm.customType";
import {
  sanitizeConfigForValueType,
  type SanitizedAttributeConfig,
} from "./attributeForm/attributeForm.compatibility";
import { resolveConceptMaxValues } from "./attributeForm/attributeForm.cardinality";
import { resolveSuggestedCasingStrategy } from "./attributeForm/attributeForm.casing";
import {
  resolveConceptAvailability,
  resolveConfiguredConceptItems,
  isNormalAttributeConcept,
  filterAvailableConcepts,
  shouldSkipConceptPicker,
} from "./attributeForm/attributeForm.conceptAvailability";
import type {
  AttributeFormDrawerProps,
  AttributeCreationView,
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
  type CasingStrategy,
  type EditPolicy,
  type ValueType,
} from "../../../../models/commons/Attribute/Attribute";
import {
  createAdminAttribute,
  updateAdminAttribute,
} from "../../../../services/business/admin/admin.attributes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import { glassDialog } from "../../../../styles/glassStyles";
import { getApiErrorMessage, getApiStatus } from "../../../../utils/apiError";

export default function AttributeFormDrawer({
  open,
  initial,
  onClose,
  onEditAttribute,
  conceptOptions,
  allAttributes,
  onRefreshAttributes,
}: AttributeFormDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = Boolean(initial?.id);
  const availabilityByConceptId = useMemo(
    () =>
      resolveConceptAvailability(
        conceptOptions,
        allAttributes,
        initial?.id,
      ),
    [allAttributes, conceptOptions, initial?.id],
  );
  const availableConceptOptions = useMemo(
    () => filterAvailableConcepts(conceptOptions, availabilityByConceptId),
    [availabilityByConceptId, conceptOptions],
  );
  const skipConceptPicker = shouldSkipConceptPicker(isEdit, availableConceptOptions);

  const initialView: AttributeCreationView = isEdit
    ? "configuration"
    : skipConceptPicker
      ? "custom-type-selection"
      : "template-selection";

  const [view, setView] = useState<AttributeCreationView>(initialView);
  const [hasConfirmedConceptChoice, setHasConfirmedConceptChoice] = useState(
    isEdit || skipConceptPicker,
  );
  const [hasConfirmedCustomType, setHasConfirmedCustomType] = useState(isEdit);

  const isNameCustomizedRef = useRef(isEdit);
  const isCasingCustomizedRef = useRef(isEdit);
  const lastTextCasingStrategyRef = useRef<CasingStrategy>(
    initial?.type === "TEXT" ? initial.casingStrategy ?? "NONE" : "NONE",
  );
  const wasLastTextCasingCustomizedRef = useRef(
    isEdit && initial?.type === "TEXT",
  );
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
    setView(initialView);
    setHasConfirmedConceptChoice(Boolean(initial?.id) || skipConceptPicker);
    setHasConfirmedCustomType(Boolean(initial?.id));
    isNameCustomizedRef.current = Boolean(initial?.id);
    isCasingCustomizedRef.current = Boolean(initial?.id);
    lastTextCasingStrategyRef.current =
      initial?.type === "TEXT" ? initial.casingStrategy ?? "NONE" : "NONE";
    wasLastTextCasingCustomizedRef.current =
      Boolean(initial?.id) && initial?.type === "TEXT";
    previousEffectiveValueTypeRef.current = null;
  }, [open, initial, reset, initialView, skipConceptPicker]);

  useEffect(() => {
    if (!open) return;

    dialogContentRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [view, open]);

  const watchedConceptId = watch("conceptId");
  const watchedType = watch("type");
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
          defaultValue: "Champ personnalisé",
        });
      }

      return t(`CONCEPTS.${concept.code}.LABEL`, {
        defaultValue: concept.code,
      });
    },
    [t],
  );
  const configuredConceptItems = useMemo(
    () =>
      resolveConfiguredConceptItems(
        conceptOptions,
        allAttributes,
        availabilityByConceptId,
        getConceptLabel,
      ),
    [
      allAttributes,
      availabilityByConceptId,
      conceptOptions,
      getConceptLabel,
    ],
  );

  const selectedConceptDerived = fieldContext.isDerived;

  const applySanitizedConfig = useCallback(
    (patch: SanitizedAttributeConfig) => {
      if (patch.enumOptions !== undefined) {
        setValue("enumOptions", patch.enumOptions, { shouldDirty: true });
      }

      if (patch.casingStrategy !== undefined) {
        setValue("casingStrategy", patch.casingStrategy, { shouldDirty: false });
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

    if (previousValueType === "TEXT" && nextValueType !== "TEXT") {
      lastTextCasingStrategyRef.current = getValues("casingStrategy") ?? "NONE";
      wasLastTextCasingCustomizedRef.current = isCasingCustomizedRef.current;
    }

    const patch = sanitizeConfigForValueType({
      previousValueType,
      nextValueType,
      values: getValues(),
    });

    applySanitizedConfig(patch);

    if (previousValueType !== "TEXT" && nextValueType === "TEXT") {
      isCasingCustomizedRef.current = wasLastTextCasingCustomizedRef.current;
      setValue(
        "casingStrategy",
        resolveSuggestedCasingStrategy({
          recommendedStrategy: fieldContext.defaultCasingStrategy,
          currentValue: lastTextCasingStrategyRef.current,
          isCustomized: wasLastTextCasingCustomizedRef.current,
          valueType: nextValueType,
        }),
        { shouldDirty: false },
      );
    }

    previousEffectiveValueTypeRef.current = nextValueType;
  }, [
    applySanitizedConfig,
    fieldContext.defaultCasingStrategy,
    fieldContext.effectiveValueType,
    getValues,
    open,
    setValue,
  ]);

  useEffect(() => {
    if (!open) return;

    const maxValues = getValues("maxValues")!;
    const conceptMaxValues = resolveConceptMaxValues(
      fieldContext.requiredMaxValues,
      maxValues,
    );
    if (!conceptMaxValues.locked || maxValues === conceptMaxValues.value) return;

    setValue("maxValues", conceptMaxValues.value, {
      shouldValidate: true,
    });
  }, [fieldContext.requiredMaxValues, getValues, open, setValue]);

  const applyAutomaticName = useCallback(
    (name: string) => {
      if (isNameCustomizedRef.current) return;

      setValue("name", name, {
        shouldDirty: false,
        shouldValidate: name.length > 0,
      });
    },
    [setValue],
  );

  const applyAutomaticCasing = useCallback(
    (recommendedStrategy: CasingStrategy | null, valueType: ValueType) => {
      if (valueType !== "TEXT") return;

      const currentValue = getValues("casingStrategy") ?? "NONE";
      const nextValue = resolveSuggestedCasingStrategy({
        recommendedStrategy,
        currentValue,
        isCustomized: isCasingCustomizedRef.current,
        valueType,
      });

      if (nextValue !== currentValue) {
        setValue("casingStrategy", nextValue, { shouldDirty: false });
      }

      if (valueType === "TEXT") {
        lastTextCasingStrategyRef.current = nextValue;
        wasLastTextCasingCustomizedRef.current = isCasingCustomizedRef.current;
      }
    },
    [getValues, setValue],
  );

  const handleCasingCustomizationChange = useCallback(
    (isCustomized: boolean, strategy: CasingStrategy) => {
      isCasingCustomizedRef.current = isCustomized;
      lastTextCasingStrategyRef.current = strategy;
      wasLastTextCasingCustomizedRef.current = isCustomized;
    },
    [],
  );

  const applyConceptDefaults = useCallback(
    (concept: Concept) => {
      const conceptLabel = getConceptLabel(concept);

      applyAutomaticName(conceptLabel);
      applyAutomaticCasing(concept.defaultCasingStrategy, concept.valueType);

      setValue("type", concept.valueType, { shouldDirty: true });

      if (concept.derived && getValues("editPolicy") !== "DERIVED") {
        setValue("editPolicy", "DERIVED", { shouldDirty: true });
      }

    },
    [applyAutomaticCasing, applyAutomaticName, getConceptLabel, getValues, setValue],
  );

  const handleSelectConcept = useCallback(
    (nextConceptId: number | null) => {
      if (
        nextConceptId != null &&
        (availabilityByConceptId.get(nextConceptId)?.available === false ||
          !conceptOptions.some(
            (concept) => concept.id === nextConceptId && isNormalAttributeConcept(concept),
          ))
      ) {
        return;
      }

      setHasConfirmedConceptChoice(true);
      setValue("conceptId", nextConceptId, { shouldDirty: true });

      if (nextConceptId == null) {
        applyAutomaticName("");
        applyAutomaticCasing(null, "TEXT");

        const reset = resetCustomTypeSelection();
        setValue("type", reset.type, { shouldDirty: true });
        setHasConfirmedCustomType(reset.confirmed);

        setView("custom-type-selection");
        return;
      }

      const nextConcept = conceptOptions.find((concept) => concept.id === nextConceptId);
      if (nextConcept) {
        applyConceptDefaults(nextConcept);
      }

      setView("configuration");
    },
    [
      applyAutomaticCasing,
      applyAutomaticName,
      applyConceptDefaults,
      availabilityByConceptId,
      conceptOptions,
      setValue,
    ],
  );

  const handleSelectValueType = useCallback(
    (nextType: ValueType) => {
      const confirmed = confirmCustomTypeSelection(nextType);
      setValue("type", confirmed.type, { shouldDirty: true });
      setHasConfirmedCustomType(confirmed.confirmed);
      setView("configuration");
    },
    [setValue],
  );

  const conceptTypeMismatch =
    !!selectedConcept && !!watchedType && watchedType !== selectedConcept.valueType;
  const selectedConceptUnavailable =
    watchedConceptId != null &&
    availabilityByConceptId.get(watchedConceptId)?.available === false;

  const currentStep: 1 | 2 = view === "configuration" ? 2 : 1;

  const handleBack = useCallback(() => {
    if (view === "custom-type-selection") {
      setView("template-selection");
      return;
    }

    if (view === "configuration") {
      setView(fieldContext.isCustom ? "custom-type-selection" : "template-selection");
    }
  }, [fieldContext.isCustom, view]);

  const onSubmit: SubmitHandler<AttributeCreateFormOutput> = async (data) => {
    try {
      if (initial?.conceptCode === "IDENTITY") {
        notifyError(t("ATTRIBUTE_FORM.IDENTITY_PROTECTED", {
          defaultValue: "L'attribut système Identité ne peut pas être modifié ici.",
        }));
        return;
      }

      const effectiveEditPolicy: EditPolicy = selectedConceptDerived ? "DERIVED" : data.editPolicy;
      const effectiveType: ValueType = fieldContext.effectiveValueType;
      const effectiveMaxValues = resolveConceptMaxValues(
        fieldContext.requiredMaxValues,
        data.maxValues,
      ).value;

      const commonPayload = {
        name: data.name,
        conceptId: data.conceptId ?? null,
        maxValues: effectiveMaxValues,
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
          displayOrder: initial.displayOrder ?? null,
          ...commonPayload,
        };

        await updateAdminAttribute(initial.id, payload);

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
      const fallback = t("ATTRIBUTE_FORM.ERROR_SAVE", {
        defaultValue: "Erreur lors de l'enregistrement",
      });
      notifyError(getApiErrorMessage(error, fallback));

      if (getApiStatus(error) === 409) {
        await onRefreshAttributes();
      }
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

  const renderView = () => {
    switch (view) {
      case "template-selection":
        return (
          <ConceptPickerScreen
            options={conceptOptions}
            value={hasConfirmedConceptChoice ? watchedConceptId ?? null : undefined}
            onSelect={handleSelectConcept}
            getConceptLabel={getConceptLabel}
            availabilityByConceptId={availabilityByConceptId}
            configuredConceptItems={configuredConceptItems}
            onEditAttribute={onEditAttribute}
          />
        );

      case "custom-type-selection":
        return (
          <ValueTypePickerScreen
            value={resolvePickerValue({
              type: selectedValueType,
              confirmed: hasConfirmedCustomType,
            })}
            onSelect={handleSelectValueType}
          />
        );

      case "configuration":
        return (
          <FieldConfigScreen
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            selectedConceptCode={selectedConceptCode}
            selectedType={selectedValueType}
            casingApplicable={fieldContext.casingApplicable}
            recommendedCasingStrategy={fieldContext.defaultCasingStrategy}
            onCasingCustomizationChange={handleCasingCustomizationChange}
            requiredMaxValues={fieldContext.requiredMaxValues}
            isNameCustomizedRef={isNameCustomizedRef}
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
      <AttributeFormHeader
        currentStep={currentStep}
        isEdit={isEdit}
        summary={
          view === "configuration" ? (
            <SelectedFieldSummary
              selectedConcept={selectedConcept}
              valueTypeLabel={getValueTypeLabel(selectedValueType, t)}
              isCustom={fieldContext.isCustom}
              requiredMaxValues={fieldContext.requiredMaxValues}
              getConceptLabel={getConceptLabel}
            />
          ) : undefined
        }
      />

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
            <AttributeFormAlerts conceptTypeMismatch={conceptTypeMismatch} />

            <Fade key={view} in timeout={160}>
              <Box
                sx={(muiTheme) => ({
                  transition: muiTheme.transitions.create(["opacity", "transform"], {
                    duration: muiTheme.transitions.duration.shortest,
                  }),
                  transform: "translateY(0)",
                })}
              >
                {renderView()}
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
          {!isEdit && view !== "template-selection" ? (
            <Button
              type="button"
              size="small"
              variant="text"
              startIcon={<ArrowBackRoundedIcon fontSize="small" />}
              onClick={handleBack}
              color="inherit"
            >
              {t("ATTRIBUTE_FORM.BACK", { defaultValue: "Retour" })}
            </Button>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            <Button onClick={handleClose} color="inherit">
              {t("ATTRIBUTE_FORM.CANCEL", { defaultValue: "Annuler" })}
            </Button>

            {view === "configuration" ? (
              <Button
                type="submit"
                variant="contained"
                disabled={
                  isSubmitting || conceptTypeMismatch || selectedConceptUnavailable
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
