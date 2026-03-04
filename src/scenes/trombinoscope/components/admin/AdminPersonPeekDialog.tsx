// src/components/trombinoscope/components/AdminPersonPeekDialog.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";

import QRCode from "react-qr-code";

import { useOrgData } from "../../../../contexts/OrgDataContext";
import { Attribute } from "../../../../models/commons/Attribute/Attribute";
import PhotoResponsive from "../personPeek/PhotoResponsive";
import AttributeGrid, {
  AttributeGroup,
} from "../personPeek/AttributeGrid";
import {
  displayName as buildDisplayName,
  useAttributeMeta,
} from "../personPeek/utils";

import {
  PersonCardDto,
  PersonCardStub,
} from "../../../../services/dto/person/search/PersonCardDtos";
import { getAdminPersonDetails } from "../../../../services/business/admin/admin.service";
import { AdminPersonDetailsDto } from "../../../../services/dto/person/admin/AdminPersonDetailsDto";
import { formatRole } from "../../../../models/tenants/UserTenant";
import AdminChangeRequestReviewDialog from "../personPeek/AdminChangeRequestReviewDialog";
import { ChangeRequestSummary } from "../../../../models/commons/Profile/ChangeRequest";
import AdminChangeRequestCard from "./AdminChangeRequestCard";
import { ResolveChangeRequestDto } from "../../../../services/dto/admin/change-requests";
import { resolveChangeRequest } from "../../../../services/business/admin/admin.changeRequests.service";

import { PersonEmailDto } from "../../../../services/dto/person/admin/PersonEmailDto";

import { AdminPersonInvitationsSection } from "./cr/AdminPersonInvitationsSection";

type Props = {
  open: boolean;
  person: PersonCardDto | PersonCardStub | null; // stub ou card
  onClose: () => void;
  attributes?: Attribute[];
  onEdit?: (person: PersonCardDto | PersonCardStub) => void | Promise<void>;
};

type Snapshot = "current" | "future";

export default function AdminPersonPeekDialog({
  open,
  person,
  onClose,
  attributes: attributesProp,
  onEdit,
}: Props) {
  if (!person) return null;

  const theme = useTheme();
  const { attributes: ctxAttributes } = useOrgData();
  const attributes = attributesProp ?? ctxAttributes;

  const p = person;

  const {
    getAttrLabel,
    getAttrMaxValues,
    getAttrOrder,
    prettyValue,
    isPrimaryAttr,
    isLongTextAttr,
  } = useAttributeMeta(attributes);

  // Chargement des détails admin (photos + attributs datés + changeRequests + emails)
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<AdminPersonDetailsDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastLoadedPersonIdRef = useRef<number | null>(null);

  const refreshDetails = async () => {
    if (!p?.idPerson) return;
    const personId = p.idPerson;

    setLoading(true);
    setLoadError(null);
    try {
      const d = await getAdminPersonDetails(personId, {
        includeFuture: true,
        includeChangeRequests: true,
      });
      setDetails(d);
      lastLoadedPersonIdRef.current = personId;
    } catch (e) {
      console.error(
        "[AdminPersonPeekDialog] getAdminPersonDetails failed",
        e
      );
      setLoadError(
        "Erreur lors du rafraîchissement de la fiche. Les informations affichées peuvent ne pas être à jour."
      );
      if (lastLoadedPersonIdRef.current !== personId) {
        setDetails(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !p?.idPerson) return;
    void refreshDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, p?.idPerson]);

  /* =======================
     Helpers dates
  ======================= */

  const now = useMemo(() => new Date(), []);

  const isActiveAt = (
    date: Date,
    validFrom?: string,
    validTo?: string | null,
    pendingDelete?: boolean
  ) => {
    if (pendingDelete) return false;
    const from = validFrom ? new Date(validFrom) : undefined;
    const to = validTo ? new Date(validTo) : undefined;
    if (from && date < from) return false;
    if (to && date >= to) return false;
    return true;
  };

  const seasonAnchor = useMemo(() => {
    const futureFroms =
      (details?.person?.attributes ?? [])
        .map((a) => (a.validFrom ? new Date(a.validFrom) : null))
        .filter((d): d is Date => !!d && d > now)
        .sort((a, b) => +a - +b);
    return futureFroms[0] ?? now;
  }, [details?.person?.attributes, now]);

  const hasFutureAttributes = useMemo(
    () =>
      !!(details?.person?.attributes ?? []).some((a) =>
        isActiveAt(seasonAnchor, a.validFrom, a.validTo, a.pendingDelete)
      ),
    [details?.person?.attributes, seasonAnchor]
  );

  const [snapshot, setSnapshot] = useState<Snapshot>("current");
  useEffect(() => {
    if (open) setSnapshot("current");
  }, [open, p?.idPerson]);
  useEffect(() => {
    if (snapshot === "future" && !hasFutureAttributes) setSnapshot("current");
  }, [snapshot, hasFutureAttributes]);

  /**
   * DisplayName robuste
   */
  const resolvedDisplayName = useMemo(() => {
    if (!p) return "(Nom indisponible)";

    const fromDetails = (details?.person as any)?.displayName;
    if (fromDetails != null && String(fromDetails).trim()) {
      return String(fromDetails).trim();
    }

    const direct = (p as any).displayName;
    if (direct != null && String(direct).trim()) {
      return String(direct).trim();
    }

    const primVals: string[] = (details?.person?.attributes ?? [])
      .filter((a) => isPrimaryAttr(a.attributeId))
      .filter((a) =>
        isActiveAt(now, a.validFrom, a.validTo, a.pendingDelete)
      )
      .map((a) => (a.value ?? "").trim())
      .filter(Boolean);

    if (primVals.length > 0) {
      const uniq: string[] = [];
      for (const v of primVals) {
        if (!uniq.includes(v)) uniq.push(v);
      }
      const joined = uniq.join(" ").trim();
      if (joined) return joined;
    }

    const fallbackSource = (details?.person as any) ?? (p as any);
    const fallback = buildDisplayName(fallbackSource);
    const asString = fallback != null ? String(fallback).trim() : "";

    if (!asString || /^#?\d+$/.test(asString)) {
      console.warn(
        "[AdminPersonPeekDialog] Impossible de construire un displayName correct pour la fiche :",
        {
          personProp: p,
          details,
          computed: asString,
        }
      );
      return "(Nom indisponible)";
    }

    return asString;
  }, [p, details, isPrimaryAttr, now]);

  const photoUrl = useMemo(() => {
    const approved =
      details?.person?.photos?.find((ph) => ph.status === "APPROVED")?.url ??
      details?.person?.photos?.[0]?.url;
    if (approved) return approved;
    return (
      (p as any)?.photoLargeUrl || (p as any)?.photoSmallUrl || undefined
    );
  }, [details?.person?.photos, p]);

  const initials = useMemo(
    () =>
      (resolvedDisplayName
        .split(/\s+/)
        .filter(Boolean)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()) || "?",
    [resolvedDisplayName]
  );

  /* =======================
     Projection attributs
  ======================= */

  function toGroupsFromPerson(view: Snapshot): AttributeGroup[] {
    const acc = new Map<number, string[]>();
    const list = details?.person?.attributes ?? [];

    for (const a of list) {
      const pick =
        view === "current"
          ? isActiveAt(now, a.validFrom, a.validTo, a.pendingDelete)
          : isActiveAt(
              seasonAnchor,
              a.validFrom,
              a.validTo,
              a.pendingDelete
            );
      if (!pick) continue;

      const id = a.attributeId;
      const v = a.value;
      if (id == null || v == null) continue;

      const arr = acc.get(id) ?? [];
      if (!arr.includes(v)) arr.push(v);
      acc.set(id, arr);
    }

    return Array.from(acc.entries())
      .map(([attributeId, values]) => ({ attributeId, values }))
      .filter((g) => !isPrimaryAttr(g.attributeId))
      .sort(
        (a, b) => getAttrOrder(a.attributeId) - getAttrOrder(b.attributeId)
      );
  }

  const groups = useMemo(
    () => toGroupsFromPerson(snapshot),
    [
      details?.person?.attributes,
      snapshot,
      now,
      seasonAnchor,
      getAttrOrder,
      isPrimaryAttr,
    ]
  );

  // Indication “lié à un utilisateur ?”
  const linkedUser = details?.user ?? null;

  // =========================
  //  Emails (uniquement pour suggestions d'invitation)
  // =========================
  const emails: PersonEmailDto[] = useMemo(
    () => details?.emails ?? [],
    [details?.emails]
  );

  // =========================
  //  Lien d’invitation (pour lien / QR)
  // =========================
  const inviteUrl: string | null = useMemo(() => {
    const raw =
      (details as any)?.defaultInviteUrl ??
      (details as any)?.inviteUrl ??
      (details as any)?.person?.defaultInviteUrl ??
      null;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    return null;
  }, [details]);

  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [showQrInline, setShowQrInline] = useState(false);

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteLinkCopied(true);
      window.setTimeout(() => setInviteLinkCopied(false), 1800);
    } catch (e) {
      console.error("[AdminPersonPeekDialog] copy invite link failed", e);
    }
  };

  // =========================
  //  Change requests
  // =========================
  const hasChangeRequests = (details?.changeRequests?.length ?? 0) > 0;

  // ====== Review dialog state ======
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCR, setReviewCR] = useState<ChangeRequestSummary | null>(null);
  const invitationSectionRef = useRef<HTMLDivElement | null>(null);
  const [inviteFormSignal, setInviteFormSignal] = useState(0);

  const handleSubmitResolution = async (
    changeRequestId: number,
    dto: ResolveChangeRequestDto
  ) => {
    await resolveChangeRequest(changeRequestId, dto);
    await refreshDetails();
    setReviewOpen(false);
    setReviewCR(null);
  };

  // =========================
  //  Header photo : expand / collapse (et auto au scroll)
  // =========================
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapseThreshold = 220;
  const expandThreshold = 120;

  useEffect(() => {
    if (open) setIsCollapsed(false);
  }, [open, p?.idPerson]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = (e.currentTarget as HTMLDivElement).scrollTop;
    if (!isCollapsed && y > collapseThreshold) setIsCollapsed(true);
    else if (isCollapsed && y < expandThreshold) setIsCollapsed(false);
  };

  const photoMaxHeight = isCollapsed ? 220 : 420;
  const photoMaxVh = isCollapsed ? 40 : 62;
  const photoMinShortEdge = isCollapsed ? 220 : 320;

  // =========================
  //  Compte utilisateur – vue simplifiée + zone avancée
  // =========================
  const [accessDetailsOpen, setAccessDetailsOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setAccessDetailsOpen(false);
      setShowQrInline(false);
      setInviteLinkCopied(false);
    }
  }, [open]);

  const openInviteForm = () => {
    setAccessDetailsOpen(true);
    setInviteFormSignal((v) => v + 1);
    window.setTimeout(() => {
      invitationSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  };

  const scrollToChangeRequests = () => {
    const el = document.getElementById("change-requests-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Styles de cartes
  const cardBase = {
    borderRadius: 2,
    border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    p: { xs: 1.5, sm: 2 },
  } as const;

  const changeRequestsCard = hasChangeRequests
    ? {
        ...cardBase,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.32)",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.warning.light,
          0.12
        )}, ${alpha(theme.palette.background.paper, 0.92)})`,
      }
    : {
        ...cardBase,
        border: `1px dashed ${alpha(theme.palette.text.primary, 0.25)}`,
        background: alpha(theme.palette.background.paper, 0.82),
      };

  const secondaryCard = {
    ...cardBase,
    border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
  } as const;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          background: alpha(theme.palette.background.paper, 0.55),
          backdropFilter: "blur(16px) saturate(140%)",
          border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          width: {
            xs: "calc(100vw - 24px)",
            sm: "min(900px, 92vw)",
            md: "min(1100px, 92vw)",
            lg: "min(1280px, 92vw)",
          },
        },
      }}
    >
      <IconButton
        aria-label="Fermer"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        dividers
        onScroll={handleScroll}
        sx={{
          p: { xs: 2, sm: 3 },
          display: "flex",
          flexDirection: "column",
          rowGap: { xs: 2, sm: 2.5 },
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
          minHeight: 0,
          "&.MuiDialogContent-dividers": {
            borderColor: alpha(theme.palette.common.white, 0.08),
          },
          scrollbarWidth: "thin",
          scrollbarColor: `${theme.palette.primary.main} transparent`,
          "&::-webkit-scrollbar": { width: 8, height: 8 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.primary.main,
            borderRadius: 4,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
        }}
      >
        {/* HERO : photo + nom + snapshot toggle + CR badge */}
        <Box>
          <Box
            sx={{
              mb: isCollapsed ? 1.5 : 2.5,
              transition:
                "margin-bottom 0.28s ease, transform 0.28s ease, filter 0.28s ease",
              overflow: "visible",
              transform: isCollapsed ? "scale(0.9)" : "scale(1)",
              transformOrigin: "top center",
              filter: `drop-shadow(0 12px 24px rgba(0,0,0,${
                isCollapsed ? 0.18 : 0.35
              }))`,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {loading && !photoUrl ? (
              <Skeleton
                variant="rounded"
                height={photoMaxHeight}
                sx={{ borderRadius: 2, width: "100%", maxWidth: 760 }}
              />
            ) : (
              <PhotoResponsive
                src={photoUrl}
                alt={resolvedDisplayName}
                initials={initials}
                maxVh={photoMaxVh}
                minShortEdge={photoMinShortEdge}
                maxUpscale={2.0}
                maxHeightPx={photoMaxHeight}
              />
            )}
          </Box>

          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(14px) saturate(130%)",
              borderRadius: 2,
              px: { xs: 1.25, sm: 1.75 },
              py: { xs: 1.25, sm: 1.5 },
              border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
              boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1, sm: 1.5 },
              alignItems: "center",
            }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h6"
                sx={{ lineHeight: 1.2, wordBreak: "break-word" }}
              >
                {resolvedDisplayName}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                {linkedUser ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    divider={
                      <Divider
                        flexItem
                        orientation="vertical"
                        sx={{ opacity: 0.35 }}
                      />
                    }
                  >
                    <Chip color="success" size="small" label="Compte lié" />
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                      {linkedUser.tenantRole
                        ? `${formatRole(linkedUser.tenantRole)} `
                        : ""}
                      {linkedUser.displayName}
                      {linkedUser.primaryEmail
                        ? ` • ${linkedUser.primaryEmail}`
                        : ""}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.9, minWidth: 0 }}
                    >
                      Aucun compte utilisateur n'est encore associé à cette
                      fiche.
                    </Typography>
                  </Stack>
                )}

                {hasChangeRequests && (
                  <Chip
                    size="small"
                    color="warning"
                    label={`${details!.changeRequests.length} demande(s) à traiter`}
                    onClick={scrollToChangeRequests}
                    sx={{ ml: { xs: 0, sm: 0.5 } }}
                  />
                )}
              </Stack>

              {loadError && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.25 }}
                >
                  {loadError}
                </Typography>
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              justifyContent="flex-end"
              sx={{ flexWrap: "wrap" }}
            >
              <Tooltip
                title={
                  isCollapsed
                    ? "Afficher la photo en grand"
                    : "Réduire la photo pour voir plus de contenu"
                }
              >
                <IconButton
                  size="small"
                  onClick={() => setIsCollapsed((v) => !v)}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  }}
                >
                  {isCollapsed ? (
                    <ExpandMoreRoundedIcon fontSize="small" />
                  ) : (
                    <ExpandLessRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip
                title={
                  hasFutureAttributes
                    ? ""
                    : "Aucune modification programmée - rien à afficher pour le début de saison"
                }
                disableHoverListener={hasFutureAttributes}
                arrow
              >
                <span>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={snapshot}
                    onChange={(_, next: Snapshot | null) =>
                      next && setSnapshot(next)
                    }
                    aria-label="Vue attributs"
                    sx={{
                      "& .MuiToggleButton-root": {
                        px: 1.5,
                      },
                    }}
                  >
                    <ToggleButton value="current" aria-label="Actuels">
                      Actuels
                    </ToggleButton>
                    <ToggleButton
                      value="future"
                      aria-label="Début de saison"
                      disabled={!hasFutureAttributes}
                    >
                      Début de saison
                    </ToggleButton>
                  </ToggleButtonGroup>
                </span>
              </Tooltip>
            </Stack>
          </Box>
        </Box>

        {/* CONTENU STRUCTURÉ EN CARTES */}
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          {/* 1. Carte TÂCHES / CHANGE REQUESTS (prioritaire) */}
          <Box id="change-requests-section" sx={changeRequestsCard}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Tâches à traiter
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="baseline"
              sx={{ mt: 0.5, mb: 1 }}
            >
              <Typography variant="subtitle2">Change requests</Typography>
              {!!details?.changeRequests?.length && (
                <Chip
                  size="small"
                  color="warning"
                  label={`${details!.changeRequests.length}`}
                />
              )}
            </Stack>

            {loading ? (
              <Box sx={{ py: 2 }}>
                <CircularProgress size={18} />
              </Box>
            ) : (details?.changeRequests?.length ?? 0) > 0 ? (
              <Stack spacing={1.25} sx={{ pb: 0.5 }}>
                {details!.changeRequests.map((cr) => {
                  const currentChipsForAttr = (
                    details?.person?.attributes ?? []
                  )
                    .filter(
                      (a) =>
                        a.attributeId === cr.attributeId &&
                        isActiveAt(
                          seasonAnchor,
                          a.validFrom,
                          a.validTo,
                          a.pendingDelete
                        )
                    )
                    .map((a) => ({
                      id: Number(a.id),
                      value: a.value ?? "",
                    }));
                  const formatValue = (raw: string) =>
                    prettyValue(cr.attributeId ?? 0, raw);
                  return (
                    <AdminChangeRequestCard
                      key={cr.id}
                      cr={cr}
                      getAttrLabel={getAttrLabel}
                      getAttrMaxValues={getAttrMaxValues}
                      currentChips={currentChipsForAttr}
                      formatValue={formatValue}
                      onTreat={(crItem) => {
                        setReviewCR(crItem);
                        setReviewOpen(true);
                      }}
                    />
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Aucune demande en cours pour cette fiche.
              </Typography>
            )}
          </Box>

          {/* 2. Carte COMPTE UTILISATEUR & INVITATIONS */}
          <Box sx={secondaryCard}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Compte utilisateur & invitations
            </Typography>

            <AdminPersonInvitationsSection
                  personId={p.idPerson}
                  emails={emails}
                  hasLinkedUserAccount={!!linkedUser}
                  onInvitesChanged={refreshDetails}
                />
          </Box>
          {/* 3. Carte DONNÉES D’ANNUAIRE : Attributs */}
          <Box sx={secondaryCard}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Données d’annuaire
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
              Attributs{" "}
              <strong>
                {snapshot === "current" ? "actuels" : "début de saison"}
              </strong>
            </Typography>

            {loading ? (
              <Box sx={{ py: 2 }}>
                <CircularProgress size={18} />
              </Box>
            ) : (
              <>
                {snapshot === "future" && !hasFutureAttributes && (
                  <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                    Aucune donnée future disponible.
                  </Typography>
                )}
                <AttributeGrid
                  groups={groups}
                  getAttrLabel={getAttrLabel}
                  prettyValue={prettyValue}
                  isLongTextAttr={isLongTextAttr}
                />
              </>
            )}
          </Box>
        </Stack>
      </DialogContent>

      {onEdit && (
        <Button
          variant="outlined"
          onClick={() => person && onEdit(person)}
          sx={{ mx: 2, mb: 1 }}
        >
          Editer
        </Button>
      )}

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>

      {/* ======= DIALOG DE TRAITEMENT ======= */}
      {reviewCR && (
        <AdminChangeRequestReviewDialog
          open={reviewOpen}
          cr={reviewCR}
          onSubmitResolution={handleSubmitResolution}
          onClose={() => {
            setReviewOpen(false);
            setReviewCR(null);
          }}
        />
      )}
    </Dialog>
  );
}
