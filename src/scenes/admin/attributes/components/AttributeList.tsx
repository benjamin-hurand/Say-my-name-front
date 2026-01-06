import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { toast } from "react-toastify";

import { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { deleteAdminAttribute } from "../../../../services/business/admin/admin.attributes.service";
import type { AttributeIssueInfo } from "../AdminAttributesPage";

type Props = {
  rows?: Attribute[];         // ← optionnel (valeur par défaut ci-dessous)
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onReorder: (next: Attribute[]) => void;
  onEdit: (row: Attribute) => void;
  onCreate: () => void;
  onDeleted: () => void;

  // Mise en valeur des problèmes (id → tags + sévérité)
  issuesByAttributeId?: Map<number, AttributeIssueInfo>;
};

export default function AttributeList({
  rows = [],
  page,
  pageSize,
  total,
  onPageChange,
  onReorder,
  onEdit,
  onCreate,
  onDeleted,
  issuesByAttributeId,
}: Props) {
  const theme = useTheme();

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
    if (!confirm(`Supprimer l’attribut "${row.name}" ?`)) return;
    try {
      await deleteAdminAttribute((row as any).id);
      toast.success("Attribut supprimé");
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message || "Suppression impossible (utilisé ?)");
    }
  };

  const getIssueFor = (row: Attribute) => {
    const id = (row as any)?.id;
    if (id == null || !issuesByAttributeId) return null;
    return issuesByAttributeId.get(id) ?? null;
  };

  const rowStyleForIssue = (issue: AttributeIssueInfo | null) => {
    if (!issue) return {};
    const color =
      issue.severity === "error" ? theme.palette.error.main : theme.palette.warning.main;
    return {
      backgroundColor: alpha(color, 0.06),
      "& td:first-of-type::before": {
        content: '""',
        display: "block",
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: color,
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
      },
      position: "relative",
    } as const;
  };

  const labelFromTag = (tag: AttributeIssueInfo["tags"][number]) => {
    switch (tag) {
      case "primary-unused":
        return "primary non utilisé";
      case "category-no-filter":
        return "category sans filtre";
      case "useless":
        return "potentiellement inutile";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button variant="contained" onClick={onCreate}>
          Ajouter
        </Button>
      </Stack>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell align="right">Max</TableCell>
              <TableCell width={120} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <Droppable droppableId="attributes">
            {(p) => (
              <TableBody ref={p.innerRef} {...p.droppableProps}>
                {rows.map((row, idx) => {
                  const issue = getIssueFor(row);
                  return (
                    <Draggable draggableId={String((row as any).id)} index={idx} key={(row as any).id}>
                      {(pp) => (
                        <TableRow
                          ref={pp.innerRef}
                          {...pp.draggableProps}
                          hover
                          sx={rowStyleForIssue(issue)}
                        >
                          <TableCell {...pp.dragHandleProps}>
                            <DragIndicatorRoundedIcon fontSize="small" sx={{ opacity: 0.7 }} />
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={0.75}>
                              <span>{row.name}</span>
                              {issue && (
                                <Tooltip
                                  title={
                                    <Stack gap={0.5}>
                                      {issue.tags.map((t, i) => (
                                        <span key={i}>• {labelFromTag(t)}</span>
                                      ))}
                                    </Stack>
                                  }
                                  placement="top"
                                >
                                  <ReportProblemRoundedIcon
                                    fontSize="small"
                                    color={issue.severity === "error" ? "error" : "warning"}
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip size="small" label={(row as any).type ?? "—"} />
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                              {!!(row as any).primaryField && <Chip size="small" label="primary" />}
                              {!!(row as any).category && <Chip size="small" label="category" />}
                              {!!(row as any).filter && <Chip size="small" label="filter" />}
                              {!!(row as any).sort && <Chip size="small" label="sort" />}
                              {!!(row as any).required && <Chip size="small" label="required" />}
                              {!!(row as any).initializable && <Chip size="small" label="initializable" />}
                              {(row as any).editPolicy &&
                                (row as any).editPolicy !== "FREE" && (
                                  <Chip size="small" label={(row as any).editPolicy.toLowerCase()} />
                                )}

                              {/* Affiche aussi les tags de problème en chips discrètes */}
                              {issue?.tags?.map((t, i) => (
                                <Chip
                                  key={i}
                                  size="small"
                                  variant="outlined"
                                  color={issue.severity === "error" ? "error" : "warning"}
                                  label={labelFromTag(t)}
                                />
                              ))}
                            </Stack>
                          </TableCell>

                          <TableCell align="right">
                            {(row as any).maxValues === 0 ? "∞" : (row as any).maxValues ?? "—"}
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Éditer">
                              <IconButton size="small" onClick={() => onEdit(row)}>
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton size="small" onClick={() => handleDelete(row)}>
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  );
                })}
                {p.placeholder}
              </TableBody>
            )}
          </Droppable>
        </Table>
      </DragDropContext>

      <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
        <Pagination
          page={page + 1}
          count={Math.max(1, Math.ceil(total / pageSize))}
          onChange={(_, p) => onPageChange(p - 1)}
          size="small"
        />
      </Stack>
    </Box>
  );
}
