// src/pages/trombi/components/TrombiSorts.tsx
import React, { useMemo } from "react";
import {
  Box, Button, Chip, Collapse, IconButton, MenuItem, Paper, Select, Stack,
  Tooltip, Typography, FormControl, Divider, Grid, SelectChangeEvent
} from "@mui/material";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Attribute } from "../../../models/commons/Attribute/Attribute";
import { SortValue } from "../types";

type Props = {
  sortsAttributes: Attribute[];
  selectedSort?: SortValue;
  onSortChange: (s: SortValue | undefined) => void;

  /** Panneau rétractable contrôlé */
  sortsOpen?: boolean;
};

/** Champs “spéciaux” supportés par le backend */
const SPECIAL_FIELDS = {
  FOLLOWED_FIRST: "followedFirst",
  RANDOM: "random",
} as const;

const isSpecialField = (v?: SortValue) =>
  v?.kind === "FIELD" &&
  (v.field === SPECIAL_FIELDS.FOLLOWED_FIRST || v.field === SPECIAL_FIELDS.RANDOM);

const TrombiSorts: React.FC<Props> = ({
  sortsAttributes, selectedSort, onSortChange,
  sortsOpen = false,
}) => {
  const activePill = useMemo(() => {
    if (!selectedSort) return undefined;

    if (selectedSort.kind === "FIELD") {
      if (selectedSort.field === SPECIAL_FIELDS.FOLLOWED_FIRST) return "Suivis d’abord";
      if (selectedSort.field === SPECIAL_FIELDS.RANDOM) return "Aléatoire";
      return `${selectedSort.field} ${selectedSort.direction === "ASC" ? "↑" : "↓"}`;
    }

    if (selectedSort.kind === "ATTRIBUTE") {
      const attr = (sortsAttributes || []).find(a => a.id === selectedSort.attributeId);
      const name = attr?.name ?? `Attribut #${selectedSort.attributeId}`;
      return `${name} ${selectedSort.direction === "ASC" ? "↑" : "↓"}`;
    }
  }, [selectedSort, sortsAttributes]);

  const clearSort = () => onSortChange(undefined);

  const toggleFollowedFirst = () => {
    if (selectedSort?.kind === "FIELD" && selectedSort.field === SPECIAL_FIELDS.FOLLOWED_FIRST) {
      onSortChange(undefined);
    } else {
      onSortChange({ kind: "FIELD", field: SPECIAL_FIELDS.FOLLOWED_FIRST, direction: "ASC" });
    }
  };

  const toggleRandom = () => {
    if (selectedSort?.kind === "FIELD" && selectedSort.field === SPECIAL_FIELDS.RANDOM) {
      onSortChange(undefined);
    } else {
      onSortChange({ kind: "FIELD", field: SPECIAL_FIELDS.RANDOM, direction: "ASC" });
    }
  };

  const isFollowedFirst = selectedSort?.kind === "FIELD" && selectedSort.field === SPECIAL_FIELDS.FOLLOWED_FIRST;
  const isRandom = selectedSort?.kind === "FIELD" && selectedSort.field === SPECIAL_FIELDS.RANDOM;

  const attrChosen = selectedSort?.kind === "ATTRIBUTE" && selectedSort.attributeId != null;

  // ---- Valeur contrôlée nativement en number
  const selectedAttrId: number | "" =
    selectedSort?.kind === "ATTRIBUTE" && selectedSort.attributeId != null
      ? selectedSort.attributeId
      : "";

  const handleSelectAttr = (e: SelectChangeEvent<number | "">) => {
    const val = e.target.value;
    if (val === "" || val === undefined) {
      onSortChange(undefined);
      return;
    }
    const id = Number(val);
    onSortChange({
      kind: "ATTRIBUTE",
      attributeId: id,
      direction: selectedSort?.kind === "ATTRIBUTE" ? selectedSort.direction : "ASC",
    });
  };

  const renderAttrValue = (v: unknown) => {
    if (v === "" || v == null) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", opacity: 0.7, fontSize: "0.8rem", minWidth: 0 }}>
          <SortOutlinedIcon fontSize="small" />
          <Box component="span" sx={{ ml: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Choisir un attribut
          </Box>
        </Box>
      );
    }
    const id = Number(v);
    const attr = (sortsAttributes || []).find(a => a.id === id);
    return attr?.name ?? `Attribut #${id}`;
  };

  return (
    <Collapse in={sortsOpen} timeout={180} unmountOnExit>
      <Paper variant="outlined" sx={{ p: 1, borderTop: 0, overflow: "hidden" }}>
        {/* Résumé pill */}
        {activePill && (
          <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 0.75, minWidth: 0 }}>
            <Chip
              label={activePill}
              onDelete={clearSort}
              size="small"
              variant="outlined"
              sx={{ maxWidth: "100%" }}
            />
          </Box>
        )}

        <Grid container spacing={1} alignItems="stretch" sx={{ minWidth: 0 }}>
          {/* Ordre par attribut — À GAUCHE */}
          <Grid item xs={12} md={6} sx={{ minWidth: 0, display: "flex" }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                border: (t) => `1px dashed ${t.palette.divider}`,
                bgcolor: selectedSort?.kind === "ATTRIBUTE" ? "action.hover" : "transparent",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                minWidth: 0,
                flex: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.95, flex: 1, minWidth: 0 }}>
                  Ordre par attribut
                </Typography>
                {selectedSort?.kind === "ATTRIBUTE" && (
                  <Tooltip title="Effacer">
                    <span>
                      <IconButton size="small" onClick={clearSort} aria-label="Effacer ce tri">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={0.75}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ minWidth: 0 }}
              >
                <FormControl size="small" fullWidth sx={{ minWidth: 0 }}>
                  <Select<number | "">
                    fullWidth
                    value={selectedAttrId}
                    displayEmpty
                    onChange={handleSelectAttr}
                    renderValue={renderAttrValue}
                    sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                    inputProps={{ "aria-label": "Attribut" }}
                  >
                    <MenuItem value=""><em>Aucun</em></MenuItem>
                    {(sortsAttributes || []).map((a) => (
                      <MenuItem key={`sort-attr-${a?.id ?? Math.random()}`} value={a.id as number}>
                        {a.name ?? "Attribut"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Sens de tri pour attribut */}
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                  {(["ASC", "DESC"] as const).map((dir) => {
                    const active =
                      selectedSort?.kind === "ATTRIBUTE" && selectedSort.direction === dir;
                    return (
                      <Chip
                        key={`attr-dir-${dir}`}
                        label={dir === "ASC" ? "↑ Ascendant" : "↓ Descendant"}
                        color={active ? "primary" : "default"}
                        variant={active ? "filled" : "outlined"}
                        size="small"
                        onClick={() => {
                          if (selectedSort?.kind === "ATTRIBUTE" && selectedSort.attributeId != null) {
                            onSortChange({
                              kind: "ATTRIBUTE",
                              attributeId: selectedSort.attributeId,
                              direction: dir,
                            });
                          }
                        }}
                        disabled={!attrChosen}
                        sx={{ "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                      />
                    );
                  })}
                </Stack>
              </Stack>
            </Box>
          </Grid>

          {/* Options rapides — À DROITE */}
          <Grid item xs={12} md={6} sx={{ minWidth: 0, display: "flex" }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                border: (t) => `1px dashed ${t.palette.divider}`,
                bgcolor: isSpecialField(selectedSort) ? "action.hover" : "transparent",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                minWidth: 0,
                flex: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.95, flex: 1, minWidth: 0 }}>
                  Options rapides
                </Typography>
                {isSpecialField(selectedSort) && (
                  <Tooltip title="Effacer">
                    <span>
                      <IconButton size="small" onClick={clearSort} aria-label="Effacer ce tri">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>

              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ minWidth: 0 }}>
                <Chip
                  icon={<StarRoundedIcon fontSize="small" />}
                  label="Suivis d’abord"
                  color={isFollowedFirst ? "primary" : "default"}
                  variant={isFollowedFirst ? "filled" : "outlined"}
                  size="small"
                  onClick={toggleFollowedFirst}
                  sx={{ "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                />
                <Chip
                  icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
                  label="Aléatoire"
                  color={isRandom ? "primary" : "default"}
                  variant={isRandom ? "filled" : "outlined"}
                  size="small"
                  onClick={toggleRandom}
                  sx={{ "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                />
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 1 }} />
        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button size="small" onClick={clearSort} disabled={!selectedSort}>
            Réinitialiser le tri
          </Button>
        </Stack>
      </Paper>
    </Collapse>
  );
};

export default TrombiSorts;
