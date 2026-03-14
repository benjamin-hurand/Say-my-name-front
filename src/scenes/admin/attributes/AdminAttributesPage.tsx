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

import { reorderAdminAttributes } from "../../../services/business/admin/admin.attributes.service";
import { getAttributes } from "../../../services/business/attributes/attribute.service";

import { Attribute, AttributeType } from "../../../models/commons/Attribute/Attribute";

import { useTenantData } from "../../../contexts/TenantDataContext";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";

type ConceptValueType = "TEXT" | "ENUM" | "DATETIME" | "NUMBER" | "BOOLEAN";

type AttributeIssueTag =
  | "category-no-filter"
  | "useless"
  | "concept-type-mismatch"
  | "identity-source-not-eligible"
  | "derived-edit-policy-mismatch"
  | "system-concept-duplicated"
  | "enum-without-options";

export type AttributeIssueInfo = {
  tags: AttributeIssueTag[];
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

const UNIQUE_SYSTEM_CONCEPT_CODES = new Set([
  "FIRST_NAME",
  "LAST_NAME",
  "GENDER",
  "IDENTITY",
]);

const RECOMMENDED_BOOTSTRAP_CONCEPT_CODES = ["FIRST_NAME", "LAST_NAME", "GENDER"];

const ESSENTIAL_CONCEPT_CODES = new Set([
  ...RECOMMENDED_BOOTSTRAP_CONCEPT_CODES,
  "IDENTITY",
]);

const CONCEPT_TYPE_COMPATIBILITY: Record<ConceptValueType, AttributeType[]> = {
  TEXT: ["TEXT"],
  ENUM: ["ENUM"],
  DATETIME: ["DATE", "DATETIME"],
  NUMBER: ["NUMBER"],
  BOOLEAN: ["BOOLEAN"],
};

function getAttrId(a: Attribute): number | undefined {
  return (a as any)?.id;
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

function getConceptValueType(a: Attribute): ConceptValueType | null {
  return ((a as any)?.conceptValueType as ConceptValueType | null) ?? null;
}

function isConceptDerived(a: Attribute): boolean {
  return !!(a as any)?.conceptDerived;
}

function isIdentityComponentEligible(a: Attribute): boolean {
  return !!(a as any)?.identityComponentEligible;
}

function getAttributeType(a: Attribute): AttributeType | null {
  return ((a as any)?.type as AttributeType | null) ?? null;
}

function getEditPolicy(a: Attribute): string | null {
  return ((a as any)?.editPolicy as string | null) ?? null;
}

function isFilterable(a: Attribute): boolean {
  return !!(a as any)?.filter;
}

function isSortable(a: Attribute): boolean {
  return !!(a as any)?.sort;
}

function isCategory(a: Attribute): boolean {
  return !!(a as any)?.category;
}

function isIdentitySource(a: Attribute): boolean {
  return !!(a as any)?.identitySource;
}

function getOptionsCount(a: Attribute): number {
  return Array.isArray((a as any)?.options) ? (a as any).options.length : 0;
}

function isAttributeTypeCompatibleWithConcept(attribute: Attribute): boolean {
  const conceptValueType = getConceptValueType(attribute);
  const type = getAttributeType(attribute);

  if (!conceptValueType || !type) return true;
  return CONCEPT_TYPE_COMPATIBILITY[conceptValueType]?.includes(type) ?? true;
}

export default function AdminAttributesPage() {
  const { t } = useTranslation();
  const { attributes: globalAttributes, concepts } = useTenantData();

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
      const type = getAttributeType(a);
      const conceptValueType = getConceptValueType(a);
      const conceptLabel = conceptCode ? getConceptLabel(conceptCode) : "?";

      switch (tag) {
        case "category-no-filter":
          return t("ATTRIBUTE_HEALTH_MESSAGES.category-no-filter", {
            name,
            defaultValue: `L’attribut "${name}" est marqué comme catégorie mais n’est pas filtrable.`,
          });
        case "useless":
          return t("ATTRIBUTE_HEALTH_MESSAGES.useless", {
            name,
            defaultValue: `L’attribut "${name}" semble peu exploitable actuellement.`,
          });
        case "concept-type-mismatch":
          return t("ATTRIBUTE_HEALTH_MESSAGES.concept-type-mismatch", {
            name,
            type: type ?? "?",
            concept: conceptLabel,
            conceptValueType: conceptValueType ?? "?",
            defaultValue: `L’attribut "${name}" a un type "${type ?? "?"}" incompatible avec le concept "${conceptLabel}" (${conceptValueType ?? "?"}).`,
          });
        case "identity-source-not-eligible":
          return t("ATTRIBUTE_HEALTH_MESSAGES.identity-source-not-eligible", {
            name,
            defaultValue: `L’attribut "${name}" est défini comme source d’identité alors que son concept n’est pas éligible.`,
          });
        case "derived-edit-policy-mismatch":
          return t("ATTRIBUTE_HEALTH_MESSAGES.derived-edit-policy-mismatch", {
            name,
            defaultValue: `L’attribut "${name}" est lié à un concept dérivé mais son editPolicy n’est pas "DERIVED".`,
          });
        case "system-concept-duplicated":
          return t("ATTRIBUTE_HEALTH_MESSAGES.system-concept-duplicated", {
            concept: conceptLabel,
            defaultValue: `Le concept système "${conceptLabel}" est dupliqué dans le tenant.`,
          });
        case "enum-without-options":
          return t("ATTRIBUTE_HEALTH_MESSAGES.enum-without-options", {
            name,
            defaultValue: `L’attribut ENUM "${name}" ne possède aucune option active.`,
          });
        default:
          return t("ATTRIBUTE_HEALTH_MESSAGES.default", {
            name,
            defaultValue: `Problème détecté sur "${name}".`,
          });
      }
    },
    [getConceptLabel, t]
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
      const fresh = await getAttributes({ options: true });
      setAttributes(fresh ?? []);
    } catch (e: any) {
      notifyError(
        e?.message ||
          t("ATTRIBUTE_PAGE.REFRESH_ERROR", {
            defaultValue: "Erreur lors de l’actualisation des attributs",
          })
      );
    } finally {
      setLoadingA(false);
    }
  }, [t]);

  const diagnostics = useMemo(() => {
    const rows = attributes ?? [];
    const items: HealthDiagnostic[] = [];

    const conceptGroups = new Map<string, Attribute[]>();
    for (const a of rows) {
      const code = getConceptCode(a);
      if (!code) continue;
      if (!conceptGroups.has(code)) conceptGroups.set(code, []);
      conceptGroups.get(code)!.push(a);
    }

    for (const a of rows) {
      const id = getAttrId(a);
      const name = getAttrName(a);

      if (isCategory(a) && !isFilterable(a)) {
        items.push({
          tag: "category-no-filter",
          severity: "warning",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("category-no-filter", a),
        });
      }

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

      if (!isAttributeTypeCompatibleWithConcept(a)) {
        items.push({
          tag: "concept-type-mismatch",
          severity: "error",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("concept-type-mismatch", a),
        });
      }

      if (isIdentitySource(a) && !isIdentityComponentEligible(a)) {
        items.push({
          tag: "identity-source-not-eligible",
          severity: "error",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("identity-source-not-eligible", a),
        });
      }

      if (isConceptDerived(a) && getEditPolicy(a) !== "DERIVED") {
        items.push({
          tag: "derived-edit-policy-mismatch",
          severity: "error",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("derived-edit-policy-mismatch", a),
        });
      }

      if (getAttributeType(a) === "ENUM" && getOptionsCount(a) === 0) {
        items.push({
          tag: "enum-without-options",
          severity: "warning",
          attributeId: id,
          attributeName: name,
          message: buildIssueMessage("enum-without-options", a),
        });
      }
    }

    for (const [conceptCode, rowsForConcept] of conceptGroups.entries()) {
      if (!UNIQUE_SYSTEM_CONCEPT_CODES.has(conceptCode)) continue;
      if (rowsForConcept.length <= 1) continue;

      for (const a of rowsForConcept) {
        items.push({
          tag: "system-concept-duplicated",
          severity: "error",
          attributeId: getAttrId(a),
          attributeName: getAttrName(a),
          message: buildIssueMessage("system-concept-duplicated", a),
        });
      }
    }

    return items;
  }, [attributes, buildIssueMessage]);

  const issuesByAttributeId = useMemo(() => {
    const map = new Map<number, AttributeIssueInfo>();

    for (const diag of diagnostics) {
      if (diag.attributeId == null) continue;

      const prev = map.get(diag.attributeId);
      if (prev) {
        if (!prev.tags.includes(diag.tag)) prev.tags.push(diag.tag);
        if (diag.severity === "error") prev.severity = "error";
      } else {
        map.set(diag.attributeId, {
          tags: [diag.tag],
          severity: diag.severity,
        });
      }
    }

    return map;
  }, [diagnostics]);

  const health = useMemo(() => {
    const rows = attributes ?? [];
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
  }, [attributes, diagnostics]);

  const topIssuesSummary = useMemo(() => {
    if (health.errorsCount > 0) {
      if ((health.byTagCount["system-concept-duplicated"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.system-concept-duplicated", {
          defaultValue: "Certains concepts système sont dupliqués et doivent être corrigés.",
        });
      }
      if ((health.byTagCount["concept-type-mismatch"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.concept-type-mismatch", {
          defaultValue: "Certains attributs ont un type incompatible avec leur concept.",
        });
      }
      if ((health.byTagCount["identity-source-not-eligible"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.identity-source-not-eligible", {
          defaultValue: "Certaines sources d’identité ne sont pas cohérentes avec leur concept.",
        });
      }
      if ((health.byTagCount["derived-edit-policy-mismatch"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.derived-edit-policy-mismatch", {
          defaultValue: "Certaines règles de calcul d’attribut doivent être corrigées.",
        });
      }
      return t("ATTRIBUTE_PAGE.TOP_ISSUES.default-error", {
        defaultValue: "Des attributs doivent être corrigés pour garantir un schéma cohérent.",
      });
    }

    if (health.warningsCount > 0) {
      if ((health.byTagCount["enum-without-options"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.enum-without-options", {
          defaultValue: "Certaines listes n’ont pas encore d’options configurées.",
        });
      }
      if ((health.byTagCount["category-no-filter"] ?? 0) > 0) {
        return t("ATTRIBUTE_PAGE.TOP_ISSUES.category-no-filter", {
          defaultValue: "Certaines catégories ne sont pas encore exploitables comme filtres.",
        });
      }
      return t("ATTRIBUTE_PAGE.TOP_ISSUES.default-warning", {
        defaultValue: "Quelques améliorations sont recommandées pour finaliser la configuration.",
      });
    }

    return null;
  }, [health, t]);

  const filteredAttributes = useMemo(() => {
    return (attributes ?? [])
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
  }, [attributes, issuesByAttributeId, viewMode]);

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
      await reorderAdminAttributes(items as Array<{ id: number; displayOrder: number }>);

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

  const [drawerA, setDrawerA] = useState<{ open: boolean; initial?: Attribute | null }>({
    open: false,
  });

  const onCloseAttributeDrawer = async (changed?: boolean) => {
    setDrawerA({ open: false });
    if (changed) {
      await hardRefreshAttributes();
      notifySuccess(t("ATTRIBUTE_PAGE.SAVED_SUCCESS", { defaultValue: "Attribut enregistré" }));
    }
  };

  const essentialSetupProgress = RECOMMENDED_BOOTSTRAP_CONCEPT_CODES.map((conceptCode) => {
    const exists = attributes.some((a) => getConceptCode(a) === conceptCode);
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
            {t("ATTRIBUTE_PAGE.TITLE", { defaultValue: "Attributs" })}
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
            {t("ATTRIBUTE_PAGE.ADD_ATTRIBUTE", { defaultValue: "Ajouter un attribut" })}
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
                    defaultValue: "Commencer par les attributs essentiels",
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
                      defaultValue: `${completedEssentialCount} / ${essentialSetupProgress.length} attributs essentiels`,
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
              "Les attributs essentiels sont en place. Tu peux maintenant affiner ou ajouter des attributs métier.",
          })}
        </Alert>
      )}

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
              {(health.byTagCount["system-concept-duplicated"] ?? 0) > 0 && (
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label={t("ATTRIBUTE_PAGE.QUICK_FILTER_DUPLICATED_SYSTEM_CONCEPTS", {
                    defaultValue: "Concepts système dupliqués",
                  })}
                  onClick={() => {
                    setPage(0);
                    setViewMode("needsAttention");
                  }}
                  sx={{ cursor: "pointer" }}
                />
              )}

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
                    {t("ATTRIBUTE_PAGE.EMPTY_TITLE", { defaultValue: "Aucun attribut à afficher" })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("ATTRIBUTE_PAGE.EMPTY_TEXT", {
                      defaultValue:
                        "Commence par ajouter les informations essentielles, puis enrichis progressivement le schéma avec des attributs métier.",
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
              onEdit={(row) => setDrawerA({ open: true, initial: row })}
              onDeleted={async () => {
                await hardRefreshAttributes();
              }}
              issuesByAttributeId={issuesByAttributeId}
            />
          )}
        </Box>
      </Card>

      <AttributeFormDrawer
        open={drawerA.open}
        initial={drawerA.initial || undefined}
        onClose={onCloseAttributeDrawer}
        conceptOptions={concepts}
        allAttributes={attributes}
      />
    </Box>
  );
}