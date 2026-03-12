import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import {
  Box,
  Chip,
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { deleteAdminAttribute } from "../../../../services/business/admin/admin.attributes.service";
import type { AttributeIssueInfo } from "../AdminAttributesPage";

type Props = {
  rows?: Attribute[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onReorder: (next: Attribute[]) => void;
  onEdit: (row: Attribute) => void;
  onDeleted: () => void;
  issuesByAttributeId?: Map<number, AttributeIssueInfo>;
};

const ESSENTIAL_CONCEPT_CODES = new Set(["FIRST_NAME", "LAST_NAME", "GENDER", "IDENTITY"]);

function getRowId(row: Attribute): number {
  return (row as any).id;
}

function getRowName(row: Attribute): string {
  return (row as any)?.name ?? "";
}

function getConceptCode(row: Attribute): string | null {
  return (row as any)?.conceptCode ?? null;
}

function isConceptDerived(row: Attribute): boolean {
  return !!(row as any)?.conceptDerived;
}

function isIdentitySource(row: Attribute): boolean {
  return !!(row as any)?.identitySource;
}

function isFilterable(row: Attribute): boolean {
  return !!(row as any)?.filter;
}

function isCategory(row: Attribute): boolean {
  return !!(row as any)?.category;
}

function getAttributePurposeKeys(row: Attribute): string[] {
  const conceptCode = getConceptCode(row);
  const keys: string[] = [];

  if (conceptCode && ESSENTIAL_CONCEPT_CODES.has(conceptCode)) {
    keys.push("ESSENTIAL");
  } else if (!conceptCode) {
    keys.push("CUSTOM");
  }

  if (isIdentitySource(row)) {
    keys.push("IDENTITY");
  } else if (isCategory(row) || isFilterable(row)) {
    keys.push("FILTER");
  }

  if (isConceptDerived(row)) {
    keys.push("DERIVED");
  }

  return keys.slice(0, 2);
}

export default function AttributeList({
  rows = [],
  page,
  pageSize,
  total,
  onPageChange,
  onReorder,
  onEdit,
  onDeleted,
  issuesByAttributeId,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const getConceptLabel = (code: string | null): string => {
    if (!code) {
      return t("ATTRIBUTE_UI.CUSTOM_ATTRIBUTE", { defaultValue: "Attribut personnalisé" });
    }
    return t(`CONCEPTS.${code}.LABEL`, { defaultValue: code });
  };

  const getIssueTagLabel = (tag: AttributeIssueInfo["tags"][number]) => {
    return t(`ATTRIBUTE_HEALTH_TAGS.${tag}`, { defaultValue: tag });
  };

  const getPurposeLabel = (key: string) => {
    return t(`ATTRIBUTE_PURPOSE.${key}`, { defaultValue: key });
  };

  const handleDragEnd = (r: DropResult) => {
    if (!r.destination) return;

    const next = Array.from(rows);
    const [moved] = next.splice(r.source.index, 1);
    next.splice(r.destination.index, 0, moved);

    const withOrder = next.map((it, i) => ({
      ...it,
      displayOrder: (i + 1) * 10,
    }));

    onReorder(withOrder);
  };

  const handleDelete = async (row: Attribute) => {
    if (
      !confirm(
        t("ATTRIBUTE_UI.DELETE_CONFIRM", {
          name: getRowName(row),
          defaultValue: `Supprimer l’attribut "${getRowName(row)}" ?`,
        })
      )
    ) {
      return;
    }

    try {
      await deleteAdminAttribute(getRowId(row));
      toast.success(t("ATTRIBUTE_UI.DELETED_SUCCESS", { defaultValue: "Attribut supprimé" }));
      onDeleted();
    } catch (e: any) {
      toast.error(
        e?.message ||
          t("ATTRIBUTE_UI.DELETE_ERROR", {
            defaultValue: "Suppression impossible (déjà utilisé ?)",
          })
      );
    }
  };

  const getIssueFor = (row: Attribute) => {
    const id = getRowId(row);
    if (id == null || !issuesByAttributeId) return null;
    return issuesByAttributeId.get(id) ?? null;
  };

  const getRowSx = (issue: AttributeIssueInfo | null) => {
    if (!issue) return {};

    const color =
      issue.severity === "error" ? theme.palette.error.main : theme.palette.warning.main;

    return {
      borderColor: alpha(color, 0.45),
      backgroundColor: alpha(color, 0.04),
      boxShadow: `inset 3px 0 0 ${color}`,
    };
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        overflow: "visible",
      }}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="attributes">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                minHeight: 120,
                width: "100%",
                overflow: "visible",
              }}
            >
              {rows.map((row, idx) => {
                const issue = getIssueFor(row);
                const conceptCode = getConceptCode(row);
                const purposeKeys = getAttributePurposeKeys(row);

                return (
                  <Draggable
                    draggableId={String(getRowId(row))}
                    index={idx}
                    key={getRowId(row)}
                  >
                    {(dragProvided) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={dragProvided.draggableProps.style}
                        sx={{
                          width: "100%",
                          minWidth: 0,
                          display: "block",
                          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                          borderRadius: 3,
                          backgroundColor: alpha(theme.palette.background.paper, 0.65),
                          overflow: "visible",
                          ...getRowSx(issue),
                        }}
                      >
                        <Box
                          sx={{
                            px: { xs: 1.25, sm: 1.5 },
                            py: { xs: 1.1, sm: 1.25 },
                            width: "100%",
                            minWidth: 0,
                            overflow: "visible",
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "28px minmax(0, 1fr) auto" },
                              columnGap: { xs: 0, sm: 1.25 },
                              rowGap: 1,
                              alignItems: "start",
                              width: "100%",
                              minWidth: 0,
                            }}
                          >
                            <Box
                              {...dragProvided.dragHandleProps}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: { xs: "flex-start", sm: "center" },
                                width: { xs: "100%", sm: 28 },
                                minWidth: { xs: 0, sm: 28 },
                                height: 28,
                                color: "text.secondary",
                                cursor: "grab",
                                flexShrink: 0,
                              }}
                            >
                              <DragIndicatorRoundedIcon fontSize="small" />
                            </Box>

                            <Box sx={{ minWidth: 0, width: "100%", overflow: "visible" }}>
                              <Stack spacing={1} sx={{ minWidth: 0, overflow: "visible" }}>
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={0.75}
                                  alignItems={{ xs: "flex-start", md: "center" }}
                                  justifyContent="space-between"
                                  sx={{ minWidth: 0 }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                    sx={{
                                      minWidth: 0,
                                      width: "100%",
                                      lineHeight: 1.25,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {getRowName(row) ||
                                      t("ATTRIBUTE_UI.UNNAMED_ATTRIBUTE", {
                                        defaultValue: "Attribut sans nom",
                                      })}
                                  </Typography>

                                  {issue && (
                                    <Tooltip
                                      title={
                                        <Stack gap={0.5}>
                                          {issue.tags.map((tag, i) => (
                                            <span key={i}>• {getIssueTagLabel(tag)}</span>
                                          ))}
                                        </Stack>
                                      }
                                    >
                                      <Chip
                                        size="small"
                                        icon={<ReportProblemRoundedIcon />}
                                        label={t(
                                          issue.severity === "error"
                                            ? "ATTRIBUTE_UI.NEEDS_FIXING"
                                            : "ATTRIBUTE_UI.NEEDS_REVIEW",
                                          {
                                            defaultValue:
                                              issue.severity === "error"
                                                ? "À corriger"
                                                : "À revoir",
                                          }
                                        )}
                                        color={issue.severity === "error" ? "error" : "warning"}
                                        variant="outlined"
                                        sx={{
                                          flexShrink: 0,
                                          height: "auto",
                                          "& .MuiChip-label": {
                                            display: "block",
                                            py: 0.5,
                                            px: 1,
                                            lineHeight: 1.2,
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>

                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.75,
                                    alignItems: "flex-start",
                                    width: "100%",
                                    minWidth: 0,
                                    overflow: "visible",
                                  }}
                                >
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={getConceptLabel(conceptCode)}
                                    sx={{
                                      height: "auto",
                                      maxWidth: "100%",
                                      "& .MuiChip-label": {
                                        display: "block",
                                        py: 0.5,
                                        px: 1,
                                        lineHeight: 1.2,
                                        whiteSpace: "normal",
                                      },
                                    }}
                                  />

                                  {purposeKeys.map((key) => {
                                    const isEssential = key === "ESSENTIAL";
                                    return (
                                      <Chip
                                        key={key}
                                        size="small"
                                        label={getPurposeLabel(key)}
                                        color={isEssential ? "primary" : "default"}
                                        variant={isEssential ? "filled" : "outlined"}
                                        sx={{
                                          height: "auto",
                                          "& .MuiChip-label": {
                                            display: "block",
                                            py: 0.5,
                                            px: 1,
                                            lineHeight: 1.2,
                                            whiteSpace: "normal",
                                          },
                                        }}
                                      />
                                    );
                                  })}
                                </Box>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    lineHeight: 1.4,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {conceptCode
                                    ? t("ATTRIBUTE_UI.ROLE_WITH_LABEL", {
                                        role: getConceptLabel(conceptCode),
                                        defaultValue: `Rôle : ${getConceptLabel(conceptCode)}`,
                                      })
                                    : t("ATTRIBUTE_UI.FREE_ROLE_DESCRIPTION", {
                                        defaultValue:
                                          "Rôle libre pour un besoin métier spécifique.",
                                      })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent={{ xs: "flex-end", sm: "flex-start" }}
                              alignItems="center"
                              sx={{
                                gridColumn: { xs: "1 / -1", sm: "auto" },
                                pt: { xs: 0, sm: 0.25 },
                                ml: { xs: 0, sm: 0.5 },
                                flexShrink: 0,
                              }}
                            >
                              <Tooltip title={t("ATTRIBUTE_UI.EDIT", { defaultValue: "Modifier" })}>
                                <IconButton size="small" onClick={() => onEdit(row)}>
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip
                                title={t("ATTRIBUTE_UI.DELETE", { defaultValue: "Supprimer" })}
                              >
                                <IconButton size="small" onClick={() => handleDelete(row)}>
                                  <DeleteRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {total > pageSize && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
          <Pagination
            page={page + 1}
            count={Math.max(1, Math.ceil(total / pageSize))}
            onChange={(_, p) => onPageChange(p - 1)}
            size="small"
          />
        </Stack>
      )}
    </Box>
  );
}