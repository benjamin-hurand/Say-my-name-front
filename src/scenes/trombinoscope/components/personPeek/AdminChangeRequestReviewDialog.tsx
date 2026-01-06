// AdminChangeRequestReviewDialog.tsx
import React from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Divider,
  Button,
  TextField,
  Alert,
  Collapse,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";

import { useOrgData } from "../../../../contexts/OrgDataContext";
import { ChangeRequestSummary } from "../../../../models/commons/Profile/ChangeRequest";
import { ChangeResolutionDecision } from "../../../../services/dto/admin/change-requests/ChangeResolutionDecision";
import { ResolveChangeRequestDto } from "../../../../services/dto/admin/change-requests/ResolveChangeRequestDto";

import AdminChangeRequestItemCard, { ItemDecision } from "./AdminChangeRequestItemCard";

/* ----------------------------- Types & props ----------------------------- */

type Props = {
  open: boolean;
  /** Peut être null le temps que l'appelant prépare l'état — on no-op dans ce cas */
  cr?: ChangeRequestSummary | null;
  onSubmitResolution: (changeRequestId: number, dto: ResolveChangeRequestDto) => Promise<void> | void;
  onClose: () => void;
};

/* ----------------------------- Helpers ----------------------------- */

function statusColor(status?: string) {
  switch (status) {
    case "PENDING":
      return "warning" as const;
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "error" as const;
    case "CANCELED":
      return "default" as const;
    default:
      return "default" as const;
  }
}

function formatRelative(date?: Date | null): string {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(Math.abs(diffMs) / 60000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.round(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.round(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="caption" sx={{ opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.3 }}>
    {children}
  </Typography>
);

/** Normalisation simple pour contrôle doublons côté UI */
const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleUpperCase();

/** Valeur “cible” d’un item (CREATE/UPDATE) — priorise proposedValue (modèle réel) */
function getRequestedValue(it: any): string | undefined {
  return (
    it?.proposedValue ??
    it?.requestedValue ??
    it?.newValue ??
    it?.valueAfter ??
    it?.value ??
    it?.targetValue ??
    undefined
  );
}

/* ----------------------------- Component ----------------------------- */

const AdminChangeRequestReviewDialog: React.FC<Props> = ({
  open,
  cr,
  onSubmitResolution,
  onClose,
}) => {
  // Si pas de CR, on n’affiche rien (permet un appel simple avec cr nullable)
  if (!cr) return null;

  const { attributes } = useOrgData();
  const attribute = React.useMemo(
    () => attributes.find((a) => a.id === cr.attributeId) ?? null,
    [attributes, cr.attributeId]
  );

  const created = cr.createdAt ? new Date(cr.createdAt) : null;
  const updated = cr.updatedAt ? new Date(cr.updatedAt) : null;

  const attrName = attribute?.name ?? "Attribut";
  const attrType = (attribute as any)?.type ?? null;
  const maxValues =
    (attribute as any)?.maxValues ??
    (attribute as any)?.maxValuesPerPerson ??
    1;

  const items = cr.items ?? [];

  // décisions par item (null = pas décidé, sinon "APPROVE" | "REJECT")
  const [decisions, setDecisions] = React.useState<Record<number, ItemDecision>>({});
  const [comment, setComment] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  // Tooltip copie ID
  const [copyTooltip, setCopyTooltip] = React.useState<string>("Copier l’ID");

  // reset à l’ouverture / changement de CR
  React.useEffect(() => {
    if (!open || !cr) return;
    const initial: Record<number, ItemDecision> = {};
    (cr.items ?? []).forEach((it) => {
      initial[it.id] = null;
    });
    setDecisions(initial);
    setComment("");
    setSubmitting(false);
    setCopyTooltip("Copier l’ID");
  }, [open, cr]);

  const setDecision = (itemId: number, value: ItemDecision) =>
    setDecisions((prev) => ({ ...prev, [itemId]: value }));

  // Pas de CANCEL : décide-tout vers APPROVE ou REJECT
  const decideAll = (value: ChangeResolutionDecision) => {
    const next: Record<number, ItemDecision> = {};
    (cr.items ?? []).forEach((it) => {
      next[it.id] = value;
    });
    setDecisions(next);
  };

  const approvedCount = items.reduce((acc, it) => (decisions[it.id] === "APPROVE" ? acc + 1 : acc), 0);
  const rejectedCount = items.reduce((acc, it) => (decisions[it.id] === "REJECT" ? acc + 1 : acc), 0);
  const pendingCount = Math.max(0, items.length - approvedCount - rejectedCount);
  const allDecided = items.length > 0 && pendingCount === 0;

  /* -------------------- Prévisualisation “état final” -------------------- */

  // Baseline (début de saison) — uniquement l’attribut focus (vient du DTO, paires id+value)
  const baselineList = React.useMemo(() => {
    const pairs = cr.attributePreview?.baselineFutureValues ?? [];
    return pairs
      .map((p: any) => ({ paId: Number(p.id), value: String(p.value ?? "") }))
      .sort((a, b) => String(a.value).localeCompare(String(b.value)));
  }, [cr.attributePreview?.baselineFutureValues]);

  // Appliquer seulement les items APPROUVÉS sur la baseline future
  const finalList = React.useMemo(() => {
    const map = new Map<number, string>(baselineList.map((x) => [x.paId, x.value]));

    for (const it of items) {
      if (decisions[it.id] !== "APPROVE") continue;

      const action = String(it?.action ?? "").toUpperCase();

      if (action === "DELETE") {
        const srcPaId = it?.personAttribute?.id;
        if (srcPaId != null) map.delete(srcPaId);
      } else if (action === "UPDATE") {
        const srcPaId = it?.personAttribute?.id;
        const newVal = getRequestedValue(it);
        if (srcPaId != null && typeof newVal === "string") {
          map.set(srcPaId, newVal);
        }
      } else if (action === "CREATE") {
        const newVal = getRequestedValue(it);
        if (typeof newVal === "string") {
          // id temporaire négatif pour l’affichage
          const tmpId = -Math.floor(Math.random() * 1e9);
          map.set(tmpId, newVal);
        }
      }
    }

    return Array.from(map.entries())
      .map(([paId, value]) => ({ paId, value }))
      .sort((a, b) => String(a.value).localeCompare(String(b.value)));
  }, [items, decisions, baselineList]);

  // Validations (capacité & doublons) sur l’état final projeté
  const finalCount = finalList.length;
  const exceedsCapacity = finalCount > Number(maxValues ?? 1);

  const hasDuplicates = React.useMemo(() => {
    const seen = new Set<string>();
    for (const it of finalList) {
      const key = normalize(it.value);
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }, [finalList]);

  const isFinalStateValid = !exceedsCapacity && !hasDuplicates;

  // Tooltip contextuel du compteur
  const counterTooltip = React.useMemo(() => {
    if (!isFinalStateValid) {
      const parts: string[] = [];
      if (exceedsCapacity) parts.push(`Capacité dépassée (${finalCount}/${maxValues}).`);
      if (hasDuplicates) parts.push("Doublons détectés.");
      return parts.join(" ");
    }
    if (!allDecided) return "Décidez tous les items pour pouvoir valider.";
    return "État final valide.";
  }, [isFinalStateValid, exceedsCapacity, hasDuplicates, finalCount, maxValues, allDecided]);

  // Formatter local — peut être remplacé plus tard par une logique spécifique au type d’attribut
  const formatDisplayValue = React.useCallback(
    (_type: string | null | undefined, value: string) => value,
    []
  );

  const handleSubmit = async () => {
    if (!allDecided || !isFinalStateValid) return;
    setSubmitting(true);
    try {
      const dto: ResolveChangeRequestDto = {
        resolutionComment: comment?.trim() || undefined,
        decisions: items.map((it) => ({
          itemId: it.id,
          decision: decisions[it.id] as ChangeResolutionDecision,
        })),
      };
      await onSubmitResolution(cr.id, dto);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(cr.id));
      setCopyTooltip("Copié !");
    } catch {
      setCopyTooltip("Échec de la copie");
    } finally {
      window.setTimeout(() => setCopyTooltip("Copier l’ID"), 1200);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      {/* ===== Header ===== */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, pr: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.15, wordBreak: "break-word" }}>
            Traiter la demande · <strong>{attrName}</strong>
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, opacity: 0.9, flexWrap: "wrap" }}>
            {/* --- ID (copiable) --- */}
            <Tooltip title={copyTooltip} arrow>
              <Chip
                size="small"
                variant="outlined"
                label={`#${cr.id}`}
                onClick={handleCopyId}
                icon={<ContentCopyRoundedIcon sx={{ fontSize: 14 }} />}
                sx={{ height: 22, cursor: "pointer" }}
              />
            </Tooltip>

            <Chip size="small" color={statusColor(cr.status)} label={cr.status} sx={{ height: 22 }} />

            <Stack direction="row" spacing={0.75} alignItems="center">
              <PersonOutlineRoundedIcon fontSize="small" />
              <Typography variant="caption">{cr.requester?.displayName ?? "—"}</Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeRoundedIcon fontSize="small" />
              <Tooltip
                title={
                  created ? `${created.toLocaleString()}${updated ? ` • maj ${updated.toLocaleString()}` : ""}` : ""
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
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Fermer">
          <span>
            <IconButton size="small" onClick={onClose} aria-label="Fermer" disabled={submitting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </DialogTitle>

      {/* ===== Corps ===== */}
      <DialogContent
        sx={{
          pt: 1,
          pb: 2,
          display: "grid",
          gap: 16 / 8,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gridTemplateAreas: {
            xs: `"preview"
                 "motif"
                 "mods"
                 "comment"`,
            md: `"preview preview"
                 "motif mods"
                 "comment mods"`,
          },
          alignItems: "start",
        }}
      >
        {/* ===== Prévisualisation (une seule ligne, état final futur) ===== */}
        <Box sx={{ gridArea: "preview", minWidth: 0 }}>
          <FieldLabel>État à la prochaine saison (après décisions approuvées)</FieldLabel>

          <Stack spacing={0.75} sx={{ mt: 0.75 }}>
            {/* Ligne unique : compteur + valeurs */}
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
              <Tooltip title={counterTooltip} arrow>
                <Chip
                  size="small"
                  color={isFinalStateValid ? "default" : "error"}
                  variant={isFinalStateValid ? "outlined" : "filled"}
                  label={`${finalCount}/${maxValues}`}
                  sx={{ height: 22 }}
                />
              </Tooltip>

              {finalList.length === 0 ? (
                <Chip size="small" label="(aucune valeur)" />
              ) : (
                finalList.map((x) => (
                  <Chip
                    key={`final-${x.paId}-${normalize(x.value)}`}
                    size="small"
                    label={formatDisplayValue(attrType, x.value)}
                    sx={{ borderRadius: 1.5 }}
                  />
                ))
              )}
            </Stack>

            {/* Alerte compacte conditionnelle */}
            <Collapse in={!isFinalStateValid || !allDecided} unmountOnExit>
              <Alert
                icon={<InfoOutlinedIcon fontSize="small" />}
                severity={!isFinalStateValid ? "error" : "info"}
                variant={!isFinalStateValid ? "filled" : "outlined"}
                sx={{
                  mt: 1,
                  py: 0.75,
                  "& .MuiAlert-message": { fontSize: 13, lineHeight: 1.3 },
                }}
              >
                {!isFinalStateValid ? (
                  <>
                    {finalCount > Number(maxValues ?? 1) && (
                      <span>
                        Capacité dépassée : {finalCount}/{maxValues}. Refusez une création ou acceptez une suppression
                        pour libérer de la place.
                      </span>
                    )}
                    {finalCount > Number(maxValues ?? 1) && hasDuplicates && <br />}
                    {hasDuplicates && <span>Doublons détectés dans l’état final (après normalisation).</span>}
                  </>
                ) : (
                  <>Décidez tous les items pour pouvoir valider.</>
                )}
              </Alert>
            </Collapse>
          </Stack>
        </Box>

        {/* Motif */}
        <Box sx={{ gridArea: "motif", minWidth: 0 }}>
          <FieldLabel>Motif de la demande</FieldLabel>
          <TextField
            value={cr.requestReason || ""}
            placeholder="—"
            fullWidth
            multiline
            minRows={3}
            InputProps={{ readOnly: true }}
            sx={{ mt: 0.5 }}
          />
          <Divider sx={{ mt: 2, opacity: 0.15, display: { xs: "block", md: "none" } }} />
        </Box>

        {/* Modifications */}
        <Box sx={{ gridArea: "mods", minWidth: 0 }}>
          <FieldLabel>Modifications demandées</FieldLabel>

          <Stack spacing={1.25} sx={{ mt: 0.75 }}>
            {items.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Aucun item dans cette demande.
              </Typography>
            ) : (
              items.map((it) => {
                const currentVal = it.personAttribute?.value; // suffisant, vient du DTO
                const decision = decisions[it.id] ?? null;

                return (
                  <AdminChangeRequestItemCard
                    key={it.id}
                    item={it}
                    attribute={attribute ?? null}
                    currentValue={currentVal}
                    decision={decision}
                    onChangeDecision={setDecision}
                    formatDisplayValue={formatDisplayValue}
                  />
                );
              })
            )}
          </Stack>

          {/* Barre globale */}
          {items.length > 0 && (
            <Box sx={{ mt: 1.25, width: "100%" }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1,
                }}
              >
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<ThumbUpAltRoundedIcon />}
                  onClick={() => decideAll("APPROVE")}
                >
                  Tout approuver
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<ThumbDownAltRoundedIcon />}
                  onClick={() => decideAll("REJECT")}
                >
                  Tout rejeter
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* Commentaire de résolution */}
        <Box sx={{ gridArea: "comment", minWidth: 0 }}>
          <FieldLabel>Commentaire de résolution (optionnel)</FieldLabel>
          <TextField
            placeholder="Ajoutez un commentaire visible dans l'historique…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 0.5 }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          position: "sticky",
          bottom: 0,
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          zIndex: 1,
          background: (t) => alpha(t.palette.background.paper, 0.9),
          backdropFilter: "blur(6px)",
        }}
      >
        <Typography variant="body2" sx={{ mr: "auto", opacity: 0.9 }}>
          ✔ {approvedCount} approuvé{approvedCount > 1 ? "s" : ""} • ✖ {rejectedCount} rejeté
          {rejectedCount > 1 ? "s" : ""} • ⏳ {pendingCount} en attente
        </Typography>

        <Button onClick={onClose} disabled={submitting}>
          Fermer
        </Button>
        <span>
          <Button
            variant="contained"
            startIcon={<DoneRoundedIcon />}
            disabled={!allDecided || !isFinalStateValid || submitting}
            onClick={handleSubmit}
          >
            Valider la résolution — {attrName}
          </Button>
        </span>
      </DialogActions>
    </Dialog>
  );
};

export default AdminChangeRequestReviewDialog;
