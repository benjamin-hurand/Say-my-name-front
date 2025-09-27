// src/pages/trombi/TrombinoscopePage.tsx
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";

import {
  Alert, Badge, Box, Button, Chip, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Pagination, Snackbar, Stack, TextField,
  Typography, useMediaQuery, FormControl, Select, MenuItem, Tooltip
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useGlobalData } from "../../contexts/GlobalDataContext";
import { usePersonsDirectory } from "../../contexts/PersonsDirectoryContext";
import { PersonCardDto } from "../../services/dto/person/search/PersonCardDtos";
import { AttributeFilterDto } from "../../services/dto/person/search/PersonSearchRequestDto";

import {
  bulkFollowBySearch, bulkSubscribe, bulkUnfollowBySearch, bulkUnsubscribe,
} from "../../services/business/subscriptions/subscriptions.service";

import {
  MAX_WIDTH, DEFAULT_PAGE_SIZE, INFINITE_SCROLL,
  BULK_CONFIRM_THRESHOLD, DEBOUNCE_MS, MIN_SPINNER_MS, COOLDOWN_MS
} from "./constants";
import { buildSearchBody } from "./utils/personSearch";
import useDebouncedValue from "./hooks/useDebouncedValue";
import useSelection from "./hooks/useSelection";
import useFollowOptimistic from "./hooks/useFollowOptimistic";

import TrombiFilters from "./components/TrombiFilters";
import TrombiSorts from "./components/TrombiSorts";
import TrombiGrid from "./components/TrombiGrid";
import SelectionToolbar from "./components/SelectionToolbar";
import PersonPeekDrawer from "./components/PersonPeekDrawer";
import ErrorBanner from "./components/ErrorBanner";
import ConfirmDialog from "./components/ConfirmDialog";
import { SortValue } from "./types";
import PersonPeekDialog from "./components/PersonPeekDialog";

/* ---------- Types ---------- */
type FollowFilter = "all" | "followed" | "unfollowed";

/* ---------- Page ---------- */
const TrombinoscopePage: React.FC = () => {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));
  const downMd = useMediaQuery(theme.breakpoints.down("md"));

  const { attributes, filters, sorts } = useGlobalData();
  const {
    items, totalPages, totalElements, loading, error,
    pageSize, currentPage, search, goto, setPageSize,
    refreshFollowed, isFollowed,
  } = usePersonsDirectory();

  // UI state
  const [text, setText] = useState("");
  const [followFilter, setFollowFilter] = useState<FollowFilter>("all"); // tri-état
  const [selectedFilters, setSelectedFilters] = useState<Record<number, { op: AttributeFilterDto["operator"]; values: string[] }>>({});
  const [selectedSort, setSelectedSort] = useState<SortValue | undefined>(undefined);

  // OUVERTURE PANNEAUX — contrôlés + persistance session
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    const saved = sessionStorage.getItem("trombi_filters_open");
    return saved ? saved === "1" : false;
  });
  useEffect(() => {
    sessionStorage.setItem("trombi_filters_open", filtersOpen ? "1" : "0");
  }, [filtersOpen]);

  const [sortsOpen, setSortsOpen] = useState<boolean>(() => {
    const saved = sessionStorage.getItem("trombi_sorts_open");
    return saved ? saved === "1" : false;
  });
  useEffect(() => {
    sessionStorage.setItem("trombi_sorts_open", sortsOpen ? "1" : "0");
  }, [sortsOpen]);

  // Debounce
  const debouncedText = useDebouncedValue(text, DEBOUNCE_MS);

  // Accumulateur (scroll infini)
  const [accItems, setAccItems] = useState<PersonCardDto[]>([]);
  const listToRender: PersonCardDto[] = (INFINITE_SCROLL ? accItems : (items as PersonCardDto[])); // le back filtre déjà

  // Sélection
  const {
    selectedIds, selectAllResults, excludedIds, selectionCount,
    setSelectedIds, setSelectAllResults, setExcludedIds,
    clearSelection, toggleSelect, selectAllVisible, deselectAllVisible,
  } = useSelection(totalElements ?? 0);
  const [selectionMode, setSelectionMode] = useState(false);
  const selectionVisible = selectionMode || selectionCount > 0;

  const [hasShownSelectionHint, setHasShownSelectionHint] = useState(false);

  // Peek (fiche personne)
  const [peek, setPeek] = useState<PersonCardDto | null>(null);
  const closePeek = () => setPeek(null);

  // Édition
  const [editTarget, setEditTarget] = useState<PersonCardDto | null>(null);

  // Suivis au mount (optimistic UI : on maintient overrides/pending côté hook)
  useEffect(() => { refreshFollowed(); /* eslint-disable-next-line */ }, []);

  // Corps de recherche (backend) — on envoie le tri-état au back
  const body = useMemo(
    () => buildSearchBody({
      text: debouncedText,
      followFilter,
      selectedFilters,
      selectedSort
    }),
    [debouncedText, followFilter, selectedFilters, selectedSort]
  );

  // Requêtes
  useEffect(() => { search(body, 0, pageSize || DEFAULT_PAGE_SIZE); /* eslint-disable-next-line */ }, [body]);

  const hasMore = useMemo(
    () => (currentPage ?? 0) + 1 < (totalPages ?? 0),
    [currentPage, totalPages]
  );

  // Reset accumulateur/sélection quand critères changent
  useEffect(() => {
    if (!INFINITE_SCROLL) return;
    setAccItems([]);
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, followFilter, selectedFilters, selectedSort]);

  // Concat nouvelles pages
  useEffect(() => {
    if (!INFINITE_SCROLL) return;
    setAccItems(prev => {
      if ((currentPage ?? 0) === 0) return [...items] as PersonCardDto[];
      const merged = [...prev, ...(items as PersonCardDto[])];
      const seen = new Set<number>();
      return merged.filter(p => {
        const id = (p as PersonCardDto).idPerson;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, currentPage]);

  // Page size
  const handlePageSizeChange = async (n: number) => {
    await setPageSize(n);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Min spinner UX
  const [showLoader, setShowLoader] = useState(false);
  const loaderStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      if (!showLoader) {
        setShowLoader(true);
        loaderStartRef.current = performance.now?.() ?? Date.now();
      }
    } else if (showLoader) {
      const now = performance.now?.() ?? Date.now();
      const elapsed = now - (loaderStartRef.current ?? now);
      if (elapsed < MIN_SPINNER_MS) {
        const t = setTimeout(() => setShowLoader(false), MIN_SPINNER_MS - elapsed);
        return () => clearTimeout(t);
      } else setShowLoader(false);
    }
  }, [loading, showLoader]);

  // CONTENEUR SCROLLABLE + auto-rétraction des panneaux
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevScrollTopRef = useRef(0);
  const suppressAutoCloseRef = useRef(false);
  const filtersRootRef = useRef<HTMLDivElement | null>(null);

  const CLOSE_DELTA = 12;
  const MIN_SCROLLTOP_TO_CLOSE = downMd ? 160 : 240;
  const AUTOOPEN_TOP = 8;
  const SUPPRESS_MS = 400;

  const setPanelsOpenSafely = (panel: "filters" | "sorts", open: boolean) => {
    if (open) {
      suppressAutoCloseRef.current = true;
      window.setTimeout(() => { suppressAutoCloseRef.current = false; }, SUPPRESS_MS);
    }
    if (panel === "filters") setFiltersOpen(open);
    else setSortsOpen(open);
  };

  const onScrollContainer = () => {
    const el = scrollRef.current;
    if (!el) return;

    if (suppressAutoCloseRef.current) return;

    const active = document.activeElement as HTMLElement | null;
    if (active && filtersRootRef.current && filtersRootRef.current.contains(active)) return;

    const cur = el.scrollTop;
    const prev = prevScrollTopRef.current;
    const delta = cur - prev;
    prevScrollTopRef.current = cur;

    if (cur < AUTOOPEN_TOP) {
      if (!filtersOpen) setFiltersOpen(true);
      if (!sortsOpen) setSortsOpen(true);
      return;
    }
    if (delta > CLOSE_DELTA && cur > MIN_SCROLLTOP_TO_CLOSE) {
      if (filtersOpen) setFiltersOpen(false);
      if (sortsOpen) setSortsOpen(false);
    }
  };

  // IntersectionObserver (scroll infini)
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastAutoRef = useRef(0);

  useEffect(() => {
    if (!INFINITE_SCROLL) return;
    const rootEl = scrollRef.current;
    const el = sentinelRef.current;
    if (!rootEl || !el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const now = performance.now ? performance.now() : Date.now();
        if (entry.isIntersecting && hasMore && !loading && (now - lastAutoRef.current) > COOLDOWN_MS) {
          lastAutoRef.current = now;
          goto((currentPage ?? 0) + 1);
        }
      },
      { root: rootEl, rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [INFINITE_SCROLL, hasMore, loading, currentPage, goto]);

  /* -------- Suivi 1 personne — optimistic -------- */
  const { overrides: followOverrides, pending: followPending, toggle: onToggleFollowOptimistic } =
    useFollowOptimistic(refreshFollowed);

  /* -------- BULK -------- */
  const effectiveCountToFollow = useMemo(() => {
    if (selectAllResults) return selectionCount;
    const selectedArray = listToRender.filter(p => selectedIds.has(p.idPerson));
    return selectedArray.filter(p => !isFollowed(p.idPerson) && !p.followed).length;
  }, [selectAllResults, selectionCount, listToRender, selectedIds, isFollowed]);

  const effectiveCountToUnfollow = useMemo(() => {
    if (selectAllResults) return selectionCount;
    const selectedArray = listToRender.filter(p => selectedIds.has(p.idPerson));
    return selectedArray.filter(p => isFollowed(p.idPerson) || p.followed).length;
  }, [selectAllResults, selectionCount, listToRender, selectedIds, isFollowed]);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success"|"error"|"info"}>({ open:false, msg:"", sev:"success" });
  const [confirmKind, setConfirmKind] = useState<null | "follow" | "unfollow">(null);

  const runBulk = async (mode: "follow" | "unfollow") => {
    try {
      if (selectAllResults) {
        await (mode === "follow" ? bulkFollowBySearch(body) : bulkUnfollowBySearch(body));
        if (mode === "follow" && excludedIds.size > 0) await bulkUnsubscribe(Array.from(excludedIds));
        if (mode === "unfollow" && excludedIds.size > 0) await bulkSubscribe(Array.from(excludedIds));
      } else {
        const includeIds = Array.from(selectedIds);
        if (!includeIds.length) {
          setSnack({ open: true, msg: "Aucune carte sélectionnée.", sev: "info" });
          return;
        }
        if (mode === "follow") await bulkSubscribe(includeIds);
        else await bulkUnsubscribe(includeIds);
      }
      await refreshFollowed();
      setSnack({ open: true, msg: mode === "follow" ? "Suivi appliqué." : "Désabonnement appliqué.", sev: "success" });
      clearSelection();
      setConfirmKind(null);
    } catch {
      setSnack({ open: true, msg: "Une erreur est survenue pendant l'opération.", sev: "error" });
    }
  };

  const askOrRun = (mode: "follow" | "unfollow") => {
    const n = mode === "follow" ? effectiveCountToFollow : effectiveCountToUnfollow;
    if (n >= BULK_CONFIRM_THRESHOLD) setConfirmKind(mode);
    else runBulk(mode);
  };

  // Libellé sélection
  const selectionLabel = useMemo(() => {
    if (selectionCount === 0) return "Aucune sélection";
    if (selectAllResults) {
      const excl = excludedIds.size;
      return excl > 0
        ? `${selectionCount} sélectionnés (tous les résultats, ${excl} exclus)`
        : `${selectionCount} sélectionnés (tous les résultats)`;
    }
    return `${selectionCount} sélectionnés`;
  }, [selectionCount, selectAllResults, excludedIds]);

  useEffect(() => {
    if (selectionMode && !hasShownSelectionHint) {
      setSnack({ open: true, msg: "Astuce : MAJ+clic sélectionne un intervalle. Ctrl/Cmd + A sélectionne tous les résultats. Échap pour quitter.", sev: "info" });
      setHasShownSelectionHint(true);
    }
  }, [selectionMode, hasShownSelectionHint]);

  const activeFiltersCount = useMemo(
    () => Object.values(selectedFilters).reduce((acc, f) => acc + (f?.values?.length ? 1 : 0), 0),
    [selectedFilters]
  );

  // Apparence & comportement de la chip tri-état
  const cycleFollowFilter = () =>
    setFollowFilter((prev) => (prev === "all" ? "followed" : prev === "followed" ? "unfollowed" : "all"));

  const chipProps =
    followFilter === "all"
      ? { color: "default" as const, variant: "outlined" as const, icon: <StarRoundedIcon fontSize="small" />, tooltip: "Filtrer : tous" }
      : followFilter === "followed"
      ? { color: "primary" as const, variant: "filled" as const, icon: <StarRoundedIcon fontSize="small" />, tooltip: "Filtrer : suivis uniquement" }
      : { color: "error" as const, variant: "filled" as const, icon: <PersonOffOutlinedIcon fontSize="small" />, tooltip: "Filtrer : non suivis uniquement" };

  /* ---------- Raccourcis clavier globaux ---------- */
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // garder l'état Shift pour l’aperçu d’intervalle
      if (e.key === "Shift") setIsShiftPressed(true);

      // Échap : quitter le mode sélection
      if (e.key === "Escape") {
        if (selectionMode) {
          setSelectionMode(false);
          clearSelection();
        }
        return;
      }

      // Ctrl/Cmd + A : sélectionner TOUS LES RÉSULTATS (pas seulement visibles)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const active = document.activeElement as HTMLElement | null;
      const tag = (active?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || (active?.isContentEditable ?? false);

      if (isCtrlOrCmd && e.key.toLowerCase() === "a") {
        // ne pas interférer quand on tape dans un champ
        if (isTyping) return;
        e.preventDefault();
        setSelectionMode(true);
        // active la sélection "tous les résultats"
        setSelectAllResults(true);
        setSelectedIds(new Set());
        setExcludedIds(new Set());
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [selectionMode, setSelectAllResults, setSelectedIds, setExcludedIds, clearSelection]);

  /* ---------- Sélection par intervalle (MAJ+clic) ---------- */
  const handleSelectRange = (ids: number[], makeSelected: boolean) => {
    setSelectionMode(true);
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => {
        if (makeSelected) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  return (
    <Container maxWidth={false} sx={{ maxWidth: `${MAX_WIDTH}px`, mx: "auto", py: 1.5 }}>
      {/* Header compact : actions globales */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {/* Recherche */}
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

        {/* Suivis : tri-état */}
        <Tooltip title={chipProps.tooltip}>
          <Chip
            icon={chipProps.icon}
            label="Suivis"
            color={chipProps.color}
            variant={chipProps.variant}
            size="small"
            onClick={cycleFollowFilter}
            sx={{ "& .MuiChip-label": { px: 1 } }}
          />
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        {/* Page size (si pas infini) */}
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

        {/* Bouton TRI */}
        <Badge color="primary" badgeContent={selectedSort ? 1 : 0} invisible={!selectedSort}>
          <Button size="small" startIcon={<SortOutlinedIcon />} onClick={() => setPanelsOpenSafely("sorts", !sortsOpen)}>
            Tri
          </Button>
        </Badge>

        {/* Bouton FILTRES */}
        <Badge color="primary" badgeContent={activeFiltersCount || 0} invisible={!activeFiltersCount}>
          <Button size="small" startIcon={<FilterListIcon />} onClick={() => setPanelsOpenSafely("filters", !filtersOpen)}>
            Filtres
          </Button>
        </Badge>

        {/* Sélection mode + compteur total */}
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
      <Box
        ref={scrollRef}
        onScroll={onScrollContainer}
        className="scrollable-content"
        role="region"
        aria-label="Liste des personnes"
        sx={{
          height: { xs: "calc(100vh - 120px)", md: "calc(100vh - 130px)" },
          overflowY: "auto",
          overflowX: "hidden",
          borderRadius: 2,
          border: (t) => `1px solid ${t.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          scrollbarGutter: "stable both-edges",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* BANDEAU FIXE DANS LE CONTENEUR */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            bgcolor: "background.paper",
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          {/* Panneau TRI */}
          <TrombiSorts
            sortsAttributes={sorts || []}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            sortsOpen={sortsOpen}
            onSortsOpenChange={setSortsOpen}
          />

          {/* Panneau FILTRES */}
          <TrombiFilters
            filtersAttributes={filters || []}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
            filtersOpen={filtersOpen}
            onFiltersOpenChange={setFiltersOpen}
            rootRef={filtersRootRef}
          />

          {/* Barre d’outils de sélection (version épurée) */}
          <SelectionToolbar
            visible={selectionVisible}
            selectionLabel={selectionLabel}
            selectionCount={selectionCount}
            onClearSelection={clearSelection}
            onBulkFollow={() => askOrRun("follow")}
            onBulkUnfollow={() => askOrRun("unfollow")}
          />
        </Box>

        {/* CONTENU */}
        <Box sx={{ pt: 1.5, px: 1.5, pb: INFINITE_SCROLL ? 0 : 1.5 }}>
          <ErrorBanner message={error} />

          <Stack direction="row" spacing={1} sx={{ mb: 1 }} />

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
            followOverrides={followOverrides}
            followPending={followPending}
            onOpenPeek={(p) => setPeek(p)}
            onEnableSelectionMode={() => setSelectionMode(true)}
            isShiftPressed={isShiftPressed}
          />

          {/* Footer auto-load + sentinel */}
          {INFINITE_SCROLL ? (
            <Box sx={{ my: 2, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              {hasMore ? (
                <>
                  {showLoader ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>Chargement…</Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Faites défiler pour charger plus</Typography>
                  )}
                  <Box ref={sentinelRef} sx={{ position: "absolute", bottom: -1, height: 1, width: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }} />
                </>
              ) : (
                <Typography variant="caption" sx={{ opacity: 0.6 }}>Fin de la liste</Typography>
              )}
            </Box>
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
      {downMd ? (
        <PersonPeekDrawer
          open={!!peek}
          person={peek}
          onClose={closePeek}
          isFollowed={isFollowed}
          followOverrides={followOverrides}
          followPending={followPending}
          onToggleFollow={onToggleFollowOptimistic}
        />
      ) : (
        <PersonPeekDialog
          open={!!peek}
          person={peek}
          onClose={closePeek}
          isFollowed={isFollowed}
          followOverrides={followOverrides}
          followPending={followPending}
          onToggleFollow={onToggleFollowOptimistic}
          attributes={attributes}
        />
      )}

      {/* Édition (placeholder) */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Éditer la personne</DialogTitle>
        <DialogContent dividers>
          {editTarget && (
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                {(editTarget.primaryAttributes ?? []).map(a => a?.value).filter(Boolean).join(" ")}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                (Formulaire d’édition à brancher)
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Fermer</Button>
          <Button variant="contained" disabled>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation */}
      <ConfirmDialog
        open={!!confirmKind}
        title="Confirmer l’action"
        message={
          confirmKind === "follow"
            ? `Tu vas suivre environ ${effectiveCountToFollow} personnes. Continuer ?`
            : `Tu vas arrêter de suivre environ ${effectiveCountToUnfollow} personnes. Continuer ?`
        }
        onCancel={() => setConfirmKind(null)}
        onConfirm={() => runBulk(confirmKind!)}
      />

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TrombinoscopePage;
