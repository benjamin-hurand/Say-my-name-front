import React, { KeyboardEvent, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import { FieldLabel, statusColor, formatRelative } from "../admin/cr/ui";
import { ValueChip } from "../admin/cr/ValueChip";
import { ChangeRequestSummary } from "../../../../models/commons/Profile/ChangeRequest";

/* ---------- component ---------- */

type ChipPair = { id: number; value: string };

type Props = {
  cr: ChangeRequestSummary;
  /** Affiché en en-tête (attribut porté par l’enveloppe) */
  getAttrLabel: (attributeId: number) => string;
  /** Récupère le maxValues pour cet attribut */
  getAttrMaxValues: (attributeId: number) => number;
  /** Valeurs *baseline* pour cet attribut (id + value) */
  currentChips?: ChipPair[];
  /** Formatteur de valeur (ex: prettyValue) */
  formatValue?: (raw: string) => string;
  onTreat?: (cr: ChangeRequestSummary) => void;
};

const AdminChangeRequestCard: React.FC<Props> = ({
  cr,
  getAttrLabel,
  getAttrMaxValues,
  currentChips = [],
  formatValue = (v) => v,
  onTreat,
}) => {
  const theme = useTheme();
  const created = cr.createdAt ? new Date(cr.createdAt) : null;
  const updated = cr.updatedAt ? new Date(cr.updatedAt) : null;

  const attrId = cr.attributeId ?? null;
  const envelopeAttrLabel =
    (attrId != null ? getAttrLabel(attrId) : null) ?? "Attribut";

  const items = cr.items ?? [];
  const isClickable = Boolean(onTreat);

  const handleClick = () => onTreat?.(cr);
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTreat?.(cr);
    }
  };

  /** ===== Projection “APRÈS” + liste des supprimées (gestion fine des doublons) =====
   * - On part des valeurs baseline (par id -> value).
   * - UPDATE: supprime l’ancienne (deleted = item.personAttribute.value) et ajoute la nouvelle.
   *   Sauf si ancienne === nouvelle → no-op visuel (on remet comme “inchangée”).
   * - DELETE: supprime l’ancienne (deleted = item.personAttribute.value).
   * - CREATE: ajoute la nouvelle (proposedValue).
   *
   * On marque “create” uniquement les *vraies* nouvelles occurrences (comparaison des compteurs).
   */
  const projection = useMemo(() => {
    // Map id -> value (état courant mutable / “inchangé” par défaut)
    const curById = new Map<number, string>();
    currentChips.forEach(({ id, value }) => curById.set(id, value));

    const added: string[] = [];
    const deleted: string[] = [];

    for (const it of items) {
      if (it.action === "CREATE") {
        if (it.proposedValue != null) added.push(it.proposedValue);
        continue;
      }

      if (it.action === "UPDATE") {
        const paId = it.personAttribute?.id ?? null;
        const oldVal =
          it.personAttribute?.value ??
          (paId != null ? curById.get(paId) : undefined);
        const newVal = it.proposedValue ?? undefined;

        if (paId != null) curById.delete(paId);

        if (oldVal != null && newVal != null && oldVal === newVal) {
          // no-op visuel
          curById.set(paId!, oldVal);
        } else {
          if (oldVal != null) deleted.push(oldVal);
          if (newVal != null) added.push(newVal);
        }
        continue;
      }

      if (it.action === "DELETE") {
        const paId = it.personAttribute?.id ?? null;
        const oldVal =
          it.personAttribute?.value ??
          (paId != null ? curById.get(paId) : undefined);
        if (paId != null) curById.delete(paId);
        if (oldVal != null) deleted.push(oldVal);
      }
    }

    // Valeurs finales = ce qu’il reste (inchangées) + les ajoutées
    const unchanged = Array.from(curById.values());
    const finalValues = [...unchanged, ...added];

    // Compteurs initial / final pour marquer précisément les créations
    const count = (arr: string[]) => {
      const m = new Map<string, number>();
      for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
      return m;
    };
    const initialCounts = count(currentChips.map((c) => c.value));
    const finalCounts = count(finalValues);

    const createBudget = new Map<string, number>();
    for (const [v, f] of finalCounts) {
      const i = initialCounts.get(v) ?? 0;
      if (f > i) createBudget.set(v, f - i);
    }

    // Typage littéral explicite pour éviter tout élargissement en `string`
    const finalMarkers = finalValues.map<"neutral" | "create">((v) => {
      const left = createBudget.get(v) ?? 0;
      if (left > 0) {
        createBudget.set(v, left - 1);
        return "create";
      }
      return "neutral";
    });

    return { finalValues, deletedValues: deleted, finalMarkers };
  }, [items, currentChips]);

  const { finalValues, deletedValues, finalMarkers } = projection;

  // Compteur max (sécurisé si attrId absent)
  const maxValues = useMemo(
    () => (attrId != null ? getAttrMaxValues(attrId) : undefined),
    [getAttrMaxValues, attrId]
  );
  const countLabel =
    maxValues != null ? `${finalValues.length}/${maxValues}` : `${finalValues.length}`;

  return (
    <Card
      variant="outlined"
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      sx={{
        borderRadius: 2,
        borderColor: alpha(theme.palette.common.white, 0.12),
        background: alpha(theme.palette.background.paper, 0.35),
        backdropFilter: "blur(8px) saturate(130%)",
        transition:
          "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
        cursor: isClickable ? "pointer" : "default",
        "&:hover": isClickable
          ? {
              transform: "translateY(-1px)",
              boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
              borderColor: alpha(theme.palette.primary.main, 0.35),
            }
          : undefined,
        outline: "none",
        "&:focus-visible": isClickable
          ? { boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.55)}` }
          : undefined,
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header (statut, attribut, dates) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              color={statusColor(cr.status)}
              label={cr.status}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={envelopeAttrLabel}
              sx={{ borderStyle: "dashed" }}
              variant="outlined"
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.9 }}>
            <AccessTimeRoundedIcon fontSize="small" />
            <Tooltip
              title={
                created
                  ? `${created.toLocaleString()}${
                      updated ? ` • maj ${updated.toLocaleString()}` : ""
                    }`
                  : ""
              }
              arrow
            >
              <Typography variant="caption">
                {formatRelative(created)}
                {updated ? ` • maj ${formatRelative(updated)}` : ""}
              </Typography>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.25, opacity: 0.15 }} />

        {/* Auteur */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <PersonOutlineRoundedIcon fontSize="small" />
          <Typography variant="caption" sx={{ opacity: 0.95 }}>
            {cr.requester?.displayName ?? "—"}
          </Typography>
        </Stack>

        {/* 2 colonnes : Motif | Projection */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            alignItems: "start",
          }}
        >
          {/* Motif */}
          <Box>
            <FieldLabel>Motif de la demande</FieldLabel>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
              {cr.requestReason || "—"}
            </Typography>
          </Box>

          {/* Projection */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <FieldLabel>État des valeurs après demande</FieldLabel>
              <Chip
                size="small"
                variant="outlined"
                label={countLabel}
                aria-label={`Compteur: ${countLabel}`}
              />
              {deletedValues.length > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`+${deletedValues.length} suppr.`}
                  sx={{ opacity: 0.75 }}
                />
              )}
            </Stack>

            {/* Finales + Supprimées ENSEMBLE dans un seul conteneur */}
            {finalValues.length === 0 && deletedValues.length === 0 ? (
              <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.75 }}>
                Aucune valeur restante.
              </Typography>
            ) : (
              <Box
                sx={{
                  mt: 0.75,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                {/* Finales (inchangées + ajoutées) */}
                {finalValues.map((v, i) => (
                  <ValueChip
                    key={`final-${v}-${i}`}
                    marker={finalMarkers[i] === "create" ? "create" : "neutral"}
                  >
                    {formatValue(v)}
                  </ValueChip>
                ))}

                {/* Supprimées (barrées) */}
                {deletedValues.map((v, i) => (
                  <ValueChip key={`del-${v}-${i}`} marker="delete">
                    {formatValue(v)}
                  </ValueChip>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminChangeRequestCard;
