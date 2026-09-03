import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import {
  Avatar, Box, Checkbox, IconButton,
  Paper,
  Stack,
  Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Tooltip, Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Attribute } from "../../../models/commons/Attribute/Attribute";
import { PersonCardDto } from "../../../services/dto/person/search/PersonCardDtos";
import ColumnMenu from "./ColomnMenu";

type SelectedFilters =
  Record<number, { op: "IN" | "LIKE" | "RANGE" | undefined; values: string[] }>;

// dimensions
const DEFAULT_MIN_WIDTH = 120;
const FOLLOW_COL_WIDTH = 64;
const AVATAR_COL_WIDTH = 44; // 28px avatar + marges

interface TrombiTableProps {
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
  onSelectRange?: (ids: number[], makeSelected: boolean) => void;

  followOverrides?: Record<number, boolean | undefined>;
  followPending?: Set<number>;

  onOpenPeek?: (p: PersonCardDto) => void;

  // colonnes
  primaryColumns: Attribute[]; // ex: first name, last name (toujours visibles)
  columns: Attribute[];        // extra (sélectionnables)
  activeSortAttrId?: number;
  activeSortDir?: "ASC" | "DESC";
  onRequestSort?: (attrId: number) => void;

  columnPrefsKey?: string;

  /** ref du conteneur scrollé (pour l’infinite scroll au niveau page) */
  externalScrollRef?: React.RefObject<HTMLDivElement>;
}

const TrombiTable: React.FC<TrombiTableProps> = ({
  items,
  isFollowed,
  onToggleFollow,
  hideFollowFeatures,


  selectionEnabled = false,
  selectedIds,
  onToggleSelect,
  onSelectRange,

  followOverrides,
  followPending,

  onOpenPeek,

  primaryColumns,
  columns,
  activeSortAttrId,
  activeSortDir,
  onRequestSort,

  columnPrefsKey = "trombi_table_cols",
  externalScrollRef,
}) => {
  const theme = useTheme();

  // ---- Getter unifié (cherche d'abord dans primary, puis extra)
  const getAttrValue = (p: PersonCardDto, attrId: number) => {
    const v1 = (p.primaryAttributes ?? []).find(x => x.attributeId === attrId)?.value;
    if (v1 != null && v1 !== "") return v1;
    return (p.extraAttributes ?? []).find(x => x.attributeId === attrId)?.value ?? "";
  };

  // ---- Visibilité des colonnes extra (persistée)
  const allExtraIds = useMemo(() => columns.map(c => c.id), [columns]);
  const [visibleExtraIds, setVisibleExtraIds] = useState<number[]>(() => {
    try {
      const raw = sessionStorage.getItem(columnPrefsKey);
      const parsed: number[] | null = raw ? JSON.parse(raw) : null;
      if (parsed?.length) return parsed.filter(id => allExtraIds.includes(id));
    } catch {}
    return allExtraIds.slice(0, 6);
  });
  useEffect(() => {
    sessionStorage.setItem(columnPrefsKey, JSON.stringify(visibleExtraIds));
  }, [visibleExtraIds, columnPrefsKey, allExtraIds]);

  const visibleExtraCols = useMemo(
    () => columns.filter(c => visibleExtraIds.includes(c.id)),
    [columns, visibleExtraIds]
  );

  // 👉 Colonnes affichées (aucune différence primary/extras dans le rendu)
  const displayCols = useMemo(
    () => [...primaryColumns, ...visibleExtraCols],
    [primaryColumns, visibleExtraCols]
  );

  // ---- Largeurs (redimensionnement)
  // clés: C_<id> pour toutes les colonnes ; FOLLOW ; (sélecteur non redimensionnable)
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    displayCols.forEach(c => { base[`C_${c.id}`] = DEFAULT_MIN_WIDTH; });
    if (!hideFollowFeatures) base["FOLLOW"] = FOLLOW_COL_WIDTH;
    return base;
  });

  useEffect(() => {
    setColWidths(prev => {
      const next = { ...prev };
      displayCols.forEach(c => { next[`C_${c.id}`] ??= DEFAULT_MIN_WIDTH; });
      if (!hideFollowFeatures) next["FOLLOW"] ??= FOLLOW_COL_WIDTH;
      return next;
    });
  }, [displayCols, hideFollowFeatures]);

  const startResizeRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const onResizeDown = (e: React.MouseEvent, key: string) => {
    e.preventDefault(); e.stopPropagation();
    startResizeRef.current = { key, startX: e.clientX, startW: colWidths[key] ?? DEFAULT_MIN_WIDTH };
    window.addEventListener("mousemove", onResizing);
    window.addEventListener("mouseup", onResizeUp);
  };
  const onResizing = (ev: MouseEvent) => {
    const data = startResizeRef.current; if (!data) return;
    const dx = ev.clientX - data.startX;
    setColWidths(prev => ({ ...prev, [data.key]: Math.max(80, data.startW + dx) }));
  };
  const onResizeUp = () => {
    startResizeRef.current = null;
    window.removeEventListener("mousemove", onResizing);
    window.removeEventListener("mouseup", onResizeUp);
  };

  // ---- Sélection par intervalle
  const anchorIndexRef = useRef<number | null>(null);
  const indexOfId = (id: number) => items.findIndex(p => p.idPerson === id);
  const onRowCheckbox = (e: React.MouseEvent | undefined, id: number) => {
    const idx = indexOfId(id);
    if (selectionEnabled && e?.shiftKey && anchorIndexRef.current !== null && idx !== -1) {
      const [a, b] = anchorIndexRef.current < idx ? [anchorIndexRef.current, idx] : [idx, anchorIndexRef.current];
      const ids = items.slice(a, b + 1).map(x => x.idPerson);
      const makeSelected = !selectedIds?.has(id);
      onSelectRange?.(ids, makeSelected);
      return;
    }
    onToggleSelect?.(id);
    if (idx !== -1) anchorIndexRef.current = idx;
  };

  // ---- Menu colonnes (extra)
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget);
  const closeMenu = () => setMenuEl(null);

  // ---- Sticky pour sélection + avatar (facultatif), pas pour les colonnes
  const selectW = selectionEnabled ? 56 : 0;
  const avatarLeft = selectW;

  // ---- minWidth pour scroll horizontal (calculé sur toutes les colonnes unifiées)
  const tableMinWidth = useMemo(() => {
    const colsW = displayCols.reduce((sum, c) => sum + (colWidths[`C_${c.id}`] ?? DEFAULT_MIN_WIDTH), 0);
    const followW = hideFollowFeatures ? 0 : (colWidths["FOLLOW"] ?? FOLLOW_COL_WIDTH);
    return selectW + AVATAR_COL_WIDTH + colsW + followW + 24;
  }, [displayCols, colWidths, hideFollowFeatures, selectW]);


  return (
    <Paper
      variant="outlined"
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 0, m: 0,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: 0.5 }}>
        <Tooltip title="Afficher / masquer des colonnes">
          <IconButton size="small" onClick={openMenu}>
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Colonnes : {visibleExtraCols.length} / {columns.length}
        </Typography>
      </Stack>

      <ColumnMenu
        anchorEl={menuEl}
        onClose={closeMenu}
        allColumns={columns}
        visibleIds={visibleExtraIds}
        onChange={setVisibleExtraIds}
        // facultatif : fournis des presets si tu veux des boutons
        defaultPresetIds={columns.map(c => c.id)}     // ex: toutes visibles
        // minimalPresetIds={[idPromo, idDept, idNickname]} // si tu veux
        // userPresetIds={userPresetIds} // si tu charges un preset ailleurs
      />


      {/* 👉 C’est CE conteneur qui scrolle */}
      <TableContainer
        ref={externalScrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          p: 0,
          m: 0,
          border: 0,
          backgroundColor: "background.paper",
          "&::before, &::after": { display: "none" },
        }}
      >
        <Table
          size="small"
          stickyHeader
          aria-label="Trombinoscope tableau"
          sx={{
            width: "100%",
            minWidth: tableMinWidth,
            tableLayout: "fixed",
            m: 0,
            "& tbody tr:nth-of-type(odd)": { backgroundColor: (t) => t.palette.action.hover },
            "& tbody tr:hover": { backgroundColor: (t) => alpha(t.palette.primary.main, 0.08) },
            "& .cell-empty": { opacity: 0.5, fontStyle: "italic" },
            "& tbody tr:last-of-type td": { borderBottom: 0 },
          }}
        >
          <TableHead>
            <TableRow>
              {selectionEnabled && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    width: 56,
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    backgroundColor: "background.paper",
                  }}
                />
              )}

              {/* Avatar sticky */}
              <TableCell
                sx={{
                  position: "sticky",
                  left: avatarLeft,
                  zIndex: 3,
                  backgroundColor: "background.paper",
                  width: AVATAR_COL_WIDTH,
                  minWidth: AVATAR_COL_WIDTH,
                  maxWidth: AVATAR_COL_WIDTH,
                  p: 0
                }}
              />

              {/* En-têtes unifiés */}
              {displayCols.map(col => {
                const active = activeSortAttrId === col.id;
                const direction = active ? (activeSortDir === "DESC" ? "desc" : "asc") : "asc";
                const key = `C_${col.id}`;
                return (
                  <TableCell
                    key={`h-${col.id}`}
                    sx={{ minWidth: colWidths[key], width: colWidths[key], whiteSpace: "nowrap", position: "relative" }}
                    sortDirection={active ? direction : false}
                  >
                    <Tooltip title={col.name}>
                      <TableSortLabel
                        active={active}
                        direction={direction}
                        onClick={() => onRequestSort?.(col.id)}
                      >
                        {col.name}
                      </TableSortLabel>
                    </Tooltip>
                    <Box
                      onMouseDown={(e) => onResizeDown(e, key)}
                      sx={{ position: "absolute", top: 0, right: 0, width: 8, cursor: "col-resize", height: "100%" }}
                    />
                  </TableCell>
                );
              })}

              {/* Suivi sticky droite */}
              {!hideFollowFeatures && (
                <TableCell
                  padding="checkbox"
                  align="center"
                  sx={{
                    position: "sticky",
                    right: 0,
                    zIndex: 3,
                    backgroundColor: "background.paper",
                    minWidth: colWidths["FOLLOW"],
                    width: colWidths["FOLLOW"],
                  }}
                >
                  Suivre
                  <Box
                    onMouseDown={(e) => onResizeDown(e, "FOLLOW")}
                    sx={{ position: "absolute", top: 0, right: 0, width: 8, cursor: "col-resize", height: "100%" }}
                  />
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((p) => {
              const selected = !!selectedIds?.has(p.idPerson);
              const baseFollow = isFollowed(p.idPerson);
              const hasOverride = followOverrides && Object.prototype.hasOwnProperty.call(followOverrides, p.idPerson);
              const followed = hasOverride ? !!followOverrides![p.idPerson] : baseFollow;
              const pending = !!followPending?.has(p.idPerson);

              // statut email
              const emailStatus = (p as any)?.emailStatus ?? "NONE";
              const emailMeta =
                emailStatus === "PRIMARY_VERIFIED"
                  ? { title: "E-mail principal vérifié", icon: <MarkEmailReadRoundedIcon sx={{ fontSize: 11 }} /> }
                  : emailStatus === "PRIMARY"
                  ? { title: "E-mail principal défini", icon: <MarkEmailUnreadRoundedIcon sx={{ fontSize: 11 }} /> }
                  : emailStatus === "HAS"
                  ? { title: "Au moins un e-mail", icon: <MailOutlineRoundedIcon sx={{ fontSize: 11 }} /> }
                  : { title: "Aucun e-mail", icon: null as React.ReactNode };

              // première valeur de la première colonne affichée (fallback avatar)
              const firstDisplayId = displayCols[0]?.id;
              const firstDisplayValue = firstDisplayId ? getAttrValue(p, firstDisplayId) : "";

              return (
                <TableRow key={p.idPerson} hover sx={{ height: 40 }}>
                  {selectionEnabled && (
                    <TableCell
                      padding="checkbox"
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Checkbox size="small" checked={selected} onClick={(e) => onRowCheckbox(e as any, p.idPerson)} />
                    </TableCell>
                  )}

                  {/* Avatar + badge email */}
                  <TableCell
                    sx={{
                      position: "sticky",
                      left: avatarLeft,
                      zIndex: 2,
                      backgroundColor: "background.paper",
                      width: AVATAR_COL_WIDTH,
                      minWidth: AVATAR_COL_WIDTH,
                      maxWidth: AVATAR_COL_WIDTH,
                      p: 0
                    }}
                  >
                    <Box sx={{ position: "relative", width: 28, height: 28, mx: "auto" }}>
                      <Avatar
                        src={p.photoSmallUrl ?? undefined}
                        alt={firstDisplayValue}
                        sx={{ width: 28, height: 28, fontSize: 12 }}
                      >
                        {(firstDisplayValue || "??").slice(0, 1).toUpperCase()}
                      </Avatar>

                      {emailMeta.icon && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: -2,
                            bottom: -2,
                          }}
                        >
                          <Tooltip title={emailMeta.title}>
                            <Box
                              sx={{
                                bgcolor: alpha(theme.palette.background.paper, 0.6),
                                borderRadius: "50%",
                                p: 0.25,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                border: `1px solid ${alpha(theme.palette.common.white, 0.16)}`,
                                backdropFilter: "blur(6px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: 16,
                                minHeight: 16,
                                lineHeight: 0,
                              }}
                              aria-label={emailMeta.title}
                            >
                              {emailMeta.icon}
                            </Box>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </TableCell>

                  {/* Cells unifiées */}
                  {displayCols.map((col) => {
                    const key = `C_${col.id}`;
                    const val = getAttrValue(p, col.id);
                    return (
                      <TableCell
                        key={`c-${p.idPerson}-${col.id}`}
                        onClick={() => onOpenPeek?.(p)}
                        sx={{ cursor: "pointer", minWidth: colWidths[key], width: colWidths[key] }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          title={val}
                          className={val ? undefined : "cell-empty"}
                        >
                          {val || "—"}
                        </Typography>
                      </TableCell>
                    );
                  })}

                  {/* Suivre */}
                  {!hideFollowFeatures && (
                    <TableCell
                      padding="checkbox"
                      align="center"
                      sx={{
                        position: "sticky",
                        right: 0,
                        zIndex: 1,
                        backgroundColor: "background.paper",
                        minWidth: colWidths["FOLLOW"],
                        width: colWidths["FOLLOW"]
                      }}
                    >
                      <Tooltip title={followed ? "Ne plus suivre" : "Suivre"}>
                        <span>
                          <IconButton
                            size="small"
                            aria-pressed={followed}
                            aria-label={followed ? "Ne plus suivre" : "Suivre"}
                            onClick={(e) => { e.stopPropagation(); if (!pending) onToggleFollow(p.idPerson, !followed); }}
                            disableRipple
                            sx={{
                              width: 28, height: 28, borderRadius: "50%",
                              pointerEvents: pending ? "none" : "auto",
                              opacity: pending ? 0.6 : 1,
                              color: followed ? theme.palette.success.main : theme.palette.text.primary,
                              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.45)}, ${alpha(theme.palette.background.paper, 0.25)})`,
                              border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`
                            }}
                          >
                            {followed ? <CheckCircleRoundedIcon sx={{ fontSize: 18 }} /> : <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TrombiTable;
