import { zodResolver } from "@hookform/resolvers/zod";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PsychologyAltRoundedIcon from "@mui/icons-material/PsychologyAltRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormHelperText,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { glassCard, glassDialog } from "../../../../styles/glassStyles";
import type { SvgIconComponent } from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";

import ConstraintEditor from "./ConstraintEditor";
import {
  attributeCreateSchema,
  type AttributeCreateFormInput,
  type AttributeCreateFormOutput,
} from "../validation/attributeCreate.schema";
import {
  ATTRIBUTE_TYPES,
  CASING_STRATEGIES,
  EDIT_POLICIES,
  type Attribute,
  type AttributeType,
  type CasingStrategy,
  type ConstraintKind,
  type EditPolicy,
} from "../../../../models/commons/Attribute/Attribute";
import type { ConstraintPayload } from "../../../../models/commons/Attribute/constraintPayload.schema";
import type { Concept, ConceptValueType } from "../../../../models/commons/Concept/Concept";
import type {
  CreateAttributePayload,
  UpdateAttributePayload,
} from "../../../../models/commons/Attribute/Attribute.dto";
import {
  createAdminAttribute,
  updateAdminAttribute,
} from "../../../../services/business/admin/admin.attributes.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";

type Props = {
  open: boolean;
  initial?: Attribute;
  onClose: (changed: boolean) => void;
  conceptOptions: Concept[];
  allAttributes: Attribute[];
};

type ConceptPreset = {
  forceNameFromConcept?: boolean;
  suggestedName?: string;
  forcedType?: AttributeType;
  allowedTypes?: AttributeType[];
  forcedMaxValues?: number;
  forcedEditPolicy?: EditPolicy;
  forcedConstraintKind?: ConstraintKind;
  forcedPrimaryField?: boolean;
  forcedRequired?: boolean;
  forcedCategory?: boolean;
  forcedFilter?: boolean;
  forcedSort?: boolean;
  hideType?: boolean;
  hideMaxValues?: boolean;
  hideEditPolicy?: boolean;
  hidePrimaryField?: boolean;
  hideRequired?: boolean;
  suggested: Partial<{
    type: AttributeType;
    casingStrategy: CasingStrategy;
    maxValues: number;
    primaryField: boolean;
    category: boolean;
    filter: boolean;
    sort: boolean;
    required: boolean;
    editPolicy: EditPolicy;
    constraintKind: ConstraintKind;
    constraintPayload: ConstraintPayload | null;
  }>;
};

const CONCEPT_TYPE_COMPATIBILITY: Record<ConceptValueType, AttributeType[]> = {
  TEXT: ["TEXT", "EMAIL", "URL"],
  ENUM: ["ENUM"],
  DATETIME: ["DATE", "DATETIME"],
  NUMBER: ["NUMBER"],
  BOOLEAN: ["BOOLEAN"],
};

const UNIQUE_SYSTEM_CONCEPT_CODES = new Set([
  "FIRST_NAME",
  "LAST_NAME",
  "GENDER",
  "IDENTITY",
]);

const CONCEPT_PRESETS: Record<string, ConceptPreset> = {
  FIRST_NAME: {
    forceNameFromConcept: true,
    forcedType: "TEXT",
    allowedTypes: ["TEXT"],
    forcedMaxValues: 1,
    forcedPrimaryField: true,
    forcedRequired: true,
    forcedCategory: false,
    forcedFilter: false,
    forcedSort: true,
    hideType: true,
    hideMaxValues: true,
    hidePrimaryField: true,
    hideRequired: true,
    suggested: {
      casingStrategy: "TITLE_CASE",
      primaryField: true,
      category: false,
      filter: false,
      sort: true,
      required: true,
      editPolicy: "FREE",
      constraintKind: "NONE",
      constraintPayload: { kind: "NONE" },
    },
  },
  LAST_NAME: {
    forceNameFromConcept: true,
    forcedType: "TEXT",
    allowedTypes: ["TEXT"],
    forcedMaxValues: 1,
    forcedPrimaryField: true,
    forcedRequired: true,
    forcedCategory: false,
    forcedFilter: false,
    forcedSort: true,
    hideType: true,
    hideMaxValues: true,
    hidePrimaryField: true,
    hideRequired: true,
    suggested: {
      casingStrategy: "UPPERCASE",
      primaryField: true,
      category: false,
      filter: false,
      sort: true,
      required: true,
      editPolicy: "FREE",
      constraintKind: "NONE",
      constraintPayload: { kind: "NONE" },
    },
  },
  GENDER: {
    forceNameFromConcept: true,
    forcedType: "ENUM",
    allowedTypes: ["ENUM"],
    forcedMaxValues: 1,
    forcedConstraintKind: "ENUM",
    forcedCategory: true,
    forcedFilter: true,
    forcedSort: false,
    hideType: true,
    hideMaxValues: true,
    suggested: {
      primaryField: false,
      category: true,
      filter: true,
      sort: false,
      required: false,
      editPolicy: "RESTRICTED",
      constraintKind: "ENUM",
      constraintPayload: { kind: "ENUM", allowInactive: false, storeCode: true },
    },
  },
  IDENTITY: {
    forceNameFromConcept: true,
    forcedType: "TEXT",
    allowedTypes: ["TEXT"],
    forcedMaxValues: 1,
    forcedEditPolicy: "DERIVED",
    forcedPrimaryField: false,
    forcedRequired: false,
    forcedCategory: false,
    forcedFilter: false,
    forcedSort: false,
    hideType: true,
    hideMaxValues: true,
    hideEditPolicy: true,
    hidePrimaryField: true,
    hideRequired: true,
    suggested: {
      category: false,
      filter: false,
      sort: false,
      required: false,
      editPolicy: "DERIVED",
      constraintKind: "NONE",
      constraintPayload: { kind: "NONE" },
    },
  },
  DEPARTMENT: {
    forceNameFromConcept: true,
    allowedTypes: ["TEXT", "ENUM"],
    forcedCategory: true,
    forcedFilter: true,
    forcedSort: true,
    suggested: {
      type: "TEXT",
      maxValues: 1,
      primaryField: false,
      category: true,
      filter: true,
      sort: true,
      required: false,
      editPolicy: "FREE",
      constraintKind: "NONE",
      constraintPayload: { kind: "NONE" },
    },
  },
  PROMOTION: {
    forceNameFromConcept: true,
    allowedTypes: ["TEXT", "ENUM"],
    forcedCategory: true,
    forcedFilter: true,
    forcedSort: true,
    suggested: {
      type: "TEXT",
      maxValues: 1,
      primaryField: false,
      category: true,
      filter: true,
      sort: true,
      required: false,
      editPolicy: "FREE",
      constraintKind: "NONE",
      constraintPayload: { kind: "NONE" },
    },
  },
  ARRIVAL_DATE: {
    forceNameFromConcept: true,
    allowedTypes: ["DATE", "DATETIME"],
    forcedMaxValues: 1,
    forcedCategory: false,
    forcedFilter: true,
    forcedSort: true,
    hideMaxValues: true,
    suggested: {
      type: "DATE",
      primaryField: false,
      category: false,
      filter: true,
      sort: true,
      required: false,
      editPolicy: "FREE",
      constraintKind: "NONE",
      constraintPayload: { kind: "NONE" },
    },
  },
};

function getConceptCode(attribute?: Attribute): string | null {
  return attribute?.conceptCode ?? null;
}

function getConceptValueType(attribute?: Attribute): ConceptValueType | null {
  return attribute?.conceptValueType ?? null;
}

function isConceptDerived(attribute?: Attribute): boolean {
  return !!attribute?.conceptDerived;
}

function isIdentityComponentEligible(attribute?: Attribute): boolean {
  return !!attribute?.identityComponentEligible;
}

function getAllowedTypesFromConcept(concept: Concept | null | undefined): AttributeType[] {
  if (!concept) return [...ATTRIBUTE_TYPES];
  const preset = CONCEPT_PRESETS[concept.code];
  if (preset?.allowedTypes?.length) return [...preset.allowedTypes];
  return CONCEPT_TYPE_COMPATIBILITY[concept.valueType] ?? [...ATTRIBUTE_TYPES];
}

function makeDefaultValues(initial?: Attribute): AttributeCreateFormInput {
  if (initial) {
    return {
      name: initial.name ?? "",
      conceptId: initial.conceptId ?? null,
      type: initial.type ?? "TEXT",
      casingStrategy: initial.casingStrategy ?? "NONE",
      maxValues: initial.maxValues ?? 1,
      primaryField: !!initial.identitySource,
      category: !!initial.category,
      filter: !!initial.filter,
      sort: !!initial.sort,
      required: !!initial.required,
      editPolicy: initial.editPolicy ?? "FREE",
      constraintKind: initial.constraintKind ?? "NONE",
      constraintPayload:
        initial.constraintPayload ?? ({ kind: initial.constraintKind ?? "NONE" } as ConstraintPayload),
    };
  }

  return {
    name: "",
    conceptId: null,
    type: "TEXT",
    casingStrategy: "NONE",
    maxValues: 1,
    primaryField: false,
    category: false,
    filter: false,
    sort: false,
    required: false,
    editPolicy: "FREE",
    constraintKind: "NONE",
    constraintPayload: { kind: "NONE" },
  };
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        backgroundColor: "background.paper",
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

function getConceptIcon(code?: string | null): SvgIconComponent {
  switch (code) {
    case "FIRST_NAME":
      return PersonRoundedIcon;
    case "LAST_NAME":
      return BadgeRoundedIcon;
    case "NICKNAME":
      return FaceRoundedIcon;
    case "TITLE":
      return WorkspacePremiumRoundedIcon;
    case "GENDER":
      return WcRoundedIcon;
    case "IDENTITY":
      return FingerprintRoundedIcon;
    case "DEPARTMENT":
      return BusinessRoundedIcon;
    case "PROMOTION":
      return SchoolRoundedIcon;
    case "ARRIVAL_DATE":
      return EventRoundedIcon;
    default:
      return ExtensionRoundedIcon;
  }
}

type ConceptCardOption = Concept & {
  blocked: boolean;
  duplicateCount: number;
};

function ConceptPicker({
  options,
  value,
  onChange,
  getLabel,
  getDescription,
  initialConceptId,
}: {
  options: ConceptCardOption[];
  value: number | null;
  onChange: (next: number | null) => void;
  getLabel: (concept: Concept | null | undefined) => string;
  getDescription: (concept: Concept | null | undefined) => string | null;
  initialConceptId?: number | null;
}) {
  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
          gap: { xs: 1, sm: 1.25 },
        }}
      >
        {options.map((concept) => {
          const disabled = concept.blocked && concept.id !== initialConceptId;
          const selected = !disabled && value === concept.id;
          const Icon = getConceptIcon(concept.code);

          return (
            <Paper
              key={concept.id}
              component="button"
              type="button"
              onClick={() => !disabled && onChange(concept.id)}
              disabled={disabled}
              sx={(theme) => {
                const ring = alpha(theme.palette.primary.main, 0.65);
                const ringHalo = alpha(theme.palette.primary.main, 0.1);
                return {
                  ...(glassCard(theme) as object),
                  aspectRatio: "1 / 1",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.58 : 1,
                  filter: disabled ? "grayscale(0.22) saturate(0.8)" : "none",
                  ...(disabled && {
                    "&:hover": {
                      transform: "none",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.35)}, ${alpha(theme.palette.background.paper, 0.22)})`,
                    },
                  }),
                  ...(selected && {
                    borderColor: ring,
                    background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.35)})`,
                    boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(theme.palette.primary.main, 0.25)}`,
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      boxShadow: `0 0 0 8px ${ringHalo}`,
                      pointerEvents: "none",
                    },
                  }),
                };
              }}
            >
              <Stack
                spacing={1}
                sx={{
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1, sm: 1.25 },
                  textAlign: "center",
                }}
              >
                <Box
                  sx={(theme) => ({
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    backgroundColor: selected
                      ? alpha(theme.palette.primary.main, 0.16)
                      : alpha(theme.palette.text.primary, 0.06),
                    color: selected ? "primary.main" : "text.secondary",
                  })}
                >
                  <Icon fontSize="small" />
                </Box>

                <Typography
                  variant="caption"
                  fontWeight={700}
                  noWrap
                  sx={{
                    lineHeight: 1.2,
                    width: "100%",
                    fontSize: { xs: "0.72rem", sm: "0.8rem" },
                    letterSpacing: 0.1,
                  }}
                >
                  {getLabel(concept)}
                </Typography>

                {disabled && (
                  <Chip
                    size="small"
                    icon={<LockRoundedIcon sx={{ fontSize: "0.9rem !important" }} />}
                    label="Utilisé"
                    variant="outlined"
                    sx={{
                      mt: 0.25,
                      height: 20,
                      fontWeight: 600,
                      color: "text.secondary",
                      borderColor: (theme) => alpha(theme.palette.text.primary, 0.18),
                      backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.35),
                      "& .MuiChip-label": { px: 0.8, fontSize: "0.68rem", lineHeight: 1 },
                    }}
                  />
                )}
              </Stack>
            </Paper>
          );
        })}

        {/* Card "Attribut personnalisé" */}
        <Paper
          component="button"
          type="button"
          onClick={() => onChange(null)}
          sx={(theme) => {
            const ring = alpha(theme.palette.primary.main, 0.65);
            const ringHalo = alpha(theme.palette.primary.main, 0.1);
            const isSelected = value == null;
            return {
              ...(glassCard(theme) as object),
              aspectRatio: "1 / 1",
              cursor: "pointer",
              ...(isSelected && {
                borderColor: ring,
                background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.35)})`,
                boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(theme.palette.primary.main, 0.25)}`,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  boxShadow: `0 0 0 8px ${ringHalo}`,
                  pointerEvents: "none",
                },
              }),
            };
          }}
        >
          <Stack
            spacing={1}
            sx={{
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 1, sm: 1.25 },
              textAlign: "center",
            }}
          >
            <Box
              sx={(theme) => ({
                width: { xs: 30, sm: 34 },
                height: { xs: 30, sm: 34 },
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                backgroundColor:
                  value == null
                    ? alpha(theme.palette.primary.main, 0.16)
                    : alpha(theme.palette.text.primary, 0.06),
                color: value == null ? "primary.main" : "text.secondary",
              })}
            >
              <ExtensionRoundedIcon fontSize="small" />
            </Box>

            <Typography
              variant="caption"
              fontWeight={700}
              noWrap
              sx={{
                lineHeight: 1.2,
                width: "100%",
                fontSize: { xs: "0.72rem", sm: "0.8rem" },
                letterSpacing: 0.1,
              }}
            >
              Attribut personnalisé
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.1, fontSize: "0.68rem" }}
            >
              Hors concepts standards
            </Typography>
          </Stack>
        </Paper>
      </Box>

      {value != null && (
        <FormHelperText sx={{ mx: 0 }}>
          {getDescription(options.find((x) => x.id === value) ?? null) ??
            "Ce concept aide l’app à proposer une configuration cohérente."}
        </FormHelperText>
      )}
      {value == null && (
        <FormHelperText sx={{ mx: 0 }}>
          À utiliser seulement si cet attribut ne correspond à aucun concept standard.
        </FormHelperText>
      )}
    </Stack>
  );
}

export default function AttributeFormDrawer({
  open,
  initial,
  onClose,
  conceptOptions,
  allAttributes,
}: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial?.id);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [appliedSuggestionMessage, setAppliedSuggestionMessage] = useState<string | null>(null);

  const hasUserEditedNameRef = useRef(false);

  const {
    register,
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
    setShowAdvanced(false);
    setShowConstraints(false);
    hasUserEditedNameRef.current = false;
  }, [open, initial, reset]);

  const watchedConceptId = watch("conceptId");
  const watchedType = watch("type");
  const watchedConstraintKind = watch("constraintKind");
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
      return;
    }

    const preset = CONCEPT_PRESETS[selectedConcept.code];
    const conceptLabel = getConceptLabel(selectedConcept);
    const updates: string[] = [];

    if (!preset) {
      if (!hasUserEditedNameRef.current && !getValues("name")) {
        setValue("name", conceptLabel, { shouldDirty: true });
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
      }

      return;
    }

    const shouldForceConceptName = preset.forceNameFromConcept;
    const currentName = getValues("name");

    if (
      shouldForceConceptName &&
      (!hasUserEditedNameRef.current || !currentName || currentName === preset.suggestedName)
    ) {
      setValue("name", conceptLabel, { shouldDirty: true });
      updates.push(`nom → ${conceptLabel}`);
    } else if (!hasUserEditedNameRef.current && !currentName) {
      setValue("name", conceptLabel, { shouldDirty: true });
      updates.push(`nom → ${conceptLabel}`);
    }

    if (preset.forcedType) {
      setValue("type", preset.forcedType, { shouldDirty: true });
      updates.push(`type → ${preset.forcedType}`);
    } else if (!allowedTypes.includes(getValues("type"))) {
      const fallback = allowedTypes[0] ?? "TEXT";
      setValue("type", fallback, { shouldDirty: true });
      updates.push(`type → ${fallback}`);
    } else if (preset.suggested.type && !getValues("type")) {
      setValue("type", preset.suggested.type, { shouldDirty: true });
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
    } else if (preset.suggested.constraintKind) {
      setValue("constraintKind", preset.suggested.constraintKind, { shouldDirty: true });
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
    }

    setAppliedSuggestionMessage(
      updates.length > 0
        ? t("ATTRIBUTE_FORM.AUTO_CONFIG_APPLIED", {
            changes: updates.join(" · "),
            defaultValue: `Préconfiguration appliquée : ${updates.join(" · ")}`,
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

  const isTypeLocked = isEdit || !!selectedPreset?.hideType || !!duplicateSystemConceptBlocked;
  const isMaxValuesLocked = !!selectedPreset?.hideMaxValues;
  const isEditPolicyLocked = !!selectedPreset?.hideEditPolicy || !!selectedConceptDerived;
  const isPrimaryLocked = !!selectedPreset?.hidePrimaryField || !selectedIdentityEligible;
  const isRequiredLocked = !!selectedPreset?.hideRequired || selectedPreset?.forcedRequired != null;

  const showTypeField = !selectedPreset?.hideType || !selectedConcept;
  const showMaxValuesField = !selectedPreset?.hideMaxValues || !selectedConcept;
  const showPrimaryField = !selectedPreset?.hidePrimaryField;
  const showEditPolicyField = !selectedPreset?.hideEditPolicy || !selectedConcept;
  const showRequiredField = !selectedPreset?.hideRequired;

  const summaryChips = [
    selectedConcept
      ? {
          label: getConceptLabel(selectedConcept),
          color: "primary" as const,
        }
      : null,
    selectedConceptValueType
      ? {
          label: t("ATTRIBUTE_FORM.CANONICAL_TYPE", {
            value: selectedConceptValueType,
            defaultValue: `Canonique ${selectedConceptValueType}`,
          }),
          color: "default" as const,
        }
      : null,
    selectedConceptDerived
      ? {
          label: t("ATTRIBUTE_FORM.DERIVED", {
            defaultValue: "Dérivé",
          }),
          color: "warning" as const,
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

  const behaviorSummaryItems = useMemo(() => {
    const items: string[] = [];
    const values = getValues();

    if (values.category) items.push("Catégorie");
    if (values.filter) items.push("Filtrable");
    if (values.sort) items.push("Triable");
    if (values.required) items.push("Requis");

    return items;
  }, [getValues, watchedConceptId, selectedPreset]);

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
        isPrimaryLocked && !selectedIdentityEligible
          ? false
          : selectedPreset?.forcedPrimaryField ?? data.primaryField;

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
      <DialogTitle sx={{ pb: 1.5, flexShrink: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isEdit
                ? t("ATTRIBUTE_FORM.TITLE_EDIT", { defaultValue: "Modifier l’attribut" })
                : t("ATTRIBUTE_FORM.TITLE_CREATE", { defaultValue: "Créer un attribut" })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit
                ? t("ATTRIBUTE_FORM.SUBTITLE_EDIT", {
                    defaultValue: "Ajuste cet attribut sans exposer toute la complexité technique.",
                  })
                : t("ATTRIBUTE_FORM.SUBTITLE_CREATE", {
                    defaultValue:
                      "Choisis ce que représente cet attribut. Le reste sera préconfiguré automatiquement.",
                  })}
            </Typography>
          </Box>

          {summaryChips.length > 0 && (
            <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
              {summaryChips.map((chip) => (
                <Chip key={chip.label} size="small" label={chip.label} color={chip.color} />
              ))}
            </Stack>
          )}
        </Stack>
      </DialogTitle>

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
        {!isEdit && (
          <Alert severity="info" icon={<PsychologyAltRoundedIcon />} sx={{ borderRadius: 2.5, mb: 2 }}>
            <AlertTitle>
              {t("ATTRIBUTE_FORM.SIMPLEST_TITLE", {
                defaultValue: "Le plus simple",
              })}
            </AlertTitle>
            {t("ATTRIBUTE_FORM.SIMPLEST_TEXT", {
              defaultValue:
                "Commence par choisir un concept. Le formulaire proposera ensuite une configuration cohérente automatiquement.",
            })}
          </Alert>
        )}

        {appliedSuggestionMessage && (
          <Alert
            severity="success"
            icon={<AutoAwesomeRoundedIcon />}
            sx={{ borderRadius: 2.5, mb: 2 }}
          >
            {appliedSuggestionMessage}
          </Alert>
        )}

        {duplicateSystemConceptBlocked && (
          <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>
            <AlertTitle>
              {t("ATTRIBUTE_FORM.DUPLICATE_SYSTEM_CONCEPT_TITLE", {
                defaultValue: "Concept système déjà utilisé",
              })}
            </AlertTitle>
            {t("ATTRIBUTE_FORM.DUPLICATE_SYSTEM_CONCEPT_TEXT", {
              defaultValue: "Ce concept est censé être unique dans le tenant.",
            })}
          </Alert>
        )}

        {conceptTypeMismatch && (
          <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>
            <AlertTitle>
              {t("ATTRIBUTE_FORM.TYPE_MISMATCH_TITLE", {
                defaultValue: "Type incompatible",
              })}
            </AlertTitle>
            {t("ATTRIBUTE_FORM.TYPE_MISMATCH_TEXT", {
              defaultValue: "Le type choisi n'est pas compatible avec le concept sélectionné.",
            })}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <FormSection
            title={t("ATTRIBUTE_FORM.SECTION_SEMANTICS_TITLE", {
              defaultValue: "Sens métier",
            })}
            subtitle={t("ATTRIBUTE_FORM.SECTION_SEMANTICS_SUBTITLE", {
              defaultValue: "Choisis d’abord ce que représente cet attribut.",
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
                    initialConceptId={initial?.conceptId ?? null}
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
                            defaultValue: "Nom visible dans l’admin et les écrans métier.",
                          }))
                    }
                  />
                )}
              />
            </Stack>
          </FormSection>

          <FormSection
            title={t("ATTRIBUTE_FORM.SECTION_USAGE_TITLE", {
              defaultValue: "Utilisation",
            })}
            subtitle={t("ATTRIBUTE_FORM.SECTION_USAGE_SUBTITLE", {
              defaultValue: "Seulement les choix vraiment utiles pour l’usage métier.",
            })}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
                {behaviorSummaryItems.length > 0 ? (
                  behaviorSummaryItems.map((item) => (
                    <Chip
                      key={item}
                      size="small"
                      icon={<CheckCircleRoundedIcon />}
                      label={item}
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Chip size="small" label="Comportement standard" variant="outlined" />
                )}
              </Stack>

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
                          defaultValue: "Requis pour chaque personne",
                        })}
                      />
                    )}
                  />
                  <FormHelperText sx={{ mt: 0 }}>
                    {selectedConceptCode === "GENDER"
                      ? "Conseillé pour améliorer la qualité des quiz et des filtres."
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

              {!selectedIdentityEligible && !!selectedConcept && (
                <FormHelperText sx={{ mt: 0 }}>
                  {t("ATTRIBUTE_FORM.IDENTITY_NOT_ELIGIBLE", {
                    defaultValue: "Ce concept n’est pas éligible comme composant d’identité.",
                  })}
                </FormHelperText>
              )}
            </Stack>
          </FormSection>

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: "background.paper",
            }}
          >
            <Button
              fullWidth
              onClick={() => setShowAdvanced((v) => !v)}
              sx={{
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                color: "text.primary",
                textTransform: "none",
                borderRadius: 0,
              }}
              endIcon={showAdvanced ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t("ATTRIBUTE_FORM.ADVANCED_TITLE", {
                    defaultValue: "Options avancées",
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("ATTRIBUTE_FORM.ADVANCED_SUBTITLE", {
                    defaultValue:
                      "Ouvre cette partie seulement si tu dois ajuster la structure ou les règles internes.",
                  })}
                </Typography>
              </Box>
            </Button>

            <Collapse in={showAdvanced}>
              <Divider />

              <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "grid", gap: 2 }}>
                {(showTypeField || showMaxValuesField) && (
                  <FormSection
                    title={t("ATTRIBUTE_FORM.SECTION_STRUCTURE_TITLE", {
                      defaultValue: "Structure",
                    })}
                    subtitle={t("ATTRIBUTE_FORM.SECTION_STRUCTURE_SUBTITLE", {
                      defaultValue: "Format de la donnée et cardinalité.",
                    })}
                  >
                    <Stack spacing={2}>
                      {showTypeField && (
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              select
                              label={t("ATTRIBUTE_FORM.TYPE_LABEL", {
                                defaultValue: "Type",
                              })}
                              {...field}
                              fullWidth
                              disabled={isTypeLocked}
                              helperText={
                                isEdit
                                  ? t("ATTRIBUTE_FORM.TYPE_HELP_EDIT", {
                                      defaultValue: "Le type n’est pas modifiable en édition.",
                                    })
                                  : selectedConcept
                                    ? t("ATTRIBUTE_FORM.TYPE_HELP_CONCEPT", {
                                        types: allowedTypes.join(", "),
                                        defaultValue: `Types autorisés : ${allowedTypes.join(", ")}`,
                                      })
                                    : t("ATTRIBUTE_FORM.TYPE_HELP_DEFAULT", {
                                        defaultValue: "Choisis le format de donnée le plus naturel.",
                                      })
                              }
                            >
                              {allowedTypes.map((type) => (
                                <Box key={type} component="option" value={type}>
                                  {type}
                                </Box>
                              ))}
                            </TextField>
                          )}
                        />
                      )}

                      {showMaxValuesField && (
                        <TextField
                          type="number"
                          label={t("ATTRIBUTE_FORM.MAX_VALUES_LABEL", {
                            defaultValue: "Nombre max de valeurs (0 = illimité)",
                          })}
                          fullWidth
                          {...register("maxValues", {
                            setValueAs: (value) => (value === "" ? 1 : Number(value)),
                          })}
                          disabled={isMaxValuesLocked}
                          error={!!errors.maxValues}
                          helperText={
                            errors.maxValues?.message ||
                            (isMaxValuesLocked
                              ? t("ATTRIBUTE_FORM.MAX_VALUES_HELP_LOCKED", {
                                  defaultValue: "Le concept impose cette cardinalité.",
                                })
                              : t("ATTRIBUTE_FORM.MAX_VALUES_HELP_DEFAULT", {
                                  defaultValue: "Dans la plupart des cas, 1 suffit.",
                                }))
                          }
                        />
                      )}
                    </Stack>
                  </FormSection>
                )}

                <FormSection
                  title={t("ATTRIBUTE_FORM.SECTION_BEHAVIOR_TITLE", {
                    defaultValue: "Comportement interne",
                  })}
                  subtitle={t("ATTRIBUTE_FORM.SECTION_BEHAVIOR_SUBTITLE", {
                    defaultValue:
                      "Réglages utiles seulement pour des cas particuliers ou des besoins avancés.",
                  })}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
                      {showPrimaryField && (
                        <Controller
                          name="primaryField"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!!field.value}
                                  onChange={(_, checked) => field.onChange(checked)}
                                  disabled={isPrimaryLocked}
                                />
                              }
                              label={t("ATTRIBUTE_FORM.PRIMARY_FIELD_LABEL", {
                                defaultValue: "Source d’identité",
                              })}
                            />
                          )}
                        />
                      )}
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                      <Controller
                        name="casingStrategy"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            select
                            label={t("ATTRIBUTE_FORM.CASING_LABEL", {
                              defaultValue: "Casing",
                            })}
                            {...field}
                            fullWidth
                            helperText={t("ATTRIBUTE_FORM.CASING_HELP", {
                              defaultValue: "Normalisation visuelle du texte.",
                            })}
                          >
                            {CASING_STRATEGIES.map((strategy) => (
                              <Box key={strategy} component="option" value={strategy}>
                                {strategy}
                              </Box>
                            ))}
                          </TextField>
                        )}
                      />

                      {showEditPolicyField && (
                        <Controller
                          name="editPolicy"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              select
                              label={t("ATTRIBUTE_FORM.EDIT_POLICY_LABEL", {
                                defaultValue: "Règle d’édition",
                              })}
                              {...field}
                              fullWidth
                              disabled={isEditPolicyLocked}
                              helperText={
                                isEditPolicyLocked
                                  ? t("ATTRIBUTE_FORM.EDIT_POLICY_HELP_LOCKED", {
                                      defaultValue: "Le concept impose cette règle.",
                                    })
                                  : t("ATTRIBUTE_FORM.EDIT_POLICY_HELP_DEFAULT", {
                                      defaultValue:
                                        "FREE pour un champ libre, RESTRICTED ou DERIVED pour un champ plus gouverné.",
                                    })
                              }
                            >
                              {EDIT_POLICIES.map((policy) => (
                                <Box key={policy} component="option" value={policy}>
                                  {policy}
                                </Box>
                              ))}
                            </TextField>
                          )}
                        />
                      )}
                    </Stack>

                    {selectedConceptDerived && (
                      <Alert
                        severity="info"
                        icon={<TipsAndUpdatesOutlinedIcon />}
                        sx={{ borderRadius: 2.5 }}
                      >
                        {t("ATTRIBUTE_FORM.DERIVED_INFO", {
                          defaultValue:
                            "Cet attribut correspond à une donnée dérivée. Une logique calculée ou restreinte est préférable.",
                        })}
                      </Alert>
                    )}

                    {isEdit && (
                      <Alert
                        severity="warning"
                        icon={<WarningAmberRoundedIcon />}
                        sx={{ borderRadius: 2.5 }}
                      >
                        {t("ATTRIBUTE_FORM.EDIT_WARNING", {
                          defaultValue:
                            "Si cet attribut est déjà utilisé dans des facts, évite de modifier sa structure sans garde-fous backend.",
                        })}
                      </Alert>
                    )}
                  </Stack>
                </FormSection>

                <FormSection
                  title={t("ATTRIBUTE_FORM.SECTION_CONSTRAINTS_TITLE", {
                    defaultValue: "Contraintes avancées",
                  })}
                  subtitle={t("ATTRIBUTE_FORM.SECTION_CONSTRAINTS_SUBTITLE", {
                    defaultValue:
                      "Ouvre cette partie seulement si tu dois restreindre fortement les valeurs autorisées.",
                  })}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {watchedConstraintKind && watchedConstraintKind !== "NONE"
                          ? t("ATTRIBUTE_FORM.CONSTRAINT_ACTIVE", {
                              kind: watchedConstraintKind,
                              defaultValue: `Contrainte active : ${watchedConstraintKind}`,
                            })
                          : t("ATTRIBUTE_FORM.CONSTRAINT_NONE", {
                              defaultValue: "Aucune contrainte avancée active",
                            })}
                      </Typography>

                      <Button
                        size="small"
                        variant={showConstraints ? "outlined" : "text"}
                        onClick={() => setShowConstraints((v) => !v)}
                      >
                        {showConstraints
                          ? t("ATTRIBUTE_FORM.HIDE", { defaultValue: "Masquer" })
                          : t("ATTRIBUTE_FORM.CONFIGURE", { defaultValue: "Configurer" })}
                      </Button>
                    </Stack>

                    <Collapse in={showConstraints}>
                      <Box sx={{ pt: 0.5 }}>
                        <ConstraintEditor control={control} watch={watch} errors={errors} setValue={setValue} />
                      </Box>
                    </Collapse>
                  </Stack>
                </FormSection>
              </Box>
            </Collapse>
          </Paper>
        </Box>
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
