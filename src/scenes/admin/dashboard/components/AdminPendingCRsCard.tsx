// src/scenes/admin/dashboard/components/AdminPendingCRsCard.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PendingRoundedIcon from "@mui/icons-material/PendingRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";

import { useLocation, useNavigate } from "react-router-dom";
import { listAdminChangeRequests } from "../../../../services/business/admin/admin.changeRequests.service";
import type { ChangeRequestSummary, ChangeRequestStatus } from "../../../../models/commons/Profile/ChangeRequest";
import { useTenantData } from "../../../../contexts/TenantDataContext";
import { useAdminCRCache } from "../../../../contexts/AdminCRCacheContext";

// UI: estimation de hauteur pour le 1er rendu (évite le jump avant mesure)
const PAGE_SIZE = 5;
const ESTIMATED_ROW_H = 56;               // ~ dense ListItemButton avec avatar + 2 lignes
const ESTIMATED_DIVIDER_H = 1;
const ESTIMATED_LIST_H = ESTIMATED_ROW_H * PAGE_SIZE + ESTIMATED_DIVIDER_H * (PAGE_SIZE - 1);

type CRPage = {
  content: ChangeRequestSummary[];
  totalElements: number;
  totalPages: number;
};

function formatRelativeDate(dateLike: string | number | Date) {
  try {
    const d = new Date(dateLike);
    const diffMs = d.getTime() - Date.now();
    const abs = Math.abs(diffMs);
    const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

    const sec = Math.round(abs / 1000);
    if (sec < 60) return rtf.format(Math.round(diffMs / 1000), "second");

    const min = Math.round(abs / (60 * 1000));
    if (min < 60) return rtf.format(Math.round(diffMs / (60 * 1000)), "minute");

    const hrs = Math.round(abs / (60 * 60 * 1000));
    if (hrs < 24) return rtf.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");

    const days = Math.round(abs / (24 * 60 * 60 * 1000));
    if (days < 30) return rtf.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");

    const months = Math.round(days / 30);
    if (months < 12) return rtf.format(Math.round((diffMs / (24 * 60 * 60 * 1000)) / 30), "month");

    return rtf.format(Math.round(((diffMs / (24 * 60 * 60 * 1000)) / 30) / 12), "year");
  } catch {
    return "";
  }
}

function StatusChipMini({ status }: { status: ChangeRequestStatus }) {
  switch (status) {
    case "PENDING":
      return <Chip size="small" icon={<PendingRoundedIcon />} label="En attente" />;
    case "APPROVED":
      return <Chip size="small" color="success" icon={<TaskAltRoundedIcon />} label="Acceptée" />;
    case "REJECTED":
      return <Chip size="small" color="error" icon={<CancelRoundedIcon />} label="Refusée" />;
    case "PARTIALLY_APPROVED":
      return <Chip size="small" color="warning" icon={<ReportProblemRoundedIcon />} label="Partielle" />;
    case "CANCELED":
      return <Chip size="small" icon={<CancelRoundedIcon />} label="Annulée" />;
    default:
      return <Chip size="small" label={status} />;
  }
}

export default function AdminPendingCRsCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { attributes } = useTenantData();

  const { getPendingFirst, setPendingFirst, isFresh, getReservedHeight, setReservedHeight } = useAdminCRCache();

  // Mapping attributeId → name via GlobalDataContext
  const attrNameById = useMemo(() => {
    const m = new Map<number, string>();
    attributes.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [attributes]);

  const [loading, setLoading] = useState<boolean>(true); // charge visible (non-silencieux)
  const [page, setPage] = useState<CRPage | null>(null);

  // Hauteur réservée (évite le layout shift quand loading bascule)
  const cachedReserved = getReservedHeight();
  const [reservedH, setReservedH] = useState<number>(cachedReserved ?? ESTIMATED_LIST_H);

  // Réf pour mesurer la hauteur réelle de la liste une fois rendue
  const listWrapRef = useRef<HTMLDivElement | null>(null);

  const pull = async ({ silent }: { silent: boolean }) => {
    if (!silent) setLoading(true);
    try {
      const data = await listAdminChangeRequests({
        statuses: ["PENDING"],
        page: 0,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
      });

      const next: CRPage = {
        content: data.content ?? [],
        totalElements: data.totalElements ?? (data.content?.length ?? 0),
        totalPages: data.totalPages ?? 1,
      };

      setPage(next);
      setPendingFirst(next);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Premier montage : utiliser cache si présent, sinon fetch
  useEffect(() => {
    const cached = getPendingFirst();
    if (cached?.page) {
      setPage(cached.page);
      setLoading(false); // affiche direct le contenu du cache
      // Refresh silencieux si stale
      if (!isFresh(cached)) {
        pull({ silent: true });
      }
    } else {
      // 1er chargement : fetch visible (affiche skeleton overlay sur hauteur réservée)
      pull({ silent: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mesure de la hauteur réelle pour verrouiller la taille au prochain refresh
  useLayoutEffect(() => {
    if (!loading && listWrapRef.current) {
      const h = listWrapRef.current.offsetHeight;
      if (h && Math.abs(h - reservedH) > 1) {
        setReservedH(h);
        setReservedHeight(h); // persist dans le cache pour les prochains montages
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, page?.content?.length]);

  const items = page?.content ?? [];
  const total = page?.totalElements ?? 0;
  const moreCount = Math.max(0, total - items.length);

  const goToAll = () => {
    // La page CR pourra plus tard relire le cache via le provider (aucun changement requis ici)
    navigate(`/admin/change-requests?bucket=PENDING&sort=createdAt,desc&page=1`, {
      state: { fromDashboard: true },
    });
  };

  return (
    <Card aria-busy={loading ? "true" : "false"}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Change Requests en attente</Typography>
            {!loading && <Chip size="small" label={total} />}
          </Stack>
        }
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Rafraîchir">
              <span>
                <IconButton onClick={() => pull({ silent: false })} disabled={loading} aria-label="Rafraîchir la liste">
                  <RefreshRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button onClick={goToAll} size="small" variant="outlined">
              Voir tout
            </Button>
          </Stack>
        }
        sx={{ pb: 0.5 }}
      />

      <CardContent sx={{ pt: 1.5 }}>
        {/* Réservation de hauteur pour éviter les sauts : minHeight fixe + overlay */}
        <Box sx={{ position: "relative", minHeight: Math.max(ESTIMATED_LIST_H, reservedH) }}>
          {/* Contenu (liste) */}
          {!loading && items.length > 0 && (
            <Box ref={listWrapRef}>
              <List disablePadding>
                {items.map((cr, idx) => {
                  const displayName = cr.personSummary?.displayName ?? "—";
                  const photoUrl = cr.personSummary?.photoUrl;
                  const createdRel = formatRelativeDate(cr.createdAt);

                  const attributeLabel =
                    cr.attributeId != null
                      ? attrNameById.get(cr.attributeId) ?? `#${cr.attributeId}`
                      : "—";

                  const secondary = cr.requestReason ? `« ${cr.requestReason} »` : undefined;

                  return (
                    <React.Fragment key={cr.id}>
                      <ListItemButton
                        dense
                        onClick={() =>
                          navigate(`/admin/change-requests/${cr.id}?bucket=PENDING&sort=createdAt,desc&page=1`, {
                            state: { background: location },
                          })
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={photoUrl} sx={{ width: 28, height: 28 }}>
                            {(displayName || " ")[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1} useFlexGap>
                              <Typography variant="body2" noWrap sx={{ minWidth: 0, flex: 1 }} title={displayName}>
                                {displayName}
                              </Typography>
                              <StatusChipMini status={cr.status as ChangeRequestStatus} />
                            </Stack>
                          }
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="baseline">
                              <Typography variant="caption" color="text.secondary" noWrap title={attributeLabel}>
                                {attributeLabel}
                              </Typography>
                              {secondary && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ opacity: 0.85 }}
                                  noWrap
                                  title={cr.requestReason ?? ""}
                                >
                                  {secondary}
                                </Typography>
                              )}
                              <Box sx={{ flex: 1 }} />
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                title={new Date(cr.createdAt).toLocaleString()}
                              >
                                {createdRel}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>
                      {idx < items.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>

              {moreCount > 0 && (
                <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
                  <Button size="small" onClick={goToAll}>
                    Voir les {moreCount} restantes
                  </Button>
                </Stack>
              )}
            </Box>
          )}

          {/* Empty state (sans bouger la card grâce à minHeight) */}
          {!loading && items.length === 0 && (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Aucune CR en attente 🎉
              </Typography>
              <Button size="small" onClick={goToAll}>Ouvrir la page</Button>
            </Stack>
          )}

          {/* SQUELETTE EN OVERLAY (ne change pas la hauteur) */}
          {loading && (
            <Box
              role="progressbar"
              aria-label="Chargement des change requests"
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              <Stack spacing={1}>
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="40%" />
                      <Skeleton width="24%" />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
