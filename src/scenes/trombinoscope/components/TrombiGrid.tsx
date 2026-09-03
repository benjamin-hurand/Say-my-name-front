import React, { useRef, useState } from "react";
import { Box, Paper, Skeleton, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TrombiCard from "./TrombiCard";
import { PersonCardDto } from "../../../services/dto/person/search/PersonCardDtos";

type SelectedFilters =
  Record<number, { op: "IN" | "LIKE" | "RANGE" | undefined; values: string[] }>;

type TrombiGridProps = {
  items: PersonCardDto[];
  loading: boolean;
  isFollowed: (id: number) => boolean;
  onToggleFollow: (id: number, target: boolean) => Promise<void>;
  hideFollowFeatures: boolean;
  selectedFilters: SelectedFilters;
  searchText?: string;

  selectionEnabled?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  /** Sélection d’intervalle (MAJ+clic) appliquée par la page */
  onSelectRange?: (ids: number[], makeSelected: boolean) => void;

  followOverrides?: Record<number, boolean | undefined>;
  followPending?: Set<number>;

  onOpenPeek?: (p: PersonCardDto) => void;
  onEnableSelectionMode?: () => void;

  /** Pour feedback MAJ depuis la page (état clavier global, optionnel) */
  isShiftPressed?: boolean;

  /** ⚠️ Conteneur qui DOIT scroller (passé par la page). */
  externalScrollRef?: React.RefObject<HTMLDivElement>;
};

const TrombiGrid: React.FC<TrombiGridProps> = ({
  items,
  loading,
  isFollowed,
  onToggleFollow,
  hideFollowFeatures,
  selectedFilters,
  searchText,

  selectionEnabled = false,
  selectedIds,
  onToggleSelect,
  onSelectRange,

  followOverrides,
  followPending,

  onOpenPeek,
  onEnableSelectionMode,

  isShiftPressed = false,

  externalScrollRef,
}) => {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));

  // Quand la page n'en fournit pas, on garde un fallback local scrollable
  const localScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = externalScrollRef ?? localScrollRef;

  const minCardWidth = downSm ? 120 : 150;
  const skeletonInitialCount = downSm ? 8 : 14;

  const gridTemplate = `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`;
  const showInitialSkeletons = loading && items.length === 0;

  // --- Sélection par intervalle (ancre + aperçu)
  const anchorIndexRef = useRef<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const indexOfId = (id: number) => items.findIndex((p) => p.idPerson === id);

  const handleSelectClick = (e: React.MouseEvent | undefined, clickedId: number) => {
    const clickedIndex = indexOfId(clickedId);

    if (selectionEnabled && e?.shiftKey && anchorIndexRef.current !== null && clickedIndex !== -1) {
      const a = anchorIndexRef.current!;
      const b = clickedIndex;
      const [start, end] = a < b ? [a, b] : [b, a];
      const ids = items.slice(start, end + 1).map((x) => x.idPerson);
      const makeSelected = !selectedIds?.has(clickedId);
      onSelectRange?.(ids, makeSelected);
      return; // ne pas déplacer l’ancre sur shift+click
    }

    onToggleSelect?.(clickedId);
    if (clickedIndex !== -1) anchorIndexRef.current = clickedIndex;
  };

  const computeInPreview = (cardIndex: number) => {
    if (!selectionEnabled) return false;
    if (!isShiftPressed) return false;
    if (anchorIndexRef.current === null) return false;
    if (hoverIndex === null) return false;
    const [start, end] =
      anchorIndexRef.current < hoverIndex
        ? [anchorIndexRef.current, hoverIndex]
        : [hoverIndex, anchorIndexRef.current];
    return cardIndex >= start && cardIndex <= end;
  };

  return (
    // ╭─────────────── Conteneur qui SCROLLE ───────────────╮
    // Si externalScrollRef est fourni par la page, on le pose ici.
    // Sinon, on applique un fallback local scrollable.
    <Box
      ref={scrollRef}
      sx={{
        width: "100%",
        minHeight: 0,
        overflow: "auto",
        p: 1,
        // Fallback utile (si pas d'externalScrollRef et pas de contrainte parent) :
        ...(externalScrollRef
          ? null
          : {
              // essaie de rester dans la fenêtre en évitant header + barres d’outils
              maxHeight: "calc(100vh - 220px)",
            }),
      }}
      aria-busy={loading}
      role="region"
      aria-label="Grille des personnes"
    >
      {/* Grille responsives (observée pour calcul des colonnes) */}
      <Box
        sx={{
          display: "grid",
          gap: downSm ? 1 : 1.25,
          gridTemplateColumns: gridTemplate,
          alignItems: "stretch",
        }}
        role="list"
      >
        {showInitialSkeletons
          ? Array.from({ length: skeletonInitialCount }).map((_, i) => (
              <Paper key={`sk-i-${i}`} variant="outlined" sx={{ p: 1 }}>
                <Stack spacing={1} alignItems="center">
                  <Skeleton variant="circular" width={56} height={56} />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="75%" />
                </Stack>
              </Paper>
            ))
          : items.map((p, idx) => {
              const base = isFollowed(p.idPerson);
              const hasOverride =
                followOverrides && Object.prototype.hasOwnProperty.call(followOverrides, p.idPerson);
              const f = hasOverride ? !!followOverrides![p.idPerson] : base;

              const pending = !!followPending?.has(p.idPerson);
              const handleToggle = () => {
                if (pending) return;
                onToggleFollow(p.idPerson, !f);
              };

              const selected = !!selectedIds?.has(p.idPerson);
              const inPreview = computeInPreview(idx);

              return (
                <TrombiCard
                  key={p.idPerson}
                  person={p}
                  followed={f}
                  followPending={pending}
                  onToggleFollow={handleToggle}
                  hideFollowFeatures={hideFollowFeatures}
                  selectedFilters={selectedFilters}
                  searchText={searchText}
                  selectionEnabled={selectionEnabled}
                  selected={selected}
                  inShiftPreview={inPreview}
                  onSelectToggle={(e) => handleSelectClick(e, p.idPerson)}
                  onOpenPeek={() => onOpenPeek?.(p)}
                  onLongPress={() => {
                    onEnableSelectionMode?.();
                    onToggleSelect?.(p.idPerson);
                    const idx0 = indexOfId(p.idPerson);
                    if (idx0 !== -1) anchorIndexRef.current = idx0;
                  }}
                  onMouseEnterCard={() => {
                    if (!selectionEnabled) return;
                    setHoverIndex(idx);
                  }}
                />
              );
            })}
      </Box>
    </Box>
  );
};

export default TrombiGrid;
