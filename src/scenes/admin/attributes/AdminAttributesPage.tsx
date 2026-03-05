import AddRoundedIcon from "@mui/icons-material/AddRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import AttributeFormDrawer from "./components/AttributeFormDrawer";
import AttributeList from "./components/AttributeList";

// ⬇️ Writes admin seulement
import { reorderAdminAttributes } from "../../../services/business/admin/admin.attributes.service";

// ⬇️ Pull ponctuel local (le Provider ne propose pas encore de refresh)
import { getAttributes } from "../../../services/business/attributes/attribute.service";

// ⬇️ Modèles domaine + constantes
import {
  Attribute,
  ATTRIBUTE_TYPES,
  AttributeType,
} from "../../../models/commons/Attribute/Attribute";

// ⬇️ Contexte global (lecture seule)
import { useTenantData } from "../../../contexts/TenantDataContext";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced as T;
}

// Infos de problème pour l’affichage dans la table
export type AttributeIssueInfo = {
  tags: Array<"primary-unused" | "category-no-filter" | "useless">;
  severity: "warning" | "error";
};

export default function AdminAttributesPage() {
  // ====== Global data (lecture) ======
  const { attributes: globalAttributes } = useTenantData();

  // ====== Local mirror (pour filtrer/paginer et refaire un pull ponctuel) ======
  const [attributes, setAttributes] = useState<Attribute[]>(globalAttributes ?? []);

  // Sync quand le Provider se met à jour
  useEffect(() => setAttributes(globalAttributes ?? []), [globalAttributes]);

  // ====== Filtres UI (client-side) ======
  const [q, setQ] = useState("");
  const [type, setType] = useState<AttributeType | "">("");
  const [filterable, setFilterable] = useState<"" | "true" | "false">("");
  const [sortable, setSortable] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  // "loading" uniquement pour nos pulls locaux
  const [loadingA, setLoadingA] = useState(false);

  const debounced = useDebounced({ q, type, filterable, sortable, page, pageSize }, 250);

  // ── Helpers services ─────────────────────────────────────────────────────────
  const hardRefreshAttributes = useCallback(async () => {
    try {
      setLoadingA(true);
      const fresh = await getAttributes({ options: true });
      setAttributes(fresh ?? []);
    } catch (e: any) {
      notifyError(e?.message || "Erreur lors de l’actualisation des attributs");
    } finally {
      setLoadingA(false);
    }
  }, []);

  // ── Filtrage côté client (copie locale) ──────────────────────────────────────
  const filteredAttributes = useMemo(() => {
    const qn = debounced.q.trim().toLowerCase();
    return (attributes ?? [])
      .filter((a) => (qn ? (a.name ?? "").toLowerCase().includes(qn) : true))
      .filter((a) => (debounced.type ? a.type === debounced.type : true))
      .filter((a) =>
        debounced.filterable === ""
          ? true
          : debounced.filterable === "true"
          ? !!(a as any).filter
          : !(a as any).filter
      )
      .filter((a) =>
        debounced.sortable === ""
          ? true
          : debounced.sortable === "true"
          ? !!(a as any).sort
          : !(a as any).sort
      )
      .sort((x, y) => {
        const dx = (x as any).displayOrder ?? 0;
        const dy = (y as any).displayOrder ?? 0;
        if (dx !== dy) return dx - dy;
        return (x.name ?? "").localeCompare(y.name ?? "");
      });
  }, [attributes, debounced]);

  const totalA = filteredAttributes.length;
  const pageStart = debounced.page * pageSize;
  const pageEnd = pageStart + pageSize;
  const pageRows = filteredAttributes.slice(pageStart, pageEnd);

  // ── Reorder de la page courante (recalcule l’offset global) ──────────────────
  const onReorder = async (rowsOfCurrentPage: Attribute[]) => {
    const offset = page * pageSize;
    const items = rowsOfCurrentPage.map((r, i) => ({
      id: (r as any).id,
      displayOrder: (offset + i + 1) * 10,
    }));
    try {
      await reorderAdminAttributes(items);
      // Optimistic update local
      setAttributes((prev) => {
        const map = new Map(prev.map((a) => [(a as any).id, a]));
        for (const it of items) {
          const found = map.get(it.id) as any;
          if (found) found.displayOrder = it.displayOrder;
        }
        return [...map.values()].sort(
          (x: any, y: any) => (x.displayOrder ?? 0) - (y.displayOrder ?? 0)
        );
      });
      notifySuccess("Ordre mis à jour");
    } catch (e: any) {
      notifyError(e?.message || "Erreur de réordonnancement");
      await hardRefreshAttributes();
    }
  };

  // ── Toolbar (attributs) ─────────────────────────────────────────────────────
  const AttributesToolbar = useMemo(
    () => (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 1 }}
      >
        <TextField
          size="small"
          placeholder="Rechercher un attribut…"
          value={q}
          onChange={(e) => {
            setPage(0);
            setQ(e.target.value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Rafraîchir (pull local)">
                  <span>
                    <IconButton size="small" onClick={hardRefreshAttributes}>
                      <RefreshRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          select
          size="small"
          label="Type"
          value={type}
          onChange={(e) => {
            setPage(0);
            setType(e.target.value as AttributeType | "");
          }}
          sx={{ width: 200 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">Tous</MenuItem>
          {ATTRIBUTE_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Filterable"
          value={filterable}
          onChange={(e) => {
            setPage(0);
            setFilterable(e.target.value as "" | "true" | "false");
          }}
          sx={{ width: 160 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">—</MenuItem>
          <MenuItem value="true">Oui</MenuItem>
          <MenuItem value="false">Non</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Sortable"
          value={sortable}
          onChange={(e) => {
            setPage(0);
            setSortable(e.target.value as "" | "true" | "false");
          }}
          sx={{ width: 160 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">—</MenuItem>
          <MenuItem value="true">Oui</MenuItem>
          <MenuItem value="false">Non</MenuItem>
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Chip
          icon={<AddRoundedIcon />}
          label="Nouvel attribut"
          color="primary"
          onClick={() => setDrawerA({ open: true, initial: null })}
          sx={{ cursor: "pointer" }}
        />
      </Stack>
    ),
    [q, type, filterable, sortable, hardRefreshAttributes]
  );

  // ── Health / Diagnostics (côté UI) ──────────────────────────────────────────
  // On conserve des checks utiles côté attributs (category => filter, "useless" si ni filter/sort/primary).
  const health = useMemo(() => {
    const rows = attributes ?? [];
    const issues: string[] = [];
    let usefulCount = 0;

    const badCategory: Attribute[] = [];
    const useless: Attribute[] = [];

    for (const a of rows) {
      const isPrimary = !!(a as any).primaryField;
      const isCategory = !!(a as any).category;
      const isFilter = !!(a as any).filter;
      const isSort = !!(a as any).sort;

      const isUseful = isFilter || isSort || isPrimary;
      if (isUseful) usefulCount++;
      else useless.push(a);

      if (isCategory && !isFilter) badCategory.push(a);
    }

    if (badCategory.length) {
      issues.push(
        `Attribut(s) category sans filtre activé: ${badCategory
          .map((x) => x.name)
          .join(", ")}`
      );
    }
    if (useless.length) {
      issues.push(
        `Attribut(s) potentiellement “inutiles” (ni filtre/sort, ni primary): ${useless
          .map((x) => x.name)
          .join(", ")}`
      );
    }

    const coverage = rows.length ? Math.round((usefulCount / rows.length) * 100) : 100;

    return {
      total: rows.length,
      useful: usefulCount,
      coverage,
      issues,
      badCategory,
      useless,
    };
  }, [attributes]);

  // Map id → problèmes (pour mise en valeur dans la table)
  const attributeIssuesById = useMemo(() => {
    const map = new Map<number, AttributeIssueInfo>();
    const upsert = (
      id: number,
      tag: AttributeIssueInfo["tags"][number],
      severity: AttributeIssueInfo["severity"]
    ) => {
      const prev = map.get(id);
      if (prev) {
        if (!prev.tags.includes(tag)) prev.tags.push(tag);
        if (severity === "error") prev.severity = "error";
      } else {
        map.set(id, { tags: [tag], severity });
      }
    };

    for (const a of health.badCategory) {
      if ((a as any).id != null) upsert((a as any).id, "category-no-filter", "warning");
    }
    for (const a of health.useless) {
      if ((a as any).id != null) upsert((a as any).id, "useless", "error");
    }
    return map;
  }, [health.badCategory, health.useless]);

  // ── Drawers/Dialogs state ───────────────────────────────────────────────────
  const [drawerA, setDrawerA] = useState<{ open: boolean; initial?: Attribute | null }>({
    open: false,
  });

  const onCloseAttributeDrawer = async (changed?: boolean) => {
    setDrawerA({ open: false });
    if (changed) {
      await hardRefreshAttributes();
      notifySuccess("Attribut enregistré");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Bandeau Health */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  Santé du schéma
                </Typography>
                <Chip size="small" label={`Attributs: ${health.total}`} variant="outlined" />
                <Chip
                  size="small"
                  label={`Utiles: ${health.useful}/${health.total}`}
                  color={
                    health.coverage === 100 ? "success" : health.coverage >= 80 ? "warning" : "error"
                  }
                  variant={health.coverage === 100 ? "filled" : "outlined"}
                />
                <Chip
                  size="small"
                  label={`Couverture: ${health.coverage}%`}
                  color={
                    health.coverage === 100 ? "success" : health.coverage >= 80 ? "warning" : "error"
                  }
                  variant={health.coverage === 100 ? "filled" : "outlined"}
                />
                <Box sx={{ flex: 1 }} />
              </Stack>
              {!!health.issues.length && (
                <Alert
                  severity="warning"
                  iconMapping={{ warning: <InfoOutlinedIcon /> }}
                  sx={{ mt: 1 }}
                >
                  <AlertTitle>Incohérences détectées</AlertTitle>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {health.issues.map((msg, i) => (
                      <li key={i}>
                        <Typography variant="body2">{msg}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                justifyContent="flex-end"
                flexWrap="wrap"
              >
                <Tooltip title="Rafraîchir Attributs">
                  <span>
                    <Chip
                      icon={<RefreshRoundedIcon />}
                      label="Refresh Attributs"
                      onClick={hardRefreshAttributes}
                      variant="outlined"
                      sx={{ cursor: "pointer" }}
                    />
                  </span>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Layout : uniquement liste Attributs */}
      <Grid container spacing={2} sx={{ minHeight: 0, flex: 1 }}>
        <Grid item xs={12} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {AttributesToolbar}
          <Divider sx={{ mb: 1 }} />
          {loadingA && attributes.length === 0 ? (
            <Skeleton variant="rounded" height={240} />
          ) : (
            <AttributeList
              rows={pageRows}
              page={page}
              pageSize={pageSize}
              total={totalA}
              onPageChange={setPage}
              onReorder={onReorder}
              onEdit={(row) => setDrawerA({ open: true, initial: row })}
              onCreate={() => setDrawerA({ open: true, initial: null })}
              onDeleted={async () => {
                await hardRefreshAttributes();
              }}
              issuesByAttributeId={attributeIssuesById}
            />
          )}

          <AttributeFormDrawer
            open={drawerA.open}
            initial={drawerA.initial || undefined}
            onClose={onCloseAttributeDrawer}
          />
        </Grid>
      </Grid>
    </Box>
  );
}