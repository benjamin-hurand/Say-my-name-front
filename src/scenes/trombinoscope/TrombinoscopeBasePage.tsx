import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import SearchIcon from "@mui/icons-material/Search";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";

import {
  Alert, Badge, Box, Button, Chip, CircularProgress,
  FormControl, IconButton, MenuItem, Pagination, Select,
  Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip,
  Typography, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useTenantData } from "../../contexts/TenantDataContext";
import { usePersonsDirectory } from "../../contexts/PersonsDirectoryContext";
import { AdminPersonCardDto, PersonAttributeExtraDto, PersonCardDto, PersonCardStub } from "../../services/dto/person/search/PersonCardDtos";
import { AttributeFilterDto } from "../../services/dto/person/search/PersonSearchRequestDto";

import { AttributeChanges } from "../../models/commons/Profile/AttributesChanges";
import AdminPersonEditDialog from "../../scenes/admin/persons/AdminPersonEditDialog";
import { isEmptyChanges, updateManyPersonAttributesForAdmin } from "../../services/business/admin/admin.service";
import { getPersonAttributesById } from "../../services/business/persons/person.service";
import {
  bulkFollowBySearch, bulkSubscribe, bulkUnfollowBySearch, bulkUnsubscribe,
} from "../../services/business/subscriptions/subscriptions.service";
import ConfirmDialog from "../../components/commons/dialogs/ConfirmDialog";
import ErrorBanner from "./components/ErrorBanner";
import { mapLiteToExtra } from "./components/personPeek/utils";
import PersonPeekDialog from "./components/PersonPeekDialog";
import PersonPeekDrawer from "./components/PersonPeekDrawer";
import SelectionToolbar from "./components/SelectionToolbar";
import TrombiFilters from "./components/TrombiFilters";
import TrombiGrid from "./components/TrombiGrid";
import TrombiSorts from "./components/TrombiSorts";
import TrombiTable from "./components/TrombiTable";
import {
  DEBOUNCE_MS, DEFAULT_PAGE_SIZE,
  INFINITE_SCROLL,
  MIN_SPINNER_MS
} from "./constants";
import useDebouncedValue from "./hooks/useDebouncedValue";
import useFollowOptimistic from "./hooks/useFollowOptimistic";
import useSelection from "./hooks/useSelection";
import { SortValue } from "./types";
import { buildSearchBody } from "./utils/personSearch";
import AdminPersonPeekDialog from "./components/admin/AdminPersonPeekDialog";

type FollowFilter = "all" | "followed" | "unfollowed";
type ViewMode = "grid" | "table";

export interface TrombinoscopeBaseProps {
  hideFollowFeatures?: boolean;
  sessionKeyPrefix: string;
}

const TrombinoscopeBasePage: React.FC<TrombinoscopeBaseProps> = ({
  hideFollowFeatures = false,
  sessionKeyPrefix,
}) => {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));
  const downMd = useMediaQuery(theme.breakpoints.down("md"));

  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();

  // Contexte : admin si hideFollowFeatures === true (comme tu le passes dans PersonAdminPage)
  const basePath = hideFollowFeatures ? "/admin/persons" : "/trombinoscope";

  const { attributes, filters, sorts } = useTenantData();
  const {
    items, totalPages, totalElements, loading, error,
    pageSize, currentPage, search, goto, setPageSize,
    refreshFollowed, isFollowed,
  } = usePersonsDirectory();

  // ---------- UI state ----------
  const [text, setText] = useState("");
  const [followFilter, setFollowFilter] = useState<FollowFilter>("all");
  const [selectedFilters, setSelectedFilters] = useState<Record<number, { op: AttributeFilterDto["operator"]; values: string[] }>>({});
  const [selectedSort, setSelectedSort] = useState<SortValue | undefined>(undefined);

  // ---------- View mode ----------
  const viewKey = `${sessionKeyPrefix}_view`;
  const [view, setView] = useState<ViewMode>(() => {
    const saved = sessionStorage.getItem(viewKey);
    return saved === "table" || saved === "grid" ? saved : "grid";
  });
  const handleViewChange = (_: any, next: ViewMode | null) => {
    if (!next) return;
    setView(next);
    sessionStorage.setItem(viewKey, next);
  };

  // ---------- panneaux ----------
  const filtersUserKey = `${sessionKeyPrefix}_filters_user`;
  const sortsUserKey = `${sessionKeyPrefix}_sorts_user`;

  const [filtersUserWantsOpen, setFiltersUserWantsOpen] = useState<boolean>(() => sessionStorage.getItem(filtersUserKey) === "1");
  const [filtersOpen, setFiltersOpen] = useState(filtersUserWantsOpen);
  useEffect(() => { sessionStorage.setItem(filtersUserKey, filtersUserWantsOpen ? "1" : "0"); }, [filtersUserWantsOpen, filtersUserKey]);

  const [sortsUserWantsOpen, setSortsUserWantsOpen] = useState<boolean>(() => sessionStorage.getItem(sortsUserKey) === "1");
  const [sortsOpen, setSortsOpen] = useState(sortsUserWantsOpen);
  useEffect(() => { sessionStorage.setItem(sortsUserKey, sortsUserWantsOpen ? "1" : "0"); }, [sortsUserWantsOpen, sortsUserKey]);

  const toggleFilters = () => setFiltersUserWantsOpen(prev => { const n = !prev; setFiltersOpen(n); return n; });
  const toggleSorts = () => setSortsUserWantsOpen(prev => { const n = !prev; setSortsOpen(n); return n; });

  // ---------- Debounce ----------
  const debouncedText = useDebouncedValue(text, DEBOUNCE_MS);

  // ---------- Accumulateur ----------
  const [accItems, setAccItems] = useState<PersonCardDto[]>([]);
  const listToRender: PersonCardDto[] = (INFINITE_SCROLL ? accItems : (items as PersonCardDto[]));

  // ---------- Sélection ----------
  const {
    selectedIds, selectAllResults, excludedIds, selectionCount,
    setSelectedIds, setSelectAllResults, setExcludedIds,
    clearSelection, toggleSelect,
  } = useSelection(totalElements ?? 0);
  const [selectionMode, setSelectionMode] = useState(false);
  const selectionVisible = selectionMode || selectionCount > 0;

  const [hasShownSelectionHint, setHasShownSelectionHint] = useState(false);

  // ---------- Peek ----------
  const [peek, setPeek] = useState<PersonCardDto | null>(null);

  const [editTarget, setEditTarget] = useState<PersonCardDto | null>(null);
  const [editExtras, setEditExtras] = useState<PersonAttributeExtraDto[]>([]);
  const [saving, setSaving] = useState(false);

  const isPersonCardStub = (p: PersonCardDto | PersonCardStub): p is PersonCardStub => {
    // Heuristique simple : un stub n'a pas primaryAttributes/extraAttributes
    return (p as any).primaryAttributes === undefined && (p as any).extraAttributes === undefined;
  };

  // Adapte (PersonCardDto | PersonCardStub) -> void, et délègue à openEdit(PersonCardDto)
  const handleEditFromPeek = (person: PersonCardDto | PersonCardStub) => {
    void (async () => {
      if (isPersonCardStub(person)) {
        // 1) Essaye de retrouver le DTO complet dans la liste courante
        const found = (items as PersonCardDto[]).find(it => it.idPerson === person.idPerson);

        // 2) Sinon, synthétise un AdminPersonCardDto minimal (openEdit récupère de toute façon les extras ensuite)
        const dto: PersonCardDto = found ?? ({
          idPerson: person.idPerson,
          displayName: person.displayName,
          photoSmallUrl: person.photoSmallUrl ?? null,
          photoLargeUrl: person.photoLargeUrl ?? null,
          primaryAttributes: [],
          extraAttributes: [],
          emailStatus: "NONE",
          hasPendingChangeRequests: false, // on choisit la variante Admin*
        } as AdminPersonCardDto);

        await openEdit(dto);
      } else {
        await openEdit(person); // déjà un PersonCardDto
      }
    })();
  };

  // ouvrir
  const openEdit = async (p: PersonCardDto) => {
    setEditTarget(p);
    // récupère les extras complets pour avoir id/value par attribut
    try {
      const raw = await getPersonAttributesById(p.idPerson);
      setEditExtras(mapLiteToExtra(raw));
    } catch {
      setEditExtras(p.extraAttributes ?? []); // fallback
    }
  };

  // fermer
  const closeEdit = () => {
    setEditTarget(null);
    setEditExtras([]);
  };

  // submit
  const onSubmitMany = async (changesByAttr: Record<number, AttributeChanges>) => {
    if (!editTarget) return;

    // prune local avant réseau
    const pruned = Object.fromEntries(
      Object.entries(changesByAttr).filter(([, ch]) => !isEmptyChanges(ch))
    ) as Record<number, AttributeChanges>;

    // si rien à envoyer, on ferme direct
    if (Object.keys(pruned).length === 0) {
      closeEdit();
      return;
    }

    setSaving(true);
    try {
      await updateManyPersonAttributesForAdmin(editTarget.idPerson, pruned);
      // refresh la page courante
      await search(body, currentPage ?? 0, pageSize || DEFAULT_PAGE_SIZE);
      closeEdit();
      // (optionnel) snackbar “modifications enregistrées”
    } finally {
      setSaving(false);
    }
  };

  // ---------- Suivis ----------
  useEffect(() => {
    if (!hideFollowFeatures) {
      refreshFollowed();
    }
  }, []);
  const { overrides: followOverrides, pending: followPending, toggle: onToggleFollowOptimistic } =
    useFollowOptimistic(refreshFollowed);

  // ---------- Corps recherche ----------
  const effectiveFollowFilter: FollowFilter = hideFollowFeatures ? "all" : followFilter;
  const body = useMemo(
    () => buildSearchBody({ text: debouncedText, followFilter: effectiveFollowFilter, selectedFilters, selectedSort }),
    [debouncedText, effectiveFollowFilter, selectedFilters, selectedSort]
  );
  useEffect(() => { search(body, 0, pageSize || DEFAULT_PAGE_SIZE); /* eslint-disable-next-line */ }, [body]);

  const hasMore = useMemo(() => (currentPage ?? 0) + 1 < (totalPages ?? 0), [currentPage, totalPages]);

  // --- Infinite Scroll Observer ---
  useEffect(() => {
    if (!INFINITE_SCROLL) return;
    const rootEl = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!rootEl || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          goto((currentPage ?? 0) + 1);
        }
      },
      {
        root: rootEl, // très important : on observe le scrollRef
        rootMargin: "200px", // préchargement à ~200px avant le bas
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, currentPage, goto]);


  useEffect(() => {
    if (!INFINITE_SCROLL) return;
    setAccItems([]);
    clearSelection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, effectiveFollowFilter, selectedFilters, selectedSort]);

  useEffect(() => {
    if (!INFINITE_SCROLL) return;
    setAccItems(prev => {
      if ((currentPage ?? 0) === 0) return [...items] as PersonCardDto[];
      const merged = [...prev, ...(items as PersonCardDto[])];
      const seen = new Set<number>();
      return merged.filter(p => { const id = (p as PersonCardDto).idPerson; if (seen.has(id)) return false; seen.add(id); return true; });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, currentPage]);

  // ---------- Page size ----------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const handlePageSizeChange = async (n: number) => {
    await setPageSize(n);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- Loader UX ----------
  const [showLoader, setShowLoader] = useState(false);
  const loaderStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) {
      if (!showLoader) { setShowLoader(true); loaderStartRef.current = performance.now?.() ?? Date.now(); }
    } else if (showLoader) {
      const now = performance.now?.() ?? Date.now();
      const elapsed = now - (loaderStartRef.current ?? now);
      if (elapsed < MIN_SPINNER_MS) {
        const t = setTimeout(() => setShowLoader(false), MIN_SPINNER_MS - elapsed);
        return () => clearTimeout(t);
      } else setShowLoader(false);
    }
  }, [loading, showLoader]);

  // ---------- Auto close/open ----------
  const prevScrollTopRef = useRef(0);
  const CLOSE_DELTA = 12;
  const MIN_SCROLLTOP_TO_CLOSE = downMd ? 160 : 240;
  const AUTOOPEN_TOP = 8;
  const onScrollContainer = () => {
    const el = scrollRef.current; if (!el) return;
    const cur = el.scrollTop; const prev = prevScrollTopRef.current; const delta = cur - prev; prevScrollTopRef.current = cur;
    if (cur < AUTOOPEN_TOP) { if (filtersUserWantsOpen && !filtersOpen) setFiltersOpen(true); if (sortsUserWantsOpen && !sortsOpen) setSortsOpen(true); return; }
    if (delta > CLOSE_DELTA && cur > MIN_SCROLLTOP_TO_CLOSE) { if (filtersOpen) setFiltersOpen(false); if (sortsOpen) setSortsOpen(false); }
  };

  // ---------- Colonnes : primaires (toujours visibles) + autres (sélectionnables) ----------
  const primaryColumns = useMemo(
    () => (attributes || []).filter(a => a.identitySource).sort((a,b)=> (a.displayOrder ?? 1e9)-(b.displayOrder ?? 1e9)),
    [attributes]
  );
  const tableColumns = useMemo(
    () => (attributes || []).filter(a => !a.identitySource),
    [attributes]
  );

  // tri actif pour puce + entêtes
  const activeSortAttrId = selectedSort?.kind === "ATTRIBUTE" ? selectedSort.attributeId : undefined;
  const activeSortDir = selectedSort?.kind === "ATTRIBUTE" ? selectedSort.direction : undefined;

  const handleTableHeaderSort = (attrId: number) => {
    if (activeSortAttrId === attrId) {
      const nextDir: "ASC" | "DESC" = activeSortDir === "ASC" ? "DESC" : "ASC";
      setSelectedSort({ kind: "ATTRIBUTE", attributeId: attrId, direction: nextDir });
    } else {
      setSelectedSort({ kind: "ATTRIBUTE", attributeId: attrId, direction: "ASC" });
    }
  };

  // ---------- BULK ----------
  const effectiveCountToFollow = useMemo(() => {
    if (hideFollowFeatures) return 0;
    if (selectAllResults) return selectionCount;
    const selectedArray = listToRender.filter(p => selectedIds.has(p.idPerson));
    return selectedArray.filter(p => !isFollowed(p.idPerson) && !p.followed).length;
  }, [hideFollowFeatures, selectAllResults, selectionCount, listToRender, selectedIds, isFollowed]);

  const effectiveCountToUnfollow = useMemo(() => {
    if (hideFollowFeatures) return 0;
    if (selectAllResults) return selectionCount;
    const selectedArray = listToRender.filter(p => selectedIds.has(p.idPerson));
    return selectedArray.filter(p => isFollowed(p.idPerson) || p.followed).length;
  }, [hideFollowFeatures, selectAllResults, selectionCount, listToRender, selectedIds, isFollowed]);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success"|"error"|"info"}>({ open:false, msg:"", sev:"success" });
  const [confirmKind, setConfirmKind] = useState<null | "follow" | "unfollow">(null);

  const runBulk = async (mode: "follow" | "unfollow") => {
    if (hideFollowFeatures) return;
    try {
      if (selectAllResults) {
        await (mode === "follow" ? bulkFollowBySearch(body) : bulkUnfollowBySearch(body));
        if (mode === "follow" && excludedIds.size > 0) await bulkUnsubscribe(Array.from(excludedIds));
        if (mode === "unfollow" && excludedIds.size > 0) await bulkSubscribe(Array.from(excludedIds));
      } else {
        const includeIds: number[] = Array.from(selectedIds);
        if (!includeIds.length) { setSnack({ open: true, msg: "Aucune carte sélectionnée.", sev: "info" }); return; }
        if (mode === "follow") await bulkSubscribe(includeIds);
        else await bulkUnsubscribe(includeIds);
      }
      await refreshFollowed();
      setSnack({ open: true, msg: mode === "follow" ? "Suivi appliqué." : "Désabonnement appliqué.", sev: "success" });
      clearSelection(); setConfirmKind(null);
    } catch { setSnack({ open: true, msg: "Une erreur est survenue pendant l'opération.", sev: "error" }); }
  };

  const selectionLabel = useMemo(() => {
    if (selectionCount === 0) return "Aucune sélection";
    if (selectAllResults) {
      const excl = excludedIds.size;
      return excl > 0 ? `${selectionCount} sélectionnés (tous, ${excl} exclus)` : `${selectionCount} sélectionnés (tous)`;
    }
    return `${selectionCount} sélectionnés`;
  }, [selectionCount, selectAllResults, excludedIds]);

  useEffect(() => {
    if (selectionMode && !hasShownSelectionHint) {
      setSnack({ open: true, msg: "Astuce : MAJ+clic sélectionne un intervalle. Ctrl/Cmd+A tous les résultats. Échap pour quitter.", sev: "info" });
      setHasShownSelectionHint(true);
    }
  }, [selectionMode, hasShownSelectionHint]);

  const activeFiltersCount = useMemo(
    () => Object.values(selectedFilters).reduce((acc, f) => acc + (f?.values?.length ? 1 : 0), 0),
    [selectedFilters]
  );

  // ---------- raccourcis clavier ----------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (selectionMode) { setSelectionMode(false); clearSelection(); } return; }
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const active = document.activeElement as HTMLElement | null;
      const tag = (active?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || (active?.isContentEditable ?? false);
      if (isCtrlOrCmd && e.key.toLowerCase() === "a") {
        if (isTyping) return;
        e.preventDefault();
        setSelectionMode(true); setSelectAllResults(true); setSelectedIds(new Set()); setExcludedIds(new Set());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); };
  }, [selectionMode, setSelectAllResults, setSelectedIds, setExcludedIds, clearSelection]);

  const handleSelectRange = (ids: number[], makeSelected: boolean) => {
    setSelectionMode(true);
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => { if (makeSelected) next.add(id); else next.delete(id); });
      return next;
    });
  };

  // ----- OPEN/CLOSE PEEK VIA ROUTE -----
  const openPeekNav = (person: PersonCardDto | PersonCardStub) => {
    // si c'est un stub, on garde quand même (les dialogs compléteront)
    setPeek(person as PersonCardDto);
    navigate(`${basePath}/${person.idPerson}${location.search}`, { state: { background: location } });
  };
  const closePeekNav = () => {
    setPeek(null);
    navigate(`${basePath}${location.search}`, { replace: true });
  };

  // Synchronisation route -> état (deep link)
  useEffect(() => {
    const idNum = routeId ? Number(routeId) : NaN;

    console.groupCollapsed("[Trombi] route sync useEffect");
    console.log("routeId =", routeId, "idNum =", idNum);
    console.log("items.length =", (items as PersonCardDto[] | undefined)?.length ?? 0);
    console.log("accItems.length =", (accItems as PersonCardDto[] | undefined)?.length ?? 0);
    console.log("peek =", peek);
    console.groupEnd();

    if (routeId && !Number.isNaN(idNum)) {
      const fromItems =
        (items as PersonCardDto[] | undefined)?.find((p) => p.idPerson === idNum);
      const fromAcc =
        (accItems as PersonCardDto[] | undefined)?.find((p) => p.idPerson === idNum);
      const found = fromItems || fromAcc;

      if (found) {
        const isStub = isPersonCardStub(found as any);
        const shouldReplace =
          !peek ||
          peek.idPerson !== idNum ||
          isPersonCardStub(peek as any); // ⬅️ important : si peek est un stub, on le “upgrade”

        console.log("[Trombi] route sync → found person", {
          idNum,
          from: fromItems ? "items" : "accItems",
          isStub,
          shouldReplace,
          found,
        });

        if (shouldReplace) {
          setPeek(found);
        }
      } else {
        // Rien trouvé dans items/accItems
        const shouldCreateStub = !peek || peek.idPerson !== idNum;

        console.log("[Trombi] route sync → no person found, shouldCreateStub =", shouldCreateStub);

        if (shouldCreateStub) {
          const stub: PersonCardStub = {
            idPerson: idNum,
            // ⚠️ si tu veux continuer à tracer d'où vient #3, laisse cette ligne
            displayName: "",
            // Si tu veux ne plus jamais le voir, remplace par displayName: "",
            photoSmallUrl: null,
            photoLargeUrl: null,
          };
          console.warn("[Trombi] route sync → creating stub for deep-link", stub);
          setPeek(stub as PersonCardDto);
        }
      }
    } else if (!routeId && peek) {
      console.log("[Trombi] route sync → routeId absent, on nettoie peek");
      setPeek(null);
    }
  }, [routeId, items, accItems, peek]);


  return (
    <Box sx={{ width: "100%", mx: 0, py: 1.5, display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          placeholder="Rechercher…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          InputProps={{
            sx: { fontSize: "0.85rem", minWidth: { xs: 160, sm: 240 } },
            startAdornment: <SearchIcon fontSize="small" />,
            endAdornment: text ? (
              <IconButton onClick={() => setText("")} aria-label="Effacer" size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : undefined,
          }}
        />

        {!hideFollowFeatures && (
          <Tooltip title={followFilter === "all" ? "Filtrer : tous" : followFilter === "followed" ? "Filtrer : suivis" : "Filtrer : non suivis"}>
            <Chip
              icon={<StarRoundedIcon fontSize="small" />}
              label="Suivis"
              color={followFilter === "all" ? "default" : followFilter === "followed" ? "primary" : "error"}
              variant={followFilter === "all" ? "outlined" : "filled"}
              size="small"
              onClick={() => setFollowFilter(prev => (prev === "all" ? "followed" : prev === "followed" ? "unfollowed" : "all"))}
              sx={{ "& .MuiChip-label": { px: 1 } }}
            />
          </Tooltip>
        )}

        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup size="small" exclusive value={view} onChange={handleViewChange} aria-label="Mode d’affichage">
          <ToggleButton value="grid" aria-label="Grille"><GridViewRoundedIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="table" aria-label="Tableau"><TableRowsRoundedIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>

        {!INFINITE_SCROLL && (
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={String(pageSize || DEFAULT_PAGE_SIZE)}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              sx={{ "& .MuiSelect-select": { py: 0.75 } }}
              inputProps={{ "aria-label": "Éléments par page" }}
            >
              {[24, 30, 48].map((n) => <MenuItem key={n} value={n}>{n}/p</MenuItem>)}
            </Select>
          </FormControl>
        )}

        {view === "grid" && (
          <Badge color="primary" badgeContent={selectedSort ? 1 : 0} invisible={!selectedSort}>
            <Button size="small" startIcon={<SortOutlinedIcon />} onClick={toggleSorts}>Tri</Button>
          </Badge>
        )}

        <Badge color="primary" badgeContent={activeFiltersCount || 0} invisible={!activeFiltersCount}>
          <Button size="small" startIcon={<FilterListIcon />} onClick={toggleFilters}>Filtres</Button>
        </Badge>

        <Button
          size="small"
          variant={selectionMode ? "contained" : "outlined"}
          onClick={() => { setSelectionMode(v => !v); if (selectionMode) clearSelection(); }}
          startIcon={selectionMode ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
          aria-pressed={selectionMode}
        >
          {selectionMode ? "Quitter sélection" : "Sélectionner"}
        </Button>

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center" aria-live="polite">
            <CircularProgress size={14} />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Chargement…</Typography>
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ opacity: 0.7 }}>{totalElements ?? 0} personnes</Typography>
        )}
      </Stack>

      {/* ZONE SCROLLABLE */}
      {/* ZONE SCROLLABLE : c’est elle qui scrolle */}
      <Box
        ref={scrollRef}
        onScroll={onScrollContainer}
        role="region"
        aria-label="Liste des personnes"
        sx={{
          flex: 1,                  /* prend toute la hauteur restante */
          minHeight: 0,             /* permet le scroll interne */
          overflowY: "auto",
          overflowX: "hidden",
          borderRadius: 2,
          border: (t) => `1px solid ${t.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          scrollbarGutter: "stable both-edges",
          WebkitOverflowScrolling: "touch",
        }}
      >

        <Box sx={{ position: "sticky", top: 0, zIndex: 3, bgcolor: "background.paper", borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          {view === "grid" && (
            <TrombiSorts
              sortsAttributes={sorts || []}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
              sortsOpen={sortsOpen}
            />
          )}

          <TrombiFilters
            filtersAttributes={filters || []}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
            filtersOpen={filtersOpen}
          />

          {view === "table" && selectedSort?.kind === "ATTRIBUTE" && (
            <Box sx={{ px: 1.5, pt: 0.5 }}>
              <Chip
                size="small"
                label={`Tri : ${attributes.find(a => a.id === selectedSort.attributeId)?.name ?? "?"} ${selectedSort.direction === "ASC" ? "↑" : "↓"}`}
                onDelete={() => setSelectedSort(undefined)}
              />
            </Box>
          )}

          <SelectionToolbar
            visible={selectionVisible}
            selectionLabel={selectionLabel}
            selectionCount={selectionCount}
            onClearSelection={clearSelection}
            onBulkFollow={hideFollowFeatures ? undefined : () => runBulk("follow")}
            onBulkUnfollow={hideFollowFeatures ? undefined : () => runBulk("unfollow")}
          />
        </Box>

        <Box sx={{ px: 1.5, py: 1.5, pb: 3}}>
          <ErrorBanner message={error} />
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} />

          {view === "grid" ? (
            <TrombiGrid
              items={listToRender}
              loading={!!loading}
              isFollowed={isFollowed}
              selectedFilters={selectedFilters}
              searchText={debouncedText}
              selectionEnabled={selectionMode}
              selectedIds={
                selectAllResults
                  ? new Set(listToRender.filter(p => !excludedIds.has(p.idPerson)).map(p => p.idPerson))
                  : selectedIds
              }
              onToggleSelect={(id) => toggleSelect(id)}
              onSelectRange={handleSelectRange}
              onToggleFollow={(id, target) => onToggleFollowOptimistic(id, target)}
              hideFollowFeatures={hideFollowFeatures}
              followOverrides={followOverrides}
              followPending={followPending}
              onOpenPeek={(p) => openPeekNav(p)}
              onEnableSelectionMode={() => setSelectionMode(true)}
              externalScrollRef={scrollRef}
            />
          ) : (
            <TrombiTable
              items={listToRender}
              loading={!!loading}
              isFollowed={isFollowed}
              selectedFilters={selectedFilters}
              searchText={debouncedText}
              selectionEnabled={selectionMode}
              selectedIds={
                selectAllResults
                  ? new Set(listToRender.filter(p => !excludedIds.has(p.idPerson)).map(p => p.idPerson))
                  : selectedIds
              }
              onToggleSelect={(id) => toggleSelect(id)}
              onSelectRange={handleSelectRange}
              onToggleFollow={(id, target) => onToggleFollowOptimistic(id, target)}
              hideFollowFeatures={hideFollowFeatures}
              followOverrides={followOverrides}
              followPending={followPending}
              onOpenPeek={(p) => openPeekNav(p)}

              // ⬇️ colonnes
              primaryColumns={primaryColumns}  // prénom, nom, etc. séparés
              columns={tableColumns}
              activeSortAttrId={activeSortAttrId}
              activeSortDir={activeSortDir}
              onRequestSort={handleTableHeaderSort}
              columnPrefsKey={`${sessionKeyPrefix}_table_cols`}
              externalScrollRef={scrollRef}
            />
          )}

          {INFINITE_SCROLL ? (
          hasMore ? (
            <>
              {showLoader ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1, py: 0.5 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Chargement…</Typography>
                </Stack>
              ) : null}
              {/* sentinel sans espace */}
              <Box ref={sentinelRef} sx={{ height: 1 }} />
            </>
          ) : null  // ⬅️ on ne rend plus "Fin de la liste"
        ) : (
            <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
              <Pagination
                color="primary"
                size={downSm ? "small" : "small"}
                page={(currentPage ?? 0) + 1}
                count={Math.max(1, totalPages ?? 1)}
                onChange={(_, p) => { goto(p - 1); scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                showFirstButton={!downSm}
                showLastButton={!downSm}
              />
            </Stack>
          )}
        </Box>
      </Box>

      {/* FICHE PERSONNE */}
      {hideFollowFeatures ? (
        // --- Admin: on force le dialog admin (même sur mobile) ---
        <AdminPersonPeekDialog
          open={!!peek}
          person={peek}
          onClose={closePeekNav}   // ⬅️ route-based close
          attributes={attributes}
          onEdit={handleEditFromPeek}
        />
      ) : (
        // --- User: responsive drawer/dialog + fonctionnalités de follow ---
        downMd ? (
          <PersonPeekDrawer
            open={!!peek}
            person={peek}
            onClose={closePeekNav}   // ⬅️
            isFollowed={isFollowed}
            followOverrides={followOverrides}
            followPending={followPending}
            onToggleFollow={onToggleFollowOptimistic}
          />
        ) : (
          <PersonPeekDialog
            open={!!peek}
            person={peek}
            onClose={closePeekNav}   // ⬅️
            isFollowed={isFollowed}
            followOverrides={followOverrides}
            followPending={followPending}
            onToggleFollow={onToggleFollowOptimistic}
            attributes={attributes}
          />
        )
      )}

      {/* ÉDITEUR ADMIN (seulement côté admin) */}
      {hideFollowFeatures && (
        <AdminPersonEditDialog
          open={!!editTarget}
          person={editTarget as PersonCardDto}
          attributes={attributes || []}
          currentExtras={editExtras}
          onClose={closeEdit}
          onSubmitMany={onSubmitMany}
          loading={saving}
        />
      )}

      {/* Confirmation */}
      <ConfirmDialog
        open={!!confirmKind}
        title="Confirmer l’action"
        message={confirmKind === "follow"
          ? `Tu vas suivre environ ${effectiveCountToFollow} personnes. Continuer ?`
          : `Tu vas arrêter de suivre environ ${effectiveCountToUnfollow} personnes. Continuer ?`}
        onCancel={() => setConfirmKind(null)}
        onConfirm={() => runBulk(confirmKind!)}
      />

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TrombinoscopeBasePage;
