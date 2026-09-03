import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import {
  Alert,
  AlertTitle,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import AttributeFormDrawer from "./components/AttributeFormDrawer";
import AttributeList from "./components/AttributeList";
import IdentityMembersCard from "./components/IdentityMembersCard";
import {
  buildIdentityReorderSwap,
  excludeSystemIdentity,
  isIdentitySourceAttribute,
  sortByDisplayOrder,
} from "./components/identity.utils";

import {
  getAdminAttributes,
  reorderAdminAttributes,
} from "../../../services/business/admin/admin.attributes.service";

import { Attribute, ValueType } from "../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../models/commons/Concept/Concept";

import { useTenantData } from "../../../contexts/TenantDataContext";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";

type AttributeIssueTag =
  | "useless"
  | "concept-type-mismatch"
  | "identity-source-not-eligible"
  | "enum-without-options";

export type AttributeIssueInfo = {
  tags: AttributeIssueTag[];
  messages: string[];
  severity: "warning" | "error";
};

type HealthDiagnostic = {
  tag: AttributeIssueTag;
  severity: "warning" | "error";
  attributeId?: number;
  attributeName?: string;
  message: string;
};

type ListViewMode = "all" | "essential" | "custom" | "needsAttention";

const RECOMMENDED_BOOTSTRAP_CONCEPT_CODES = ["FIRST_NAME", "LAST_NAME", "GENDER"];

const ESSENTIAL_CONCEPT_CODES = new Set([
  ...RECOMMENDED_BOOTSTRAP_CONCEPT_CODES,
  "IDENTITY",
]);

function getAttrId(a: Attribute): number {
  return a.id;
}

function getAttrName(a: Attribute): string {
  return (a as any)?.name ?? "";
}

function getDisplayOrder(a: Attribute): number {
  return (a as any)?.displayOrder ?? 0;
}

function getConceptCode(a: Attribute): string | null {
  return (a as any)?.conceptCode ?? null;
}

function getConceptId(a: Attribute): number | null {
  return (a as any)?.conceptId ?? null;
}

function isIdentityComponentEligible(a: Attribute): boolean {
  return !!(a as any)?.identityComponentEligible;
}

function getValueType(a: Attribute): ValueType | null {
  return ((a as any)?.type as ValueType | null) ?? null;
}

function isFilterable(a: Attribute): boolean {
  return !!(a as any)?.filter;
}

function isSortable(a: Attribute): boolean {
  return !!(a as any)?.sort;
}

function isIdentitySource(a: Attribute): boolean {
  return !!(a as any)?.identitySource;
}

function isValidIdentitySourceConfiguration(a: Attribute): boolean {
  if (getConceptCode(a) === "IDENTITY") return false;
  const conceptAllowsIdentity = getConceptId(a) == null || isIdentityComponentEligible(a);
  return conceptAllowsIdentity && getValueType(a) === "TEXT" && a.maxValues === 1;
}

function getOptionsCount(a: Attribute): number {
  return Array.isArray((a as any)?.options) ? (a as any).options.length : 0;
}

function getConceptValueType(
  attribute: Attribute,
  conceptsById: Map<number, Concept>,
  conceptsByCode: Map<string, Concept>,
): ValueType | null {
  const conceptId = getConceptId(attribute);
  if (conceptId != null) {
    return conceptsById.get(conceptId)?.valueType ?? null;
  }

  const conceptCode = getConceptCode(attribute);
  if (conceptCode) {
    return conceptsByCode.get(conceptCode)?.valueType ?? null;
  }

  return null;
}

function isValueTypeCompatibleWithConcept(
  attribute: Attribute,
  conceptsById: Map<number, Concept>,
  conceptsByCode: Map<string, Concept>,
): boolean {
  const attributeType = getValueType(attribute);
  const conceptValueType = getConceptValueType(attribute, conceptsById, conceptsByCode);

  if (!conceptValueType || !attributeType) {
    return true;
  }

  return attributeType === conceptValueType;
}

export default function AdminAttributesPage() {
  const { t } = useTranslation();
  const { attributes: globalAttributes, concepts } = useTenantData();

  const conceptsById = useMemo(() => {
    const map = new Map<number, Concept>();
    for (const concept of concepts ?? []) {
      map.set(concept.id, concept);
    }
    return map;
  }, [concepts]);

  const conceptsByCode = useMemo(() => {
    const map = new Map<string, Concept>();
    for (const concept of concepts ?? []) {
      map.set(concept.code, concept);
    }
    return map;
  }, [concepts]);

  const getConceptLabel = useCallback(
    (conceptCode: string) =>
      t(`CONCEPTS.${conceptCode}.LABEL`, {
        defaultValue: conceptCode,
      }),
    [t]
  );

  const buildIssueMessage = useCallback(
    (tag: AttributeIssueTag, a: Attribute): string => {
      const name = getAttrName(a);
      const conceptCode = getConceptCode(a);
      const attributeType = getValueType(a);
      const conceptValueType = getConceptValueType(a, conceptsById, conceptsByCode);
      const conceptLabel = conceptCode ? getConceptLabel(conceptCode) : "?";

      switch (tag) {
        case "useless":
          return t("ATTRIBUTE_HEALTH_MESSAGES.useless", {
            name,
            defaultValue: `Le champ "${name}" semble peu exploité actuellement.`,
          });

        case "concept-type-mismatch":
          return t("ATTRIBUTE_HEALTH_MESSAGES.concept-type-mismatch", {
            name,
            type: attributeType ?? "?",
            concept: conceptLabel,
            conceptValueType: conceptValueType ?? "?",
            defaultValue: `Le champ "${name}" a un type "${attributeType ?? "?"}" incohérent avec le concept "${conceptLabel}" (${conceptValueType ?? "?"}).`,
          });

        case "identity-source-not-eligible":
          return t("ATTRIBUTE_HEALTH_MESSAGES.identity-source-not-eligible", {
            name,
            defaultValue: `Le champ "${name}" n’est pas un texte à valeur unique éligible comme source d’identité.`,
          });

        case "enum-without-options":
          return t("ATTRIBUTE_HEALTH_MESSAGES.enum-without-options", {
            name,
            defaultValue: `Le champ liste "${name}" ne possède aucune option active.`,
          });

        default:
          return t("ATTRIBUTE_HEALTH_MESSAGES.default", {
            name,
            defaultValue: `Problème détecté sur "${name}".`,
          });
      }
    },
    [conceptsByCode, conceptsById, getConceptLabel, t]
  );

  const getSetupStepLabel = useCallback(
    (conceptCode: string) => getConceptLabel(conceptCode),
    [getConceptLabel]
  );

  const [attributes, setAttributes] = useState<Attribute[]>(globalAttributes ?? []);
  const [viewMode, setViewMode] = useState<ListViewMode>("all");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [loadingA, setLoadingA] = useState(false);

  useEffect(() => {
    setAttributes(globalAttributes ?? []);
  }, [globalAttributes]);

  const hardRefreshAttributes = useCallback(async () => {
    try {
      setLoadingA(true);
      const fresh = await getAdminAttributes();
      setAttributes(fresh ?? []);
    } catch (e: any) {
      notifyError(
        e?.message ||
          t("ATTRIBUTE_PAGE.REFRESH_ERROR", {
            defaultValue: "Erreur lors de l’actualisation des champs",
          })
      );
    } finally {
      setLoadingA(false);
    }
  }, [t]);

  // IDENTITY is a system-managed derived field: it is never shown as a
  // normal row, in the list or in its health diagnostics.
  const visibleAttributes = useMemo(
    () => excludeSystemIdentity(attributes ?? []),
    [attributes],
  );

  const identitySources = useMemo(
    () => sortByDisplayOrder(visibleAttributes.filter(isIdentitySourceAttribute)),
    [visibleAttributes],
  );

  const diagnostics = useMemo(() => {
    const rows = visibleAttributes;
    const items: HealthDiagnostic[] = [];

    for (const a of rows) {
      const id = getAttrId(a);
      const name = getAttrName(a);

      const isUseful = isFilterable(a) || isSortable(a) || isIdentitySource(a);
      if (!isUseful) {
        items.push({
          tag: "useless",
          severity: "warning",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("useless", a),
        });
      }

      if (!isValueTypeCompatibleWithConcept(a, conceptsById, conceptsByCode)) {
        items.push({
          tag: "concept-type-mismatch",
          severity: "error",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("concept-type-mismatch", a),
        });
      }

      if (isIdentitySource(a) && !isValidIdentitySourceConfiguration(a)) {
        items.push({
          tag: "identity-source-not-eligible",
          severity: "error",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("identity-source-not-eligible", a),
        });
      }

      if (getValueType(a) === "ENUM" && getOptionsCount(a) === 0) {
        items.push({
          tag: "enum-without-options",
          severity: "warning",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("enum-without-options", a),
        });
      }
    }

    return items;
  }, [visibleAttributes, buildIssueMessage, conceptsByCode, conceptsById]);

  const issuesByAttributeId = useMemo(() => {
    const map = new Map<number, AttributeIssueInfo>();

    for (const diag of diagnostics) {
      if (diag.attributeId == null) continue;

      const prev = map.get(diag.attributeId);
      if (prev) {
        if (!prev.tags.includes(diag.tag)) {
          prev.tags.push(diag.tag);
          prev.messages.push(diag.message);
        }
        if (diag.severity === "error") prev.severity = "error";
      } else {
        map.set(diag.attributeId, {
          tags: [diag.tag],
          messages: [diag.message],
          severity: diag.severity,
        });
      }
    }

    return map;
  }, [diagnostics]);

  const health = useMemo(() => {
    const rows = visibleAttributes;
    const warnings = diagnostics.filter((d) => d.severity === "warning");
    const errors = diagnostics.filter((d) => d.severity === "error");

    const byTagCount = diagnostics.reduce<Record<string, number>>((acc, d) => {
      acc[d.tag] = (acc[d.tag] ?? 0) + 1;
      return acc;
    }, {});

    const presentConceptCodes = new Set(
      rows.map((a) => getConceptCode(a)).filter(Boolean) as string[]
    );

    const missingRecommendedConcepts = RECOMMENDED_BOOTSTRAP_CONCEPT_CODES.filter(
      (code) => !presentConceptCodes.has(code)
    );

    return {
      total: rows.length,
      warningsCount: warnings.length,
      errorsCount: errors.length,
      byTagCount,
      missingRecommendedConcepts,
      hasIssues: warnings.length > 0 || errors.length > 0,
    };
  }, [visibleAttributes, diagnostics]);

  const topIssuesSummary = useMemo(() => {
    if (health.errorsCount > 0) {
      if ((health.byTagCount["concept-type-mismatch"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.concept-type-mismatch", {
          defaultValue: "Certains champs ont un type incompatible avec leur concept.",
        });
      }
      if ((health.byTagCount["identity-source-not-eligible"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.identity-source-not-eligible", {
          defaultValue: "Certaines sources d’identité ne sont pas cohérentes avec leur concept.",
        });
      }
      return t("ATTRIBUTE_PAGE.TOP_ISSUES.default-error", {
        defaultValue: "Des champs doivent être corrigés pour garantir un schéma cohérent.",
      });
    }

    if (health.warningsCount > 0) {
      if ((health.byTagCount["enum-without-options"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.enum-without-options", {
          defaultValue: "Certaines listes n’ont pas encore d’options configurées.",
        });
      }
      return t("ATTRIBUTE_PAGE.TOP_ISSUES.default-warning", {
        defaultValue: "Quelques améliorations sont recommandées pour finaliser la configuration.",
      });
    }

    return null;
  }, [health, t]);

  const filteredAttributes = useMemo(() => {
    return visibleAttributes
      .filter((a) => {
        if (viewMode === "all") return true;

        if (viewMode === "needsAttention") {
          const id = getAttrId(a);
          return id != null && issuesByAttributeId.has(id);
        }

        if (viewMode === "essential") {
          const code = getConceptCode(a);
          return !!code && ESSENTIAL_CONCEPT_CODES.has(code);
        }

        if (viewMode === "custom") {
          const code = getConceptCode(a);
          return !code || !ESSENTIAL_CONCEPT_CODES.has(code);
        }

        return true;
      })
      .sort((x, y) => {
        const dx = getDisplayOrder(x);
        const dy = getDisplayOrder(y);
        if (dx !== dy) return dx - dy;
        return getAttrName(x).localeCompare(getAttrName(y));
      });
  }, [visibleAttributes, issuesByAttributeId, viewMode]);

  const totalA = filteredAttributes.length;
  const pageStart = page * pageSize;
  const pageEnd = pageStart + pageSize;
  const pageRows = filteredAttributes.slice(pageStart, pageEnd);

  const onReorder = async (rowsOfCurrentPage: Attribute[]) => {
    const offset = page * pageSize;
    const items = rowsOfCurrentPage.map((r, i) => ({
      id: getAttrId(r),
      displayOrder: (offset + i + 1) * 10,
    }));

    try {
      await reorderAdminAttributes(items);

      setAttributes((prev) => {
        const map = new Map(prev.map((a) => [getAttrId(a), { ...a }]));

        for (const it of items) {
          const found = map.get(it.id);
          if (found) (found as any).displayOrder = it.displayOrder;
        }

        return [...map.values()].sort((x, y) => getDisplayOrder(x) - getDisplayOrder(y));
      });

      notifySuccess(t("ATTRIBUTE_PAGE.REORDER_SUCCESS", { defaultValue: "Ordre mis à jour" }));
    } catch (e: any) {
      notifyError(
        e?.message ||
          t("ATTRIBUTE_PAGE.REORDER_ERROR", { defaultValue: "Erreur de réordonnancement" })
      );
      await hardRefreshAttributes();
    }
  };

  const [drawerA, setDrawerA] = useState<{
    open: boolean;
    initial?: Attribute | null;
    presetIdentitySource?: boolean;
  }>({
    open: false,
  });

  const openAttributeEditor = useCallback((attribute: Attribute) => {
    setDrawerA({ open: true, initial: attribute });
  }, []);

  const openCreateIdentitySource = useCallback(() => {
    setDrawerA({ open: true, initial: null, presetIdentitySource: true });
  }, []);

  const onCloseAttributeDrawer = async (changed?: boolean) => {
    setDrawerA({ open: false });
    if (changed) {
      await hardRefreshAttributes();
      notifySuccess(t("ATTRIBUTE_PAGE.SAVED_SUCCESS", { defaultValue: "Champ enregistré" }));
    }
  };

  const handleMoveIdentitySource = useCallback(
    async (attributeId: number, direction: "up" | "down") => {
      const index = identitySources.findIndex((a) => getAttrId(a) === attributeId);
      const swap = buildIdentityReorderSwap(identitySources, index, direction);
      if (!swap) return;

      try {
        await reorderAdminAttributes(swap);

        setAttributes((prev) => {
          const map = new Map(prev.map((a) => [getAttrId(a), { ...a }]));
          for (const item of swap) {
            const found = map.get(item.id);
            if (found) found.displayOrder = item.displayOrder;
          }
          return [...map.values()];
        });

        notifySuccess(t("ATTRIBUTE_PAGE.REORDER_SUCCESS", { defaultValue: "Ordre mis à jour" }));
      } catch (e: any) {
        notifyError(
          e?.message ||
            t("ATTRIBUTE_PAGE.REORDER_ERROR", { defaultValue: "Erreur de réordonnancement" })
        );
        await hardRefreshAttributes();
      }
    },
    [identitySources, hardRefreshAttributes, t]
  );

  const essentialSetupProgress = RECOMMENDED_BOOTSTRAP_CONCEPT_CODES.map((conceptCode) => {
    const exists = visibleAttributes.some((a) => getConceptCode(a) === conceptCode);
    return {
      conceptCode,
      exists,
      label: getSetupStepLabel(conceptCode),
    };
  });

  const completedEssentialCount = essentialSetupProgress.filter((step) => step.exists).length;
  const essentialProgressPercent =
    essentialSetupProgress.length === 0
      ? 0
      : (completedEssentialCount / essentialSetupProgress.length) * 100;

  const nextRecommendedConceptCode = health.missingRecommendedConcepts[0] ?? null;
  const nextRecommendedConceptLabel = nextRecommendedConceptCode
    ? getSetupStepLabel(nextRecommendedConceptCode)
    : null;

  const isSetupComplete = essentialSetupProgress.every((step) => step.exists);

  const viewChips: Array<{ value: ListViewMode; labelKey: string; defaultLabel: string }> = [
    { value: "all", labelKey: "ATTRIBUTE_PAGE.VIEWS.ALL", defaultLabel: "Tous" },
    { value: "essential", labelKey: "ATTRIBUTE_PAGE.VIEWS.ESSENTIAL", defaultLabel: "Essentiels" },
    { value: "custom", labelKey: "ATTRIBUTE_PAGE.VIEWS.CUSTOM", defaultLabel: "Personnalisés" },
    {
      value: "needsAttention",
      labelKey: "ATTRIBUTE_PAGE.VIEWS.NEEDS_ATTENTION",
      defaultLabel: "À corriger",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        gap: { xs: 1.5, sm: 2 },
        overflow: "visible",
        width: "100%",
        maxWidth: 1120,
        mx: "auto",
        px: { xs: 1.5, sm: 2, md: 3 },
        pb: { xs: 2, sm: 3 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={{ xs: 1.25, md: 2 }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {t("ATTRIBUTE_PAGE.TITLE", { defaultValue: "Champs" })}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.25, maxWidth: 720 }}
          >
            {t("ATTRIBUTE_PAGE.SUBTITLE", {
              defaultValue:
                "Définissez les informations utiles pour identifier et organiser les membres du groupe.",
            })}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{
            width: { xs: "100%", md: "auto" },
            justifyContent: { xs: "stretch", md: "flex-end" },
            "& > *": {
              flex: { xs: 1, sm: "0 0 auto" },
            },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={hardRefreshAttributes}
            sx={{ whiteSpace: "nowrap" }}
          >
            {t("ATTRIBUTE_PAGE.REFRESH", { defaultValue: "Actualiser" })}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDrawerA({ open: true, initial: null })}
            sx={{ whiteSpace: "nowrap" }}
          >
            {t("ATTRIBUTE_PAGE.ADD_ATTRIBUTE", { defaultValue: "Ajouter un champ" })}
          </Button>
        </Stack>
      </Stack>

      {!isSetupComplete && (
        <Card variant="outlined" sx={{ overflow: "visible" }}>
          <CardContent
            sx={{
              pt: 2.25,
              pb: 3,
              px: { xs: 2, sm: 3 },
              overflow: "visible",
            }}
          >
            <Stack spacing={2.25} sx={{ overflow: "visible" }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("ATTRIBUTE_PAGE.SETUP.TITLE", {
                    defaultValue: "Commencer par les champs essentiels",
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("ATTRIBUTE_PAGE.SETUP.SUBTITLE", {
                    defaultValue:
                      "Pour un quiz photo fiable, commence par cadrer les informations de base.",
                  })}
                </Typography>
              </Box>

              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  gap={1}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {t("ATTRIBUTE_PAGE.SETUP.PROGRESS_LABEL", {
                      done: completedEssentialCount,
                      total: essentialSetupProgress.length,
                      defaultValue: `${completedEssentialCount} / ${essentialSetupProgress.length} champs essentiels`,
                    })}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {t("ATTRIBUTE_PAGE.SETUP.PROGRESS_PERCENT", {
                      percent: Math.round(essentialProgressPercent),
                      defaultValue: `${Math.round(essentialProgressPercent)}%`,
                    })}
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={essentialProgressPercent}
                  sx={{ height: 6, borderRadius: 999 }}
                />
              </Box>

              <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
                {essentialSetupProgress.map((step) => (
                  <Chip
                    key={step.conceptCode}
                    icon={
                      step.exists ? (
                        <CheckCircleRoundedIcon fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon fontSize="small" />
                      )
                    }
                    label={step.label}
                    color={step.exists ? "success" : "default"}
                    variant={step.exists ? "filled" : "outlined"}
                    sx={{ maxWidth: "100%" }}
                  />
                ))}
              </Stack>

              {!!nextRecommendedConceptLabel && (
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 1.25,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
                  })}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
                    <TipsAndUpdatesOutlinedIcon color="info" fontSize="small" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {t("ATTRIBUTE_PAGE.SETUP.NEXT_STEP_TITLE", {
                          defaultValue: "Prochaine étape recommandée",
                        })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("ATTRIBUTE_PAGE.SETUP.NEXT_STEP_TEXT_SINGLE", {
                          concept: nextRecommendedConceptLabel,
                          defaultValue: `Ajoute ${nextRecommendedConceptLabel} pour compléter la configuration de base.`,
                        })}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => setDrawerA({ open: true, initial: null })}
                    sx={{
                      whiteSpace: "nowrap",
                      alignSelf: { xs: "stretch", sm: "center" },
                    }}
                  >
                    {t("ATTRIBUTE_PAGE.SETUP.ADD_CONCEPT", {
                      concept: nextRecommendedConceptLabel,
                      defaultValue: `Ajouter ${nextRecommendedConceptLabel}`,
                    })}
                  </Button>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {topIssuesSummary && (
        <Alert severity={health.errorsCount > 0 ? "error" : "warning"}>
          <AlertTitle>
            {health.errorsCount > 0
              ? t("ATTRIBUTE_PAGE.ISSUES_TITLE_ERROR", {
                  defaultValue: "Des corrections sont nécessaires",
                })
              : t("ATTRIBUTE_PAGE.ISSUES_TITLE_WARNING", {
                  defaultValue: "Quelques ajustements sont recommandés",
                })}
          </AlertTitle>
          {topIssuesSummary}
        </Alert>
      )}

      {!topIssuesSummary && isSetupComplete && (
        <Alert severity="success" icon={<AutoAwesomeRoundedIcon />}>
          <AlertTitle>
            {t("ATTRIBUTE_PAGE.SUCCESS_TITLE", {
              defaultValue: "Configuration de base prête",
            })}
          </AlertTitle>
          {t("ATTRIBUTE_PAGE.SUCCESS_TEXT", {
            defaultValue:
              "Les champs essentiels sont en place. Tu peux maintenant affiner ou ajouter des champs métier.",
          })}
        </Alert>
      )}

      <IdentityMembersCard
        sources={identitySources}
        onMove={handleMoveIdentitySource}
        onEditSource={openAttributeEditor}
        onCreateSource={openCreateIdentitySource}
      />

      <Card
        variant="outlined"
        sx={{
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ pb: 1.25, px: { xs: 1.75, sm: 2.5 }, pt: 1.75 }}>
          <Stack spacing={1.25}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              gap={1}
            >
              <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
                {viewChips.map((item) => (
                  <Chip
                    key={item.value}
                    size="small"
                    label={t(item.labelKey, { defaultValue: item.defaultLabel })}
                    color={viewMode === item.value ? "primary" : "default"}
                    variant={viewMode === item.value ? "filled" : "outlined"}
                    onClick={() => {
                      setPage(0);
                      setViewMode(item.value);
                    }}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap", alignSelf: { xs: "flex-end", md: "auto" } }}
              >
                {t("ATTRIBUTE_PAGE.RESULTS_COUNT", {
                  count: totalA,
                  defaultValue: `${totalA} résultat${totalA > 1 ? "s" : ""}`,
                })}
              </Typography>
            </Stack>

            <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap alignItems="center">
              {(health.byTagCount["concept-type-mismatch"] ?? 0) > 0 && (
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label={t("ATTRIBUTE_PAGE.QUICK_FILTER_TYPES_TO_FIX", {
                    defaultValue: "Types à corriger",
                  })}
                  onClick={() => {
                    setPage(0);
                    setViewMode("needsAttention");
                  }}
                  sx={{ cursor: "pointer" }}
                />
              )}

              {(health.byTagCount["enum-without-options"] ?? 0) > 0 && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={t("ATTRIBUTE_PAGE.QUICK_FILTER_INCOMPLETE_LISTS", {
                    defaultValue: "Listes incomplètes",
                  })}
                  onClick={() => {
                    setPage(0);
                    setViewMode("needsAttention");
                  }}
                  sx={{ cursor: "pointer" }}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>

        <Divider />

        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            pt: 1.5,
            minHeight: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loadingA && attributes.length === 0 ? (
            <Skeleton variant="rounded" height={280} />
          ) : totalA === 0 ? (
            <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
              <CardContent sx={{ py: 4 }}>
                <Stack spacing={1.5} alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight={700}>
                    {t("ATTRIBUTE_PAGE.EMPTY_TITLE", { defaultValue: "Aucun champ à afficher" })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("ATTRIBUTE_PAGE.EMPTY_TEXT", {
                      defaultValue:
                        "Commence par ajouter les informations essentielles, puis enrichis progressivement le schéma avec des champs métier.",
                    })}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => setDrawerA({ open: true, initial: null })}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {t("ATTRIBUTE_PAGE.ADD_ATTRIBUTE", { defaultValue: "Ajouter un attribut" })}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <AttributeList
              rows={pageRows}
              page={page}
              pageSize={pageSize}
              total={totalA}
              onPageChange={setPage}
              onReorder={onReorder}
              onEdit={openAttributeEditor}
              onDeleted={async () => {
                await hardRefreshAttributes();
              }}
              issuesByAttributeId={issuesByAttributeId}
            />
          )}
        </Box>
      </Card>

      <AttributeFormDrawer
        key={drawerA.initial?.id ?? "create"}
        open={drawerA.open}
        initial={drawerA.initial || undefined}
        presetIdentitySource={drawerA.presetIdentitySource}
        onClose={onCloseAttributeDrawer}
        onEditAttribute={openAttributeEditor}
        conceptOptions={concepts}
        allAttributes={attributes}
        onRefreshAttributes={hardRefreshAttributes}
      />
    </Box>
  );
}
