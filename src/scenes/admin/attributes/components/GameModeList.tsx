import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { toast } from "react-toastify";

import { deleteAdminGameMode } from "../../../../services/business/admin/admin.gameModes.service";
import { GameMode } from "../../../../models/commons/Game/GameMode/GameMode.model";
import { useOrgData } from "../../../../contexts/OrgDataContext";
import type { Attribute } from "../../../../models/commons/Attribute/Attribute";

type Props = {
  rows: GameMode[];
  loading: boolean;
  onEdit: (gm: GameMode) => void;
  onDeleted: () => void;
};

export default function GameModeList({ rows, loading, onEdit, onDeleted }: Props) {
  const { attributes: allAttributes } = useOrgData();

  // Dictionnaire id → Attribute pour les fallbacks si un item ne contient qu’un attributeId
  const attrById = useMemo(() => {
    const m = new Map<number, Attribute>();
    for (const a of allAttributes) if ((a as any)?.id != null) m.set((a as any).id, a as Attribute);
    return m;
  }, [allAttributes]);

  const resolveAttrLabel = (
    a: { id?: number; attribute?: Attribute } & Partial<{ attributeId: number }>
  ) => {
    if ((a as any).attribute?.name) return (a as any).attribute.name;
    if ((a as any).attributeId != null) {
      const found = attrById.get((a as any).attributeId as number);
      if ((found as any)?.name) return (found as any).name;
      return `attr#${(a as any).attributeId}`;
    }
    return "—";
  };

  const handleDelete = async (gm: GameMode) => {
    if (!confirm(`Supprimer le Game Mode "${(gm as any).title}" ?`)) return;
    try {
      await deleteAdminGameMode((gm as any).id);
      toast.success("Game Mode supprimé");
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message || "Suppression impossible");
    }
  };

  if (loading) return <Skeleton variant="rounded" height={240} />;

  if (!rows?.length)
    return <Box sx={{ opacity: 0.8, fontStyle: "italic" }}>Aucun Game Mode.</Box>;

  return (
    <Grid container spacing={1.5}>
      {rows.map((gm) => {
        const op: "AND" | "OR" = ((gm as any).operator as any) === "OR" ? "OR" : "AND";
        const opLabel = op === "AND" ? "ET" : "OU";
        const opHelp =
          op === "AND" ? "Tous ces attributs sont requis" : "Au moins un de ces attributs suffit";
        const legend =
          op === "AND" ? "Règle : tous requis" : "Règle : au moins 1 requis";

        const attrs: any[] = (gm as any).attributes ?? [];

        return (
          <Grid key={(gm as any).id} item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">{(gm as any).title}</Typography>
                {(gm as any).description && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {(gm as any).description}
                  </Typography>
                )}

                {/* Ligne "formule" : [chip] {ET/OU} [chip] ... */}
                <Stack
                  direction="row"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  sx={{ mt: 1 }}
                >
                  {attrs.length === 0 && (
                    <Typography variant="body2" sx={{ opacity: 0.7, fontStyle: "italic" }}>
                      Aucun attribut
                    </Typography>
                  )}

                  {attrs.map((a, idx) => {
                    const label = resolveAttrLabel(a as any);
                    return (
                      <React.Fragment key={(a as any).id ?? `${(a as any).attributeId}-${idx}`}>
                        {idx > 0 && (
                          <Tooltip title={opHelp}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={opLabel}
                              sx={{
                                px: 0.75,
                                fontWeight: 700,
                                letterSpacing: 0.3,
                                height: 22,
                              }}
                            />
                          </Tooltip>
                        )}
                        <Chip size="small" label={label} sx={{ maxWidth: 220 }} />
                      </React.Fragment>
                    );
                  })}
                </Stack>

                {/* Légende claire sous la ligne */}
                {attrs.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.65, display: "block", mt: 0.75 }}
                  >
                    {legend}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: "flex-end" }}>
                <Tooltip title="Éditer">
                  <IconButton onClick={() => onEdit(gm)}>
                    <EditRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton onClick={() => handleDelete(gm)}>
                    <DeleteRoundedIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
