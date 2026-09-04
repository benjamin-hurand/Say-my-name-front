import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvidedDraggableProps,
  type DraggableProvidedDragHandleProps,
  type DraggableStyle,
  type DropResult,
} from "@hello-pangea/dnd";
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
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Attribute, ValueType } from "../../../../models/commons/Attribute/Attribute";
import { getValueTypeLabel } from "./attributeForm/attributeForm.helpers";
import { deleteAdminAttribute } from "../../../../services/business/admin/admin.attributes.service";
import { getApiErrorMessage, getApiStatus } from "../../../../utils/apiError";
import type { AttributeIssueInfo } from "../AdminAttributesPage";

type Props = {
  standardRows?: Attribute[];
  customRows?: Attribute[];
  page: number;
  pageSize: number;
  customTotal: number;
  onPageChange: (p: number) => void;
  onReorder: (next: Attribute[]) => void;
  onEdit: (row: Attribute) => void;
  onDeleted: () => void;
  issuesByAttributeId?: Map<number, AttributeIssueInfo>;
};

type DragContext = {
  innerRef: (element: HTMLElement | null) => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  style: DraggableStyle | undefined;
  isDragging: boolean;
};

// @hello-pangea/dnd measures each Draggable's own margin box (via
// getComputedStyle) to size its auto-generated placeholder and to compute
// how far sibling cards must shift, but it has no notion of a *container*
// `gap` — that spacing lives outside the box it measures. Using `gap` here
// was the source of the small drag-time spacing drift: give the row itself
// this margin instead, so the space is part of the geometry dnd measures.
//
// This margin is applied uniformly to every custom row, the source-order
// last one included. dnd never reorders the DOM during a drag — it only
// translates elements visually — so an "is this the last row" flag derived
// from array position always describes where a row started, not wherever
// it currently renders on screen. Zeroing the margin on that one row bound
// its geometry to a position it could visually move away from, so it ended
// up hugging whatever neighbor another dragged row put next to it. The
// geometry a Draggable carries must stay invariant to its position.
const CUSTOM_ROW_SPACING = 1.25;

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

/**
 * `.admin-content__inner` (admin-layout.css) applies `backdrop-filter`, which
 * creates a new CSS containing block for descendants positioned `fixed`.
 * @hello-pangea/dnd positions the dragged card with `position: fixed`
 * assuming the viewport is that containing block, so under that ancestor the
 * card renders offset by however far the filtered box sits from the
 * viewport edge (sidebar width, padding, scroll...). Portalling the dragged
 * node straight to `document.body` restores the viewport as the containing
 * block and fixes the offset at its source instead of patching coordinates.
 */
function useDragPortalNode(): RefObject<HTMLDivElement | null> {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  if (nodeRef.current === null && typeof document !== "undefined") {
    nodeRef.current = document.createElement("div");
  }

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    node.style.position = "absolute";
    node.style.top = "0";
    node.style.left = "0";
    node.style.width = "100%";
    node.style.height = "100%";
    node.style.pointerEvents = "none";
    node.style.zIndex = "1200";
    document.body.appendChild(node);

    return () => {
      document.body.removeChild(node);
    };
  }, []);

  return nodeRef;
}

const TRANSLATE_PATTERN = /translate\(([-.\d]+)px,\s*([-.\d]+)px\)/;

// Keeps the card moving on the vertical axis only: the list is a vertical
// sortable list, so the X component of the dnd-provided transform (which
// otherwise follows the pointer horizontally) is zeroed out. The Y
// component and every other style field (width/height/position/transition)
// are left untouched so the reordering animation keeps working.
function lockToVerticalAxis(
  style: DraggableStyle | undefined,
  isDragging: boolean
): DraggableStyle | undefined {
  if (!style || !isDragging) return style;

  const transform = style.transform;
  if (!transform) return style;

  const match = TRANSLATE_PATTERN.exec(transform);
  if (!match) return style;

  return {
    ...style,
    transform: `translate(0px, ${match[2]}px)`,
  };
}

export default function AttributeList({
  standardRows = [],
  customRows = [],
  page,
  pageSize,
  customTotal,
  onPageChange,
  onReorder,
  onEdit,
  onDeleted,
  issuesByAttributeId,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const dragPortalNode = useDragPortalNode();

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

    const next = Array.from(customRows);
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

  const renderCard = (row: Attribute, drag: DragContext | null): ReactNode => {
    const issue = getIssueFor(row);
    const conceptCode = getConceptCode(row);
    const isSystemIdentity = conceptCode === "IDENTITY";
    const name =
      getRowName(row) ||
      t("ATTRIBUTE_UI.UNNAMED_ATTRIBUTE", { defaultValue: "Champ sans nom" });
    const usageLabel = getUsageLabel(row);

    return (
      <Box
        ref={drag?.innerRef}
        {...(drag?.draggableProps ?? {})}
        style={drag ? lockToVerticalAxis(drag.style, drag.isDragging) : undefined}
        sx={{
          width: "100%",
          minWidth: 0,
          display: "block",
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.65),
          overflow: "visible",
          ...(drag && { mb: CUSTOM_ROW_SPACING }),
          ...(drag?.isDragging && {
            boxShadow: theme.shadows[6],
          }),
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
              {...(drag?.dragHandleProps ?? {})}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "flex-start", sm: "center" },
                width: { xs: "100%", sm: 28 },
                minWidth: { xs: 0, sm: 28 },
                height: 28,
                color: "text.secondary",
                cursor: drag ? (drag.isDragging ? "grabbing" : "grab") : "default",
                flexShrink: 0,
              }}
            >
              {drag && <DragIndicatorRoundedIcon fontSize="small" />}
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
                              issue.severity === "error" ? "À corriger" : "À revoir",
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
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        gap: 2.5,
        overflow: "visible",
      }}
    >
      {standardRows.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
            {t("ATTRIBUTE_UI.STANDARD_FIELDS_TITLE", { defaultValue: "Champs standards" })}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              width: "100%",
              overflow: "visible",
            }}
          >
            {standardRows.map((row) => (
              <Box key={getRowId(row)}>{renderCard(row, null)}</Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
          {t("ATTRIBUTE_UI.CUSTOM_FIELDS_TITLE", { defaultValue: "Champs personnalisés" })}
        </Typography>

        {customRows.length === 0 && customTotal === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            {t("ATTRIBUTE_UI.CUSTOM_FIELDS_EMPTY", {
              defaultValue: "Aucun champ personnalisé pour le moment.",
            })}
          </Typography>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="custom-attributes">
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 120,
                    width: "100%",
                    overflow: "visible",
                  }}
                >
                  {customRows.map((row, idx) => (
                    <Draggable
                      draggableId={String(getRowId(row))}
                      index={idx}
                      key={getRowId(row)}
                    >
                      {(dragProvided, dragSnapshot) => {
                        const card = renderCard(row, {
                          innerRef: dragProvided.innerRef,
                          draggableProps: dragProvided.draggableProps,
                          dragHandleProps: dragProvided.dragHandleProps,
                          style: dragProvided.draggableProps.style,
                          isDragging: dragSnapshot.isDragging,
                        });

                        if (dragSnapshot.isDragging) {
                          return createPortal(card, dragPortalNode.current ?? document.body);
                        }

                        return card;
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Box>

      {customTotal > pageSize && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 0.5 }}>
          <Pagination
            page={page + 1}
            count={Math.max(1, Math.ceil(customTotal / pageSize))}
            onChange={(_, p) => onPageChange(p - 1)}
            size="small"
          />
        </Stack>
      )}
    </Box>
  );
}
