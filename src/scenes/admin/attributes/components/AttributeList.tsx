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

import { Attribute, ValueType } from "../../../../models/commons/Attribute/Attribute";
import { getValueTypeLabel } from "./attributeForm/attributeForm.helpers";
import { deleteAdminAttribute } from "../../../../services/business/admin/admin.attributes.service";
import { getApiErrorMessage, getApiStatus } from "../../../../utils/apiError";
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

function getRowId(row: Attribute): number {
  return (row as any).id;
}

function getRowName(row: Attribute): string {
  return (row as any)?.name ?? "";
}

function getConceptCode(row: Attribute): string | null {
  return (row as any)?.conceptCode ?? null;
}

function getValueType(row: Attribute): ValueType | null {
  return ((row as any)?.type as ValueType | null) ?? null;
}

function isFilterable(row: Attribute): boolean {
  return !!(row as any)?.filter;
}

function isSortable(row: Attribute): boolean {
  return !!(row as any)?.sort;
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
      return t("ATTRIBUTE_UI.CUSTOM_ATTRIBUTE", { defaultValue: "Champ personnalisé" });
    }
    return t(`CONCEPTS.${code}.LABEL`, { defaultValue: code });
  };

  const getMainIndicatorLabel = (row: Attribute): string => {
    const conceptCode = getConceptCode(row);
    if (conceptCode) {
      const conceptLabel = getConceptLabel(conceptCode);
      return t("ATTRIBUTE_UI.MAIN_INDICATOR_STANDARD", {
        concept: conceptLabel,
        defaultValue: `Standard · ${conceptLabel}`,
      });
    }

    const valueType = getValueType(row);
    const typeLabel = valueType ? getValueTypeLabel(valueType, t) : "";
    return t("ATTRIBUTE_UI.MAIN_INDICATOR_CUSTOM", {
      type: typeLabel,
      defaultValue: `Personnalisé · ${typeLabel}`,
    });
  };

  const getUsageLabel = (row: Attribute): string | null => {
    const filterable = isFilterable(row);
    const sortable = isSortable(row);

    if (filterable && sortable) {
      return t("ATTRIBUTE_UI.USAGE_FILTERABLE_SORTABLE", {
        defaultValue: "Filtrable et triable",
      });
    }
    if (filterable) {
      return t("ATTRIBUTE_UI.USAGE_FILTERABLE", { defaultValue: "Filtrable" });
    }
    if (sortable) {
      return t("ATTRIBUTE_UI.USAGE_SORTABLE", { defaultValue: "Triable" });
    }
    return null;
  };

  const handleDragEnd = (r: DropResult) => {
    if (!r.destination) return;

    const next = Array.from(rows);
    const [moved] = next.splice(r.source.index, 1);
    next.splice(r.destination.index, 0, moved);

    onReorder(next);
  };

  const handleDelete = async (row: Attribute) => {
    if (getConceptCode(row) === "IDENTITY") return;
    if (
      !confirm(
        t("ATTRIBUTE_UI.DELETE_CONFIRM", {
          name: getRowName(row),
          defaultValue: `Supprimer le champ "${getRowName(row)}" ?`,
        })
      )
    ) {
      return;
    }

    try {
      await deleteAdminAttribute(getRowId(row));
      toast.success(t("ATTRIBUTE_UI.DELETED_SUCCESS", { defaultValue: "Champ supprimé" }));
      onDeleted();
    } catch (error: unknown) {
      const status = getApiStatus(error);
      const fallback = status === 403
        ? t("ATTRIBUTE_UI.DELETE_SYSTEM_ERROR", {
            defaultValue: "Ce champ système est protégé.",
          })
        : status === 409
          ? t("ATTRIBUTE_UI.DELETE_REFERENCED_ERROR", {
              defaultValue: "Ce champ est encore référencé et ne peut pas être supprimé.",
            })
          : t("ATTRIBUTE_UI.DELETE_ERROR", {
              defaultValue: "Suppression impossible.",
            });
      toast.error(getApiErrorMessage(error, fallback));
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
                const isSystemIdentity = conceptCode === "IDENTITY";
                const name =
                  getRowName(row) ||
                  t("ATTRIBUTE_UI.UNNAMED_ATTRIBUTE", { defaultValue: "Champ sans nom" });
                const usageLabel = getUsageLabel(row);

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
                              <Stack spacing={0.5} sx={{ minWidth: 0, overflow: "visible" }}>
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={0.75}
                                  alignItems={{ xs: "flex-start", md: "center" }}
                                  justifyContent="space-between"
                                  sx={{ minWidth: 0 }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{ minWidth: 0 }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={700}
                                      sx={{
                                        minWidth: 0,
                                        lineHeight: 1.25,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {name}
                                    </Typography>
                                  </Stack>

                                  {issue && (
                                    <Tooltip
                                      title={
                                        <Stack gap={0.5}>
                                          {issue.messages.map((message, i) => (
                                            <span key={i}>• {message}</span>
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

                                <Typography variant="body2" color="text.secondary">
                                  {getMainIndicatorLabel(row)}
                                </Typography>

                                {usageLabel && (
                                  <Typography variant="caption" color="text.secondary">
                                    {usageLabel}
                                  </Typography>
                                )}
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
                              <Tooltip title={isSystemIdentity
                                ? t("ATTRIBUTE_UI.SYSTEM_PROTECTED", { defaultValue: "Champ système protégé" })
                                : t("ATTRIBUTE_UI.EDIT", { defaultValue: "Modifier" })}>
                                <span>
                                <IconButton
                                  size="small"
                                  disabled={isSystemIdentity}
                                  onClick={() => onEdit(row)}
                                  aria-label={t("ATTRIBUTE_UI.EDIT_ARIA", {
                                    name,
                                    defaultValue: `Modifier le champ ${name}`,
                                  })}
                                >
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip
                                title={t("ATTRIBUTE_UI.DELETE", { defaultValue: "Supprimer" })}
                              >
                                <span>
                                <IconButton
                                  size="small"
                                  disabled={isSystemIdentity}
                                  onClick={() => handleDelete(row)}
                                  aria-label={t("ATTRIBUTE_UI.DELETE_ARIA", {
                                    name,
                                    defaultValue: `Supprimer le champ ${name}`,
                                  })}
                                >
                                  <DeleteRoundedIcon fontSize="small" />
                                </IconButton>
                                </span>
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
