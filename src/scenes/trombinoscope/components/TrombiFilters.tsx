// src/pages/trombi/components/TrombiFilters.tsx
import React, { useMemo, useState } from "react";
import {
  Paper, Stack, TextField,
  Chip, Box, Typography, Button, Tooltip, Divider, IconButton, Collapse
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { AttributeFilterDto } from "../../../services/dto/person/search/PersonSearchRequestDto";
import { Attribute, AttributeType, isEnumRule, isRange } from "../../../models/commons/Attribute";

type Props = {
  filtersAttributes: Attribute[];
  selectedFilters: Record<number, { op: AttributeFilterDto["operator"]; values: string[] }>;
  onFiltersChange: (next: Props["selectedFilters"]) => void;

  /** Panneau rétractable contrôlé (fermé par défaut) */
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;

  /** Ref pour auto-close sur scroll dans la page */
  rootRef?: React.RefObject<HTMLDivElement>;
};

const DEFAULT_ENUM_VISIBLE = 10;

/* ---------------- Helpers typés ---------------- */
const getType = (a?: Attribute | null): AttributeType | undefined =>
  (a?.type ?? undefined) as AttributeType | undefined;

const getOptions = (a: Attribute) => a.options ?? [];

const isEnumAttr = (a: Attribute) =>
  getType(a) === "ENUM" || (a.options && a.options.length > 0) || isEnumRule(a.constraint);

const isCategoryAttr = (a: Attribute) =>
  Boolean(a.category) || (isEnumAttr(a) && (a.maxValues === 1 || a.required));

const isNumberAttr = (a: Attribute) =>
  getType(a) === "NUMBER" || (isRange(a.constraint) && !!a.constraint.range?.step);

const isDateLikeAttr = (a: Attribute) =>
  getType(a) === "DATE" || getType(a) === "DATETIME";

const isBooleanAttr = (a: Attribute) =>
  getType(a) === "BOOLEAN";

/** Texte et assimilés (gérés par la recherche globale) */
const isTextualOnly = (a: Attribute) =>
  getType(a) === "TEXT" || getType(a) === "URL" || getType(a) === "EMAIL";

const TrombiFilters: React.FC<Props> = ({
  filtersAttributes, selectedFilters, onFiltersChange,
  filtersOpen = false, onFiltersOpenChange, rootRef,
}) => {
  // Ranges (number/date) : brouillon local avant "Appliquer"
  const [rangeDraft, setRangeDraft] = useState<Record<number, { min: string; max: string }>>({});

  // ENUM UI : recherche interne + collapse par attribut
  const [enumQuery, setEnumQuery] = useState<Record<number, string>>({});
  const [enumCollapsed, setEnumCollapsed] = useState<Record<number, boolean>>({});

  const activePills = useMemo(() => {
    const byId = new Map<number, Attribute>();
    for (const a of filtersAttributes || []) byId.set(a.id, a);

    return Object.entries(selectedFilters).map(([idStr, entry]) => {
      const id = Number(idStr);
      const attr = byId.get(id);

      let label = attr?.name ?? `Attribut #${id}`;
      if (entry.op === "RANGE") {
        const [min, max] = entry.values;
        const pretty = [min || "…", max || "…"].join(" → ");
        label += ` : ${pretty}`;
      } else if (entry.op === "IN") {
        const opts = (attr?.options || []);
        const map = new Map(opts.map(o => [o.code, o.label || o.code]));
        const v = entry.values
          .map(val => map.get(val) ?? val)
          .slice(0, 3)
          .join(", ");
        const more = entry.values.length > 3 ? ` +${entry.values.length - 3}` : "";
        label += ` : ${v}${more}`;
      }
      return { id, label };
    });
  }, [filtersAttributes, selectedFilters]);

  /** Helpers ENUM */
  const filteredOptions = (attr: Attribute) => {
    const q = (enumQuery[attr.id] || "").toLowerCase().trim();
    const all = getOptions(attr);
    if (!q) return all;
    return all.filter(o => (o.label || o.code).toLowerCase().includes(q));
  };

  /** Apply helpers */
  const applyEnumValues = (attrId: number, values: string[]) => {
    if (values.length) onFiltersChange({ ...selectedFilters, [attrId]: { op: "IN", values } });
    else {
      const next = { ...selectedFilters };
      delete next[attrId];
      onFiltersChange(next);
    }
  };

  const toggleEnumValue = (attrId: number, value: string, exclusive = false) => {
    const cur = selectedFilters[attrId]?.values ?? [];
    if (exclusive) {
      const next = (cur.length === 1 && cur[0] === value) ? [] : [value];
      applyEnumValues(attrId, next);
      return;
    }
    const exists = cur.includes(value);
    const next = exists ? cur.filter(v => v !== value) : [...cur, value];
    applyEnumValues(attrId, next);
  };

  /** NUMBER/DATE ranges */
  const commitRange = (attrId: number) => {
    const d = rangeDraft[attrId] || { min: "", max: "" };
    const min = (d.min || "").trim();
    const max = (d.max || "").trim();
    if (!min && !max) {
      const next = { ...selectedFilters };
      delete next[attrId];
      onFiltersChange(next);
      return;
    }
    onFiltersChange({ ...selectedFilters, [attrId]: { op: "RANGE", values: [min, max] } });
  };

  return (
    <Box ref={rootRef}>
      <Collapse in={filtersOpen} timeout={180} unmountOnExit>
        <Paper variant="outlined" sx={{ p: 1, borderTop: 0 }}>
          {/* Résumé des filtres actifs */}
          {activePills.length > 0 && (
            <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {activePills.map(p => (
                <Chip
                  key={`pill-${p.id}`}
                  label={p.label}
                  onDelete={() => {
                    const next = { ...selectedFilters };
                    delete next[p.id];
                    onFiltersChange(next);
                    setRangeDraft(s => ({ ...s, [p.id]: { min: "", max: "" } }));
                  }}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}

          {/* Grille auto-fit + auto-span */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 1,
            }}
          >
            {(filtersAttributes || [])
              .filter(a => !isTextualOnly(a))
              .map((attr) => {
                const options = getOptions(attr);
                const picked = new Set(selectedFilters[attr.id]?.values ?? []);
                const hasDraft = !!rangeDraft[attr.id]?.min || !!rangeDraft[attr.id]?.max;
                const hasValue = picked.size > 0 || hasDraft;

                const avgLabelLen =
                  options?.length
                    ? options.reduce((s, o) => s + (o.label?.length ?? o.code.length), 0) / options.length
                    : 0;

                const isBigEnum =
                  (isEnumAttr(attr) || isCategoryAttr(attr)) &&
                  (options.length >= 10 || avgLabelLen >= 16);

                const fullWidth = isBigEnum || false;

                return (
                  <Box
                    key={`attr-${attr.id}`}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      border: (t) => `1px dashed ${t.palette.divider}`,
                      bgcolor: hasValue ? "action.hover" : "transparent",
                      gridColumn: fullWidth ? "1 / -1" : "auto",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.95, flex: 1 }}>
                        {attr.name ?? "Attribut"}
                      </Typography>

                      {(picked.size > 0 || selectedFilters[attr.id]) && (
                        <Tooltip title="Effacer">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const next = { ...selectedFilters }; delete next[attr.id]; onFiltersChange(next);
                                setRangeDraft((s) => ({ ...s, [attr.id]: { min: "", max: "" } }));
                                setEnumQuery(s => ({ ...s, [attr.id]: "" }));
                              }}
                              aria-label="Effacer ce filtre"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>

                    {/* CATEGORY (exclusive) */}
                    {isCategoryAttr(attr) && (
                      (() => {
                        const opts = (enumQuery[attr.id]?.trim()
                          ? filteredOptions(attr)
                          : getOptions(attr));
                        const collapsed = enumCollapsed[attr.id] ?? true;
                        const visible = collapsed ? opts.slice(0, DEFAULT_ENUM_VISIBLE) : opts;

                        return (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {visible.map((opt) => {
                              const selected = picked.has(opt.code);
                              const label = opt.label ?? opt.code;
                              return (
                                <Chip
                                  key={`${attr.id}-${opt.id}`}
                                  label={label}
                                  color={selected ? "primary" : "default"}
                                  variant={selected ? "filled" : "outlined"}
                                  size="small"
                                  onClick={() => toggleEnumValue(attr.id, opt.code, true)}
                                  sx={{ "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                                />
                              );
                            })}
                            {opts.length > DEFAULT_ENUM_VISIBLE && (
                              <Button
                                size="small"
                                onClick={() => setEnumCollapsed(s => ({ ...s, [attr.id]: !collapsed })) }
                                sx={{ ml: 0.5 }}
                              >
                                {collapsed ? `Afficher +${opts.length - DEFAULT_ENUM_VISIBLE}` : "Réduire"}
                              </Button>
                            )}
                          </Box>
                        );
                      })()
                    )}

                    {/* ENUM (multi) */}
                    {isEnumAttr(attr) && !isCategoryAttr(attr) && (
                      <>
                        {getOptions(attr).length > 8 && (
                          <TextField
                            size="small"
                            placeholder={`Filtrer ${attr.name ?? ""}…`}
                            value={enumQuery[attr.id] ?? ""}
                            onChange={(e) => setEnumQuery(s => ({ ...s, [attr.id]: e.target.value })) }
                            sx={{ mb: 0.75 }}
                            inputProps={{ "aria-label": `Filtrer ${attr.name}` }}
                          />
                        )}

                        {(() => {
                          const opts = filteredOptions(attr);
                          const collapsed = enumCollapsed[attr.id] ?? true;
                          const visible = collapsed ? opts.slice(0, DEFAULT_ENUM_VISIBLE) : opts;

                          return (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                              {visible.map((opt) => {
                                const selected = picked.has(opt.code);
                                const label = opt.label ?? opt.code;
                                return (
                                  <Chip
                                    key={`${attr.id}-${opt.id}`}
                                    label={label}
                                    color={selected ? "primary" : "default"}
                                    variant={selected ? "filled" : "outlined"}
                                    size="small"
                                    onClick={() => toggleEnumValue(attr.id, opt.code, false)}
                                    sx={{ "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                                  />
                                );
                              })}
                              {opts.length > DEFAULT_ENUM_VISIBLE && (
                                <Button
                                  size="small"
                                  onClick={() => setEnumCollapsed(s => ({ ...s, [attr.id]: !collapsed })) }
                                  sx={{ ml: 0.5 }}
                                >
                                  {collapsed ? `Afficher +${opts.length - DEFAULT_ENUM_VISIBLE}` : "Réduire"}
                                </Button>
                              )}
                            </Box>
                          );
                        })()}
                      </>
                    )}

                    {/* NUMBER */}
                    {isNumberAttr(attr) && (
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                        <TextField
                          size="small"
                          label="Min"
                          type="number"
                          value={rangeDraft[attr.id]?.min ?? selectedFilters[attr.id]?.values?.[0] ?? ""}
                          onChange={(e) =>
                            setRangeDraft((s) => ({
                              ...s,
                              [attr.id]: { min: e.target.value, max: s[attr.id]?.max ?? selectedFilters[attr.id]?.values?.[1] ?? "" },
                            }))
                          }
                          sx={{ flex: 1 }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          size="small"
                          label="Max"
                          type="number"
                          value={rangeDraft[attr.id]?.max ?? selectedFilters[attr.id]?.values?.[1] ?? ""}
                          onChange={(e) =>
                            setRangeDraft((s) => ({
                              ...s,
                              [attr.id]: { min: s[attr.id]?.min ?? selectedFilters[attr.id]?.values?.[0] ?? "", max: e.target.value },
                            }))
                          }
                          sx={{ flex: 1 }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <Button size="small" onClick={() => commitRange(attr.id)}>Appliquer</Button>
                      </Stack>
                    )}

                    {/* DATE / DATETIME */}
                    {isDateLikeAttr(attr) && (
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                        <TextField
                          size="small"
                          label="Début"
                          type="date"
                          value={rangeDraft[attr.id]?.min ?? selectedFilters[attr.id]?.values?.[0] ?? ""}
                          onChange={(e) =>
                            setRangeDraft((s) => ({
                              ...s,
                              [attr.id]: { min: e.target.value, max: s[attr.id]?.max ?? selectedFilters[attr.id]?.values?.[1] ?? "" },
                            }))
                          }
                          sx={{ flex: 1 }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          size="small"
                          label="Fin"
                          type="date"
                          value={rangeDraft[attr.id]?.max ?? selectedFilters[attr.id]?.values?.[1] ?? ""}
                          onChange={(e) =>
                            setRangeDraft((s) => ({
                              ...s,
                              [attr.id]: { min: s[attr.id]?.min ?? selectedFilters[attr.id]?.values?.[0] ?? "", max: e.target.value },
                            }))
                          }
                          sx={{ flex: 1 }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <Button size="small" onClick={() => commitRange(attr.id)}>Appliquer</Button>
                      </Stack>
                    )}

                    {/* BOOLEAN */}
                    {isBooleanAttr(attr) && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {[{ code: "true", label: "Oui" }, { code: "false", label: "Non" }].map(opt => {
                          const selected = picked.has(opt.code);
                          return (
                            <Chip
                              key={`${attr.id}-${opt.code}`}
                              label={opt.label}
                              color={selected ? "primary" : "default"}
                              variant={selected ? "filled" : "outlined"}
                              size="small"
                              onClick={() => toggleEnumValue(attr.id, opt.code, true)}
                              sx={{ "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}
          </Box>

          <Divider sx={{ mt: 1 }} />
          <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button
              size="small"
              onClick={() => {
                onFiltersChange({});
                setRangeDraft({});
                setEnumQuery({});
                setEnumCollapsed({});
              }}
              disabled={Object.values(selectedFilters).every(v => !v?.values?.length)}
            >
              Réinitialiser les filtres
            </Button>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default TrombiFilters;
