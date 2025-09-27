import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";      // ✓ Suivi
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";  // + Suivre
import CloseIcon from "@mui/icons-material/Close";

import { useGlobalData } from "../../../contexts/GlobalDataContext";
import { Attribute } from "../../../models/commons/Attribute";
import {
  PersonCardDto,
  PersonAttributeExtraDto
} from "../../../services/dto/person/search/PersonCardDtos";
import { getPersonAttributesById } from "../../../services/business/persons/person.service";

import PhotoResponsive from "./personPeek/PhotoResponsive";
import AttributeGrid, { AttributeGroup } from "./personPeek/AttributeGrid";
import { displayName, mapLiteToExtra, useAttributeMeta } from "./personPeek/utils";

type Props = {
  open: boolean;
  person: PersonCardDto | null;
  onClose: () => void;

  isFollowed: (id: number) => boolean;
  followOverrides?: Record<number, boolean | undefined>;
  followPending?: Set<number>;
  onToggleFollow: (id: number, target: boolean) => Promise<void>;

  attributes?: Attribute[];
};

const ATTR_CACHE = new Map<number, PersonAttributeExtraDto[]>();

export default function PersonPeekDialog({
  open,
  person,
  onClose,
  isFollowed,
  followOverrides,
  followPending,
  onToggleFollow,
  attributes: attributesProp,
}: Props) {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));
  const { attributes: ctxAttributes } = useGlobalData();
  const attributes = attributesProp ?? ctxAttributes;

  const p = person;
  const name = useMemo(() => displayName(p), [p]);
  const initials =
    (name.split(/\s+/).filter(Boolean).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()) || "?";

  const {
    getAttrLabel,
    getAttrOrder,
    prettyValue,
    isCategoryAttr,
    isPrimaryAttr,     // ← utilisé pour ne pas ré-afficher les primaires en bas
    isLongTextAttr
  } = useAttributeMeta(attributes);

  // Suivi (optimistic)
  const baseFollow = p ? isFollowed(p.idPerson) || !!p.followed : false;
  const override =
    p && followOverrides && Object.prototype.hasOwnProperty.call(followOverrides, p.idPerson)
      ? !!followOverrides[p.idPerson]
      : undefined;
  const followed = override ?? baseFollow;
  const pending  = p ? !!followPending?.has(p.idPerson) : false;

  const photoUrl = p?.photoLargeUrl || p?.photoSmallUrl || undefined;

  // Attributs back (complets)
  const [loadingAttrs, setLoadingAttrs] = useState(false);
  const [fetchedExtras, setFetchedExtras] = useState<PersonAttributeExtraDto[] | null>(null);

  useEffect(() => {
    (async () => {
      if (!open || !p?.idPerson) return;

      const fromCache = ATTR_CACHE.get(p.idPerson);
      if (fromCache) { setFetchedExtras(fromCache); return; }

      setLoadingAttrs(true);
      try {
        const raw = await getPersonAttributesById(p.idPerson);
        const extras = mapLiteToExtra(raw);
        ATTR_CACHE.set(p.idPerson, extras);
        setFetchedExtras(extras);
      } catch (e) {
        console.error("[PersonPeekDialog] getPersonAttributesById failed", e);
        setFetchedExtras(null);
      } finally {
        setLoadingAttrs(false);
      }
    })();
  }, [open, p?.idPerson]);

  // Fusion card + fetched → multi-valeurs par attribut (sans primaires)
  const attributeGroups: AttributeGroup[] = useMemo(() => {
    const acc = new Map<number, string[]>();
    const push = (list?: PersonAttributeExtraDto[] | null) => {
      (list ?? []).forEach((e) => {
        const id = e?.attributeId, v = e?.value;
        if (id == null || v == null) return;
        const arr = acc.get(id) ?? [];
        if (!arr.includes(v)) arr.push(v);
        acc.set(id, arr);
      });
    };
    push(p?.extraAttributes);
    push(fetchedExtras);

    return Array.from(acc.entries())
      .map(([attributeId, values]) => ({ attributeId, values }))
      .filter(g => !isPrimaryAttr(g.attributeId)) // ← on enlève les champs primaires
      .sort((a, b) => getAttrOrder(a.attributeId) - getAttrOrder(b.attributeId));
  }, [p?.extraAttributes, fetchedExtras, getAttrOrder, isPrimaryAttr]);

  // On **désactive** l’affichage des catégories sous le nom (tu préfères sans)
  const SHOW_CATEGORY_CHIPS_UNDER_NAME = false;
  const categoryLabels: string[] = [];

  // Hauteur max adaptative de la photo si viewport “court”
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const photoMaxVh = vh >= 900 ? 62 : vh >= 780 ? 58 : vh >= 680 ? 54 : 50;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" } },
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          background: alpha(theme.palette.background.paper, 0.55),
          backdropFilter: "blur(16px) saturate(140%)",
          border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          width: { xs: "calc(100vw - 24px)", sm: "min(900px, 92vw)", md: "min(1100px, 92vw)", lg: "min(1280px, 92vw)" },
        },
      }}
    >
      <IconButton aria-label="Fermer" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}>
        <CloseIcon />
      </IconButton>

      <DialogContent
        dividers
        sx={{
          p: { xs: 2, sm: 3 },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // ← scroll seulement en bas
          "&.MuiDialogContent-dividers": { borderColor: alpha(theme.palette.common.white, 0.08) },
        }}
      >
        {/* Bloc non scrollable : photo + nom + bouton suivi */}
        <Box>
          {loadingAttrs && !photoUrl ? (
            <Skeleton variant="rounded" height={downSm ? 240 : 360} sx={{ borderRadius: 2, mb: 2 }} />
          ) : (
            <PhotoResponsive
              src={photoUrl}
              alt={name}
              initials={initials}
              maxVh={photoMaxVh}
              minShortEdge={320}
              maxUpscale={2.0}
            />
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mt: 2 }}
          >
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.2, wordBreak: "break-word" }}>
                {name}
              </Typography>

              {SHOW_CATEGORY_CHIPS_UNDER_NAME && !!categoryLabels.length && (
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {categoryLabels.map((label, i) => (
                    <Chip key={i} size="small" variant="filled" label={label} sx={{ maxWidth: "100%" }} />
                  ))}
                </Stack>
              )}
            </Stack>

            <Tooltip title={followed ? "Ne plus suivre" : "Suivre"}>
              <span>
                <Button
                  variant={followed ? "contained" : "outlined"}
                  color={followed ? "success" : "primary"}
                  startIcon={
                    pending
                      ? <CircularProgress size={16} />
                      : (followed ? <CheckCircleRoundedIcon /> : <PersonAddAlt1RoundedIcon />)
                  }
                  disabled={!p || pending}
                  onClick={async () => {
                    if (!p || pending) return;
                    await onToggleFollow(p.idPerson, !followed);
                  }}
                  sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
                >
                  {followed ? "Suivi" : "Suivre"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5, opacity: 0.6 }} />

        {/* Seule zone scrollable : liste d’attributs (sans primaires) */}
        <Box sx={{ flex: 1, minHeight: 120, overflowY: "auto", pr: 0.5 }}>
          <AttributeGrid
            groups={attributeGroups}
            getAttrLabel={getAttrLabel}
            prettyValue={prettyValue}
            isLongTextAttr={isLongTextAttr}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
