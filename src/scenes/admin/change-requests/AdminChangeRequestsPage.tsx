// src/scenes/admin/change-requests/AdminChangeRequestsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  TableContainer,
  Paper,
  Skeleton,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

// Chips/Items
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

// Statuts
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import PendingRoundedIcon from "@mui/icons-material/PendingRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

import { useTenantData } from "../../../contexts/TenantDataContext";
import type {
  ChangeRequestSummary,
  ChangeRequestItemSummary,
  ChangeRequestStatus,
} from "../../../models/commons/Profile/ChangeRequest";
import type { ResolveChangeRequestDto } from "../../../services/dto/admin/change-requests";
import {
  listAdminChangeRequests,
  resolveChangeRequest,
} from "../../../services/business/admin/admin.changeRequests.service";

import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AdminChangeRequestReviewDialog from "../../trombinoscope/components/personPeek/AdminChangeRequestReviewDialog";
import type { PersonCardDto } from "../../../services/dto/person/search/PersonCardDtos";
import AdminPersonPeekDialog from "../../trombinoscope/components/admin/AdminPersonPeekDialog";
import { useAdminCRCache } from "../../../contexts/AdminCRCacheContext";

const PAGE_SIZE = 20;

// === Largeurs “forcées” ===
const STATUS_COL_W = 120;
const RESOLVED_BY_COL_W = 220;

// === Skeleton UX ===
const SKELETON_DELAY_MS = 180;
const SKELETON_MIN_VISIBLE_MS = 140;

// --- Tabs UI (2 onglets)
type UITab = "PENDING" | "HISTORY";
const ALLOWED_TABS = new Set<UITab>(["PENDING", "HISTORY"]);
const DEFAULT_TAB: UITab = "PENDING";
function parseTab(param: string | null): UITab | undefined {
  if (!param) return undefined;
  const upper = param.toUpperCase();
  return ALLOWED_TABS.has(upper as UITab) ? (upper as UITab) : undefined;
}

// ---- Helpers
function getAttrName(attrNameById: Map<number, string>, id?: number | null) {
  if (id == null) return "—";
  return attrNameById.get(id) ?? `#${id}`;
}

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

type SortDir = "asc" | "desc";
function parseSortParam(s: string | null): { key: string; dir: SortDir } {
  if (!s) return { key: "createdAt", dir: "desc" };
  const [key, dir] = s.split(",");
  const normKey = key || "createdAt";
  const normDir = dir === "asc" || dir === "desc" ? dir : "desc";
  return { key: normKey, dir: normDir };
}
function makeSortParam(key: string, dir: SortDir) {
  return `${key},${dir}`;
}

/* ---------- Rendu chips des items ---------- */
function decisionColor(
  dec?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED"
): "default" | "success" | "error" | "warning" {
  switch (dec) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "CANCELED":
      return "warning";
    default:
      return "default";
  }
}

function ItemChip({ it }: { it: ChangeRequestItemSummary }) {
  const color = decisionColor(it.decision);
  const common = {
    size: "small" as const,
    color,
    sx: {
      borderRadius: 1.5,
      maxWidth: 240,
      "& .MuiChip-label": {
        maxWidth: 210,
        display: "inline-block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
    title: it.proposedValue ?? it.personAttribute?.value ?? "",
  };

  if (it.action === "CREATE") {
    return <Chip {...common} icon={<AddRoundedIcon />} label={it.proposedValue ?? "(vide)"} />;
  }
  if (it.action === "UPDATE") {
    const from = it.personAttribute?.value ?? "—";
    const to = it.proposedValue ?? "—";
    return <Chip {...common} icon={<EditRoundedIcon />} label={`${from} → ${to}`} />;
  }
  // DELETE
  return (
    <Chip
      {...common}
      icon={<DeleteOutlineRoundedIcon />}
      label={
        <Box component="span" sx={{ textDecoration: "line-through", opacity: 0.8 }}>
          {it.personAttribute?.value ?? "(vide)"}
        </Box>
      }
    />
  );
}

function StatusChip({
  status,
  approved,
  rejected,
}: {
  status: ChangeRequestStatus;
  approved?: number;
  rejected?: number;
}) {
  switch (status) {
    case "PENDING":
      return <Chip size="small" icon={<PendingRoundedIcon />} label="En attente" />;
    case "APPROVED":
      return <Chip size="small" color="success" icon={<TaskAltRoundedIcon />} label="Acceptée" />;
    case "REJECTED":
      return <Chip size="small" color="error" icon={<CancelRoundedIcon />} label="Refusée" />;
    case "PARTIALLY_APPROVED":
      return (
        <Chip
          size="small"
          color="warning"
          icon={<ReportProblemRoundedIcon />}
          label={`Partielle${
            (approved ?? 0) + (rejected ?? 0) > 0 ? ` (✓${approved ?? 0} ✕${rejected ?? 0})` : ""
          }`}
        />
      );
    case "CANCELED":
      return <Chip size="small" icon={<CancelRoundedIcon />} label="Annulée" />;
    default:
      return <Chip size="small" label={status} />;
  }
}

export default function AdminChangeRequestsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query params ↔ état (2 onglets)
  const [tab, setTab] = useState<UITab>(parseTab(searchParams.get("bucket")) ?? DEFAULT_TAB);
  const initialSort = parseSortParam(searchParams.get("sort"));
  const [sortKey, setSortKey] = useState<string>(initialSort.key);
  const [sortDir, setSortDir] = useState<SortDir>(initialSort.dir);
  const [pageIdx, setPageIdx] = useState<number>(
    Math.max(0, (parseInt(searchParams.get("page") || "1", 10) || 1) - 1)
  );
  const [q, setQ] = useState<string>(searchParams.get("q") || "");

  // Données
  const { attributes } = useTenantData();
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [items, setItems] = useState<ChangeRequestSummary[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Peek personne
  const [peekOpen, setPeekOpen] = useState(false);
  const [peekPerson, setPeekPerson] = useState<PersonCardDto | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);

  const routeCrId = params.id ? Number(params.id) : null;

  const { getPendingFirst, setPendingFirst, isFresh } = useAdminCRCache();

  // Map attributs
  const attrNameById = useMemo(() => {
    const map = new Map<number, string>();
    attributes.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [attributes]);

  // ---- Synchronisation URL → état
  useEffect(() => {
    const nextTab = parseTab(searchParams.get("bucket")) ?? DEFAULT_TAB;
    const nextSort = parseSortParam(searchParams.get("sort"));
    const nextPage = Math.max(0, (parseInt(searchParams.get("page") || "1", 10) || 1) - 1);
    const nextQ = searchParams.get("q") || "";

    setTab(nextTab);
    setSortKey(nextSort.key);
    setSortDir(nextSort.dir);
    setPageIdx(nextPage);
    setQ(nextQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // ---- Helpers params
  const setParam = (key: string, value: string | number | null | undefined, options?: { replace?: boolean }) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === "" || (typeof value === "number" && Number.isNaN(value))) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    setSearchParams(next, { replace: options?.replace ?? true });
  };

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => {
      setParam("q", q || null, { replace: true });
      setParam("page", 1, { replace: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Page → URL
  useEffect(() => {
    setParam("page", pageIdx + 1, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx]);

  // Tab/sort → URL
  useEffect(() => {
    setParam("bucket", tab, { replace: true });
    setPageIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    setParam("sort", makeSortParam(sortKey, sortDir), { replace: true });
    setPageIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortDir]);

  // ---- Fetch + pagination clamp
  const fetchPage = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setLoading(true);
    try {
      const resolvedStatuses: ChangeRequestStatus[] =
        tab === "PENDING"
          ? ["PENDING"]
          : ["APPROVED", "PARTIALLY_APPROVED", "REJECTED", "CANCELED"];

      const page = await listAdminChangeRequests({
        statuses: resolvedStatuses,
        page: pageIdx,
        size: PAGE_SIZE,
        sort: makeSortParam(sortKey, sortDir),
        q,
      });

      // Alimente le cache si l'on est précisément sur la 1ʳᵉ page PENDING, tri createdAt desc, sans recherche
      const cacheEligible =
        tab === "PENDING" && pageIdx === 0 && q === "" && sortKey === "createdAt" && sortDir === "desc";
      if (cacheEligible) {
        setPendingFirst({
          content: page.content ?? [],
          totalElements: page.totalElements ?? (page.content?.length ?? 0),
          totalPages: page.totalPages ?? 1,
        });
      }

      const newTotalPages = page.totalPages ?? 0;
      const newTotalElements = page.totalElements ?? 0;

      if (newTotalPages > 0 && pageIdx > newTotalPages - 1) {
        setTotalPages(newTotalPages);
        setTotalElements(newTotalElements);
        setPageIdx(newTotalPages - 1);
        return;
      }
      if (newTotalPages === 0 && pageIdx !== 0) {
        setTotalPages(0);
        setTotalElements(0);
        setPageIdx(0);
        return;
      }

      setItems(page.content);
      setTotalPages(newTotalPages);
      setTotalElements(newTotalElements);
      setLastRefreshedAt(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Eligibilité cache (PENDING / page 1 / search vide / tri createdAt desc)
  const cacheEligible = useMemo(
    () => tab === "PENDING" && pageIdx === 0 && q === "" && sortKey === "createdAt" && sortDir === "desc",
    [tab, pageIdx, q, sortKey, sortDir]
  );

  useEffect(() => {
    if (cacheEligible) {
      const cached = getPendingFirst();
      if (cached?.page) {
        // Hydrate depuis le cache pour éviter le skeleton et le "jump"
        setItems(cached.page.content);
        setTotalPages(cached.page.totalPages);
        setTotalElements(cached.page.totalElements);
        setLoading(false);
        // Refresh silencieux si périmé
        if (!isFresh(cached)) fetchPage({ silent: true });
        return;
      }
    }
    // Cas général (ou pas de cache): fetch normal
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, tab, sortKey, sortDir, q, cacheEligible]);

  // Raccourci clavier minimal : R (refresh)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      const typing =
        !!tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.tagName === "SELECT" ||
          (tgt as any).isContentEditable);
      if (typing) return;

      if (e.key.toLowerCase() === "r") {
        fetchPage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crFromList = useMemo(
    () => (routeCrId ? items.find((x) => x.id === routeCrId) ?? null : null),
    [routeCrId, items]
  );

  /* ========== Navigation modale Review via URL ========== */
  const openReview = (cr: ChangeRequestSummary) => {
    navigate(`/admin/change-requests/${cr.id}${location.search}`, { state: { background: location } });
  };
  const closeReview = () => {
    navigate(`/admin/change-requests${location.search}`, { replace: true });
  };
  const handleSubmitResolution = async (changeRequestId: number, dto: ResolveChangeRequestDto) => {
    await resolveChangeRequest(changeRequestId, dto);
    fetchPage();
    closeReview();
  };

  /* ========== Handlers fiche (peek) ========== */
  const toPersonCard = (cr: ChangeRequestSummary): PersonCardDto | null => {
    if (!cr.personId) return null;
    const pc: Partial<PersonCardDto> = {
      idPerson: cr.personId,
      displayName: cr.personSummary?.displayName ?? `#${cr.personId}`,
      photoSmallUrl: cr.personSummary?.photoUrl,
      photoLargeUrl: cr.personSummary?.photoUrl,
    };
    return pc as PersonCardDto;
  };

  const openPeek = (cr: ChangeRequestSummary) => {
    const p = toPersonCard(cr);
    if (!p) return;
    setPeekPerson(p);
    setPeekOpen(true);
  };

  const closePeek = () => {
    setPeekOpen(false);
    setPeekPerson(null);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const handleTabChange = (_: any, value: UITab) => {
    setTab(value);
  };

  // Toggle global pour trier par date de création
  const toggleCreatedAtSort = () => {
    if (sortKey !== "createdAt") {
      setSortKey("createdAt");
      setSortDir("desc");
    } else {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const handleSortDirChange = (_: any, value: SortDir | null) => {
    if (!value) return;
    if (sortKey !== "createdAt") setSortKey("createdAt");
    setSortDir(value);
  };

  // === Gestion du skeleton no-flash ===
  const [showSkeleton, setShowSkeleton] = useState(false);
  const showTimer = useRef<number | null>(null);
  const startTs = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      if (showTimer.current) window.clearTimeout(showTimer.current);
      showTimer.current = window.setTimeout(() => {
        setShowSkeleton(true);
        startTs.current = performance.now?.() ?? Date.now();
      }, SKELETON_DELAY_MS);
    } else {
      if (showTimer.current) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      if (showSkeleton) {
        const now = performance.now?.() ?? Date.now();
        const elapsed = now - (startTs.current ?? now);
        if (elapsed < SKELETON_MIN_VISIBLE_MS) {
          const left = SKELETON_MIN_VISIBLE_MS - elapsed;
          window.setTimeout(() => setShowSkeleton(false), left);
        } else {
          setShowSkeleton(false);
        }
      } else {
        setShowSkeleton(false);
      }
    }
    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current);
    };
  }, [loading, showSkeleton]);

  const clearSearch = () => setQ("");

  const renderLastUpdated = () => {
    if (!lastRefreshedAt) return null;
    return (
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        Dernière màj&nbsp;: {lastRefreshedAt.toLocaleTimeString()}
      </Typography>
    );
  };

  const totalCountText = `${totalElements}`;
  const isPending = tab === "PENDING";
  const modifsColLabel = isPending ? "Valeurs (si approuvée)" : "Décisions & valeurs";

  // === En-tête ===
  const Head = (
    <TableHead>
      <TableRow>
        <TableCell sx={{ minWidth: 220, py: 1.25 }}>Personne</TableCell>
        <TableCell sx={{ py: 1.25 }}>Attribut</TableCell>
        <TableCell sx={{ minWidth: 260, py: 1.25 }}>{modifsColLabel}</TableCell>
        <TableCell sx={{ minWidth: 180, py: 1.25 }}>Motif</TableCell>
        <TableCell sx={{ minWidth: 140, py: 1.25 }}>Demandeur</TableCell>
        {/* Libellé simple : on n'utilise plus TableSortLabel */}
        <TableCell sx={{ py: 1.25 }}>Créée</TableCell>
        {tab === "HISTORY" && (
          <TableCell
            sx={{ width: RESOLVED_BY_COL_W, minWidth: RESOLVED_BY_COL_W, maxWidth: RESOLVED_BY_COL_W, py: 1.25 }}
          >
            Traité par
          </TableCell>
        )}
        <TableCell sx={{ width: STATUS_COL_W, minWidth: STATUS_COL_W, maxWidth: STATUS_COL_W, py: 1.25 }}>
          Statut
        </TableCell>
      </TableRow>
    </TableHead>
  );

  return (
    <Box sx={{ width: "100%", flex: 1, minWidth: 0 }}>
      {/* Top bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        {/* Titre + compteur */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
          <Typography variant="h6">Change Requests</Typography>
          <Chip size="small" label={totalCountText} />
        </Stack>

        {/* Recherche + Tri global */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 380, maxWidth: 900 }}>
          <TextField
            inputRef={searchRef}
            fullWidth
            size="small"
            placeholder="Rechercher (#id, personne, attribut, valeur, requester, motif)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
              }
              if (e.key === "Escape") clearSearch();
            }}
          />

          {/* Contrôle de tri global */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            <Typography variant="body2" color="text.secondary">
              Tri&nbsp;:
            </Typography>
            <ToggleButtonGroup
              value={sortKey === "createdAt" ? sortDir : "desc"}
              exclusive
              size="small"
              onChange={handleSortDirChange}
              aria-label="Trier par date de création"
            >
              <ToggleButton value="desc" aria-label="Récents d’abord" title="Récents d’abord" onDoubleClick={toggleCreatedAtSort}>
                Récents
              </ToggleButton>
              <ToggleButton value="asc" aria-label="Anciens d’abord" title="Anciens d’abord" onDoubleClick={toggleCreatedAtSort}>
                Anciens
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {q ? (
            <Tooltip title="Effacer la recherche (Échap)">
              <Button variant="outlined" size="small" onClick={clearSearch} sx={{ flexShrink: 0 }}>
                Effacer
              </Button>
            </Tooltip>
          ) : null}
          <Tooltip title="Rafraîchir (R)">
            <IconButton onClick={() => fetchPage()} aria-label="Rafraîchir la liste" sx={{ flexShrink: 0 }}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
          {renderLastUpdated()}
        </Stack>
      </Stack>

      {/* Onglets */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="Filtrer par statut"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ minHeight: 36 }}
        >
          <Tab value="PENDING" label="En attente" sx={{ minHeight: 36 }} />
          <Tab value="HISTORY" label="Traitées" sx={{ minHeight: 36 }} />
        </Tabs>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          position: "relative",
          minHeight: 320,
          borderRadius: 2,
          border: (t) => `1px solid ${t.palette.divider}`,
          width: "100%",
          maxHeight: "60vh",
        }}
      >
        {showSkeleton && items.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Table size="small" stickyHeader>
              {Head}
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Skeleton width={180} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={120} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Skeleton width="80%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Skeleton width={160} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Skeleton width={140} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    {tab === "HISTORY" && (
                      <TableCell sx={{ width: RESOLVED_BY_COL_W }}>
                        <Skeleton width={160} />
                      </TableCell>
                    )}
                    <TableCell sx={{ width: STATUS_COL_W }}>
                      <Skeleton width={90} height={28} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : items.length === 0 && !loading ? (
          // EMPTY STATES
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8, px: 2, textAlign: "center" }} spacing={2}>
            <Box sx={{ fontSize: 0, lineHeight: 0, opacity: 0.8 }}>
              {totalElements === 0 ? (
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 56 }} />
              ) : (
                <SearchOffRoundedIcon sx={{ fontSize: 56 }} />
              )}
            </Box>
            <Typography variant="h6">
              {totalElements === 0 ? "Aucune change request à afficher 🎉" : `Aucun résultat pour « ${q} »`}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {totalElements === 0 ? (
                <Button variant="outlined" onClick={() => fetchPage()} startIcon={<RefreshRoundedIcon />}>
                  Rafraîchir
                </Button>
              ) : (
                <>
                  <Button variant="contained" onClick={() => setQ("")}>
                    Effacer la recherche
                  </Button>
                  <Button variant="text" onClick={() => fetchPage()} startIcon={<RefreshRoundedIcon />}>
                    Rafraîchir
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        ) : (
          // ===== TABLE (résultats) =====
          <Box sx={{ px: 2, py: 2 }}>
            <Table size="small" stickyHeader aria-label="Liste des change requests">
              {Head}

              <TableBody>
                {items.map((cr) => {
                  const attrName = getAttrName(attrNameById, cr.attributeId);
                  const displayName = cr.personSummary?.displayName || "—";
                  const photoUrl = cr.personSummary?.photoUrl;
                  const finalApproved = cr.attributePreview?.finalIfApproved ?? null;
                  const reason = cr.requestReason ?? null;

                  const absoluteDate = new Date(cr.createdAt).toLocaleString();
                  const relativeDate = formatRelativeDate(cr.createdAt);

                  const approvedCount = cr.resolutionSummary?.approvedItems ?? undefined;
                  const rejectedCount = cr.resolutionSummary?.rejectedItems ?? undefined;

                  const renderModifs = () => {
                    if (isPending) {
                      return (
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                          {(finalApproved ?? []).slice(0, 4).map((v, i) => (
                            <Chip
                              key={`${cr.id}-fin-${i}`}
                              size="small"
                              label={v}
                              sx={{ borderRadius: 1.5, maxWidth: 220 }}
                              onClick={stop as any}
                            />
                          ))}
                          {(finalApproved ?? []).length > 4 && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`+${finalApproved!.length - 4}`}
                              onClick={stop as any}
                            />
                          )}
                          {(!finalApproved || finalApproved.length === 0) && (
                            <Chip size="small" label="(aucune valeur)" onClick={stop as any} />
                          )}
                        </Stack>
                      );
                    }
                    // Traitées
                    return (
                      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                        {(cr.items ?? []).map((it) => (
                          <ItemChip key={it.id} it={it} />
                        ))}
                        {(!cr.items || cr.items.length === 0) && (
                          <Typography variant="body2" color="text.disabled">
                            (aucun item)
                          </Typography>
                        )}
                      </Stack>
                    );
                  };

                  const renderResolvedBy = () => {
                    if (tab !== "HISTORY") return null;
                    const by = cr.resolvedBy?.displayName ?? "—";
                    const atRel = cr.resolvedAt ? formatRelativeDate(cr.resolvedAt) : null;
                    const atAbs = cr.resolvedAt ? new Date(cr.resolvedAt).toLocaleString() : "";
                    const comment = cr.resolutionComment || "";
                    const hasExtra = Boolean(comment || atAbs);

                    const content = (
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap title={by}>
                          {by}
                        </Typography>
                        {atRel ? (
                          <Typography variant="caption" color="text.secondary" noWrap title={atAbs}>
                            {atRel}
                          </Typography>
                        ) : null}
                      </Box>
                    );

                    return hasExtra ? (
                      <Tooltip title={`${comment ? `Commentaire : ${comment}\n` : ""}${atAbs}`}>
                        {content}
                      </Tooltip>
                    ) : (
                      content
                    );
                  };

                  return (
                    <TableRow
                      key={cr.id}
                      hover
                      onClick={() => openReview(cr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openReview(cr);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ouvrir la modale de traitement pour ${displayName}`}
                      sx={{
                        cursor: "pointer",
                        "&:focus": (t) => ({ outline: `2px solid ${t.palette.primary.main}`, outlineOffset: -2 }),
                      }}
                    >
                      {/* Personne */}
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Tooltip title="Ouvrir la fiche personne" arrow>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{
                              cursor: cr.personId ? "pointer" : "default",
                              "&:hover .person-name": { textDecoration: cr.personId ? "underline" : "none" },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              cr.personId && openPeek(cr);
                            }}
                            role={cr.personId ? "button" : undefined}
                            aria-label={cr.personId ? `Ouvrir la fiche de ${displayName}` : undefined}
                          >
                            <Avatar src={photoUrl} sx={{ width: 28, height: 28 }}>
                              {(displayName || " ")[0]}
                            </Avatar>
                            <Typography
                              className="person-name"
                              variant="body2"
                              noWrap
                              title={displayName}
                              sx={{ flex: 1, minWidth: 0 }}
                            >
                              {displayName}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      </TableCell>

                      <TableCell>{attrName}</TableCell>

                      {/* Colonne dynamique */}
                      <TableCell sx={{ maxWidth: 420 }}>{renderModifs()}</TableCell>

                      {/* Motif */}
                      <TableCell sx={{ maxWidth: 260 }}>
                        {reason ? (
                          <Tooltip title={reason}>
                            <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
                              {reason}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            (aucun)
                          </Typography>
                        )}
                      </TableCell>

                      {/* Demandeur */}
                      <TableCell>{cr.requester?.displayName ?? "—"}</TableCell>

                      {/* Créée */}
                      <TableCell title={absoluteDate}>
                        <Typography variant="body2" color="text.secondary">
                          {relativeDate}
                        </Typography>
                      </TableCell>

                      {/* Traité par (HISTORY) */}
                      {tab === "HISTORY" && <TableCell sx={{ width: RESOLVED_BY_COL_W }}>{renderResolvedBy()}</TableCell>}

                      {/* Statut */}
                      <TableCell sx={{ width: STATUS_COL_W }}>
                        <StatusChip status={cr.status as ChangeRequestStatus} approved={approvedCount} rejected={rejectedCount} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Stack direction="row" justifyContent="center" mt={2}>
              <Pagination
                page={(pageIdx ?? 0) + 1}
                onChange={(_, p) => setPageIdx(p - 1)}
                count={Math.max(totalPages, 1)}
                color="primary"
                size="small"
              />
            </Stack>
          </Box>
        )}
      </TableContainer>

      {/* ===== Modale de traitement ===== */}
      <AdminChangeRequestReviewDialog
        open={Boolean(routeCrId)}
        cr={crFromList ?? null}
        onSubmitResolution={handleSubmitResolution}
        onClose={closeReview}
      />

      {/* ===== Fiche personne ===== */}
      <AdminPersonPeekDialog open={peekOpen} person={peekPerson} onClose={closePeek} />
    </Box>
  );
}
