import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Fade,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import AttributeMainFormSection from "./attributeForm/AttributeMainFormSection";
import AttributeFormAlerts from "./attributeForm/AttributeFormAlerts";
import AttributeFormBasicsSection from "./attributeForm/AttributeFormBasicsSection";
import AttributeFormHeader from "./attributeForm/AttributeFormHeader";
import {
  getConceptCode,
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
  type EditPolicy,
  type ValueType,
} from "../../../../models/commons/Attribute/Attribute";
import {
  createAdminAttribute,
  updateAdminAttribute,
} from "../../../../services/business/admin/admin.attributes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import { glassDialog } from "../../../../styles/glassStyles";

const DEFAULT_CUSTOM_VALUE_TYPE: ValueType = "TEXT";

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

  const [highlightConfig, setHighlightConfig] = useState(false);

  const hasUserEditedNameRef = useRef(false);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const mainSectionRef = useRef<HTMLDivElement | null>(null);
  const previousMainSectionKeyRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

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
    setHighlightConfig(false);
    hasUserEditedNameRef.current = false;
    previousMainSectionKeyRef.current = null;
  }, [open, initial, reset]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current != null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const watchedConceptId = watch("conceptId");
  const watchedType = watch("type");
  const watchedName = watch("name");
  const watchedCasingStrategy = watch("casingStrategy");

  const selectedConcept = useMemo(
    () => conceptOptions.find((concept) => concept.id === watchedConceptId) ?? null,
    [conceptOptions, watchedConceptId],
  );

  const lockedValueType = selectedConcept?.valueType ?? null;

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

  const getConceptDescription = useCallback(
    (concept: Concept | null | undefined): string | null => {
      if (!concept) {
        return t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE_DESCRIPTION", {
          defaultValue:
            "Utilisez cette option si aucun modele existant ne correspond a votre besoin.",
        });
      }

      const translated = t(`CONCEPTS.${concept.code}.DESCRIPTION`, {
        defaultValue: "",
      });

      return translated || null;
    },
    [t],
  );

  const selectedConceptCode = selectedConcept?.code ?? getConceptCode(initial) ?? null;
  const selectedValueType = lockedValueType ?? watchedType ?? initial?.type ?? null;

  const selectedConceptDerived =
    selectedConcept?.derived ?? (selectedConcept ? false : isConceptDerived(initial));

  const selectedIdentityEligible =
    selectedConcept?.identityComponentEligible ??
    (selectedConcept ? false : isIdentityComponentEligible(initial));

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

  useEffect(() => {
    if (!selectedConcept) {
      const currentType = getValues("type");
      if (!currentType) {
        setValue("type", DEFAULT_CUSTOM_VALUE_TYPE, { shouldDirty: true });
      }
      return;
    }

    const conceptLabel = getConceptLabel(selectedConcept);

    if (!hasUserEditedNameRef.current && !getValues("name")) {
      setValue("name", conceptLabel, { shouldDirty: true });
    }

    if (getValues("type") !== selectedConcept.valueType) {
      setValue("type", selectedConcept.valueType, { shouldDirty: true });
    }

    if (!selectedIdentityEligible) {
      setValue("primaryField", false, { shouldDirty: true });
    }

    if (selectedConcept.derived && getValues("editPolicy") !== "DERIVED") {
      setValue("editPolicy", "DERIVED", { shouldDirty: true });
    }

    if (selectedConcept.defaultCasingStrategy && watchedCasingStrategy === "NONE") {
      setValue("casingStrategy", selectedConcept.defaultCasingStrategy, { shouldDirty: true });
    }
  }, [
    selectedConcept,
    getConceptLabel,
    getValues,
    selectedIdentityEligible,
    setValue,
    watchedCasingStrategy,
  ]);

  const conceptTypeMismatch =
    !!selectedConcept && !!watchedType && watchedType !== selectedConcept.valueType;

  const summaryChips = [
    selectedConcept
      ? {
          label: getConceptLabel(selectedConcept),
          color: "primary" as const,
        }
      : {
          label: t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
            defaultValue: "Champ personnalise",
          }),
          color: "default" as const,
        },
    selectedValueType
      ? {
          label: getValueTypeLabel(selectedValueType, t),
          color: "warning" as const,
        }
      : null,
    duplicateSingleUseConceptBlocked
      ? {
          label: t("ATTRIBUTE_FORM.ALREADY_USED", {
            defaultValue: "Deja utilise",
          }),
          color: "error" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    color: "default" | "primary" | "warning" | "error";
  }>;

  const footerSummary = summaryChips.map((chip) => chip.label).join(" | ");

  const mainSectionKey = `${selectedConceptCode ?? "CUSTOM"}::${selectedValueType ?? "NONE"}::${watchedType ?? "TEXT"}`;
  const showMainSection = Boolean(selectedConceptCode || selectedValueType);

  useEffect(() => {
    if (!open || !showMainSection) return;

    if (previousMainSectionKeyRef.current == null) {
      previousMainSectionKeyRef.current = mainSectionKey;
      return;
    }

    if (previousMainSectionKeyRef.current === mainSectionKey) return;

    previousMainSectionKeyRef.current = mainSectionKey;

    const container = dialogContentRef.current;
    const section = mainSectionRef.current;

    if (!container || !section) return;

    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();

      const visibilityOffset = 16;
      const scrollOffset = 12;

      const isAboveVisibleZone = sectionRect.top < containerRect.top + visibilityOffset;
      const isBelowVisibleZone = sectionRect.bottom > containerRect.bottom - visibilityOffset;

      if (isAboveVisibleZone || isBelowVisibleZone) {
        const nextTop =
          container.scrollTop + (sectionRect.top - containerRect.top) - scrollOffset;

        container.scrollTo({
          behavior: "smooth",
          top: Math.max(0, nextTop),
        });
      }

      setHighlightConfig(false);
      requestAnimationFrame(() => setHighlightConfig(true));

      if (highlightTimeoutRef.current != null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightConfig(false);
        highlightTimeoutRef.current = null;
      }, 1200);
    });
  }, [mainSectionKey, open, showMainSection]);

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
      const effectiveType: ValueType = lockedValueType ?? data.type ?? DEFAULT_CUSTOM_VALUE_TYPE;

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

            <AttributeFormBasicsSection
              control={control}
              errors={errors}
              watchedName={watchedName}
              selectedConcept={selectedConcept}
              selectedType={(watchedType ?? DEFAULT_CUSTOM_VALUE_TYPE) as ValueType}
              conceptCardOptions={conceptCardOptions}
              getConceptLabel={getConceptLabel}
              getConceptDescription={getConceptDescription}
              initialConceptId={initial?.conceptId ?? null}
              hasUserEditedNameRef={hasUserEditedNameRef}
            />

            <Collapse in={showMainSection} timeout={240} unmountOnExit>
              <Fade in={showMainSection} timeout={240}>
                <Box ref={mainSectionRef} sx={{ scrollMarginTop: 12 }}>
                  <Divider sx={{ mb: 3.5, opacity: 0.5 }} />
                  <Box
                    sx={{
                      borderRadius: 3,
                      transition: theme.transitions.create(["background-color", "box-shadow"], {
                        duration: theme.transitions.duration.shorter,
                      }),
                      backgroundColor: highlightConfig
                        ? alpha(theme.palette.primary.main, 0.06)
                        : "transparent",
                      boxShadow: highlightConfig
                        ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}`
                        : "none",
                    }}
                  >
                    <AttributeMainFormSection
                      control={control}
                      watch={watch}
                      setValue={setValue}
                      selectedConceptCode={selectedConceptCode}
                      selectedType={(selectedValueType ?? DEFAULT_CUSTOM_VALUE_TYPE) as ValueType}
                    />
                  </Box>
                </Box>
              </Fade>
            </Collapse>
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
          <Typography variant="caption" color="text.secondary" sx={{ mr: "auto" }}>
            {footerSummary ||
              t("ATTRIBUTE_FORM.FOOTER_SUMMARY", {
                defaultValue: "Le formulaire s'adapte selon le modele choisi.",
              })}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            <Button onClick={handleClose} color="inherit">
              {t("ATTRIBUTE_FORM.CANCEL", { defaultValue: "Annuler" })}
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || duplicateSingleUseConceptBlocked || conceptTypeMismatch}
            >
              {isEdit
                ? t("ATTRIBUTE_FORM.SAVE", { defaultValue: "Enregistrer" })
                : t("ATTRIBUTE_FORM.CREATE", { defaultValue: "Creer le champ" })}
            </Button>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
