// src/scenes/admin/members/AdminMembers.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";

import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

import QRCode from "react-qr-code";

import { OrgRole } from "../../../models/organizations/UserOrganization";
import type { MemberStatus, OrgMemberRow } from "../../../models/organizations/AdminMembers";

import type {
  InvitationDto,
  CreateInvitationRequestDto,
  GroupExpiryMode,
} from "../../../services/dto/person/admin/InvitationDto";
import {
  buildConstraintsJson,
  isInvitationExpired,
} from "../../../services/dto/person/admin/InvitationDto";

import {
  listAdminMembers,
  changeMemberRole,
  removeMember as removeMemberApi,
  transferOwnership as transferOwnershipApi,
} from "../../../services/business/admin/admin.members.service";
import {
  listInvitations,
  createInvitation,
  revokeInvitation,
} from "../../../services/business/admin/invitations.service";

import { useAuth } from "../../../contexts/AuthContext";

/* =============================================================
   Helpers (token, url, label)
============================================================= */

const randomHex = (len = 64) =>
  [...crypto.getRandomValues(new Uint8Array(len / 2))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const buildInviteUrl = (token: string) => {
  const base = window.location.origin;
  const route = "/invitation";
  return `${base}${route}?token=${encodeURIComponent(token)}`;
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

const roleLabel = (role: OrgRole | null | undefined): string => {
  if (!role) return "—";
  switch (role) {
    case "VIEWER":
      return "Membre";
    case "EDITOR":
      return "Contributeur";
    case "ADMIN":
      return "Admin";
    case "OWNER":
      return "Owner";
    default:
      return role;
  }
};

type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

const toInvitationStatus = (inv: InvitationDto): InvitationStatus => {
  if (inv.acceptedAt) return "ACCEPTED";
  if (inv.revokedAt) return "REVOKED";
  if (isInvitationExpired(inv.expiresAt)) return "EXPIRED";
  return "PENDING";
};

const statusChip = (status: MemberStatus | InvitationStatus) => {
  switch (status) {
    case "ACTIVE":
      return <Chip size="small" color="success" label="Actif" />;
    case "INVITED":
      return (
        <Chip
          size="small"
          color="info"
          label="Invité"
          icon={<HourglassBottomRoundedIcon fontSize="small" />}
        />
      );
    case "PENDING":
      return (
        <Chip
          size="small"
          color="info"
          label="En attente"
          icon={<HourglassBottomRoundedIcon fontSize="small" />}
        />
      );
    case "ACCEPTED":
      return (
        <Chip
          size="small"
          color="success"
          label="Acceptée"
          icon={<CheckCircleRoundedIcon fontSize="small" />}
        />
      );
    case "REVOKED":
      return <Chip size="small" color="warning" label="Révoquée" />;
    case "EXPIRED":
      return <Chip size="small" variant="outlined" label="Expirée" />;
    default:
      return <Chip size="small" label={status} />;
  }
};

const isActiveInvitationStatus = (status: InvitationStatus) => status === "PENDING";
const isHistoricalInvitationStatus = (status: InvitationStatus) =>
  status === "ACCEPTED" || status === "EXPIRED" || status === "REVOKED";

/** constraintsJson parsing (tolérant) */
type InvitationConstraints = {
  kind?: "PERSONAL" | "GROUP";
  defaultRole?: OrgRole;
  expiryMode?: GroupExpiryMode;
  [key: string]: any;
};

const parseConstraints = (inv: InvitationDto): InvitationConstraints | null => {
  const raw = inv.constraintsJson;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InvitationConstraints;
  } catch {
    return null;
  }
};

type InvitationRowType = "EMAIL" | "SELF_SERVICE" | "GROUP";

type InvitationRow = {
  id: number;
  type: InvitationRowType;
  label: string;
  email: string | null;
  role: OrgRole | null;
  personId: number | null;
  createdAt: string;
  expiresAt: string | null;
  pinRequired: boolean;
  status: InvitationStatus;
};

const mapInvitationDtoToRow = (inv: InvitationDto): InvitationRow => {
  const status = toInvitationStatus(inv);
  const c = parseConstraints(inv);

  let type: InvitationRowType = inv.type === "EMAIL" ? "EMAIL" : "SELF_SERVICE";
  if (c?.kind === "GROUP") type = "GROUP";

  const label =
    inv.label ||
    (type === "GROUP"
      ? "Lien d’inscription de groupe"
      : inv.email
      ? `Invitation ${inv.email}`
      : inv.personId
      ? `Invitation personne #${inv.personId}`
      : "Invitation");

  return {
    id: inv.id,
    type,
    label,
    email: inv.email ?? null,
    role: inv.role ?? null,
    personId: inv.personId ?? null,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    pinRequired: !!inv.pinRequired,
    status,
  };
};

/* =============================================================
   UI types (group invite “draft”)
============================================================= */

type GroupInviteDraft = {
  role: OrgRole;
  expiryMode: GroupExpiryMode;
  maxUses: "UNLIMITED" | "LIMITED";
  maxUsesValue: number; // used if LIMITED
  pinEnabled: boolean;
  pinValue: string; // only if pinEnabled
};

const defaultDraft: GroupInviteDraft = {
  role: "VIEWER",
  expiryMode: "DAYS_30",
  maxUses: "UNLIMITED",
  maxUsesValue: 50,
  pinEnabled: false,
  pinValue: "",
};

const generatePin6 = () => Math.floor(100000 + Math.random() * 900000).toString();

/* =============================================================
   Component
============================================================= */

type InvitationFilter = "ACTIVE" | "HISTORY" | "ALL";

const AdminMembers: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const qrSize = isSmallScreen ? 180 : 220;
  const navigate = useNavigate();

  const { activeOrganization } = useAuth();

  // Rôle org courant (pour permissions UI)
  const myOrgRole = (activeOrganization?.role ?? null) as OrgRole | null;

  const [loading, setLoading] = useState(false);

  const [members, setMembers] = useState<OrgMemberRow[]>([]);
  const [invitationRows, setInvitationRows] = useState<InvitationRow[]>([]);

  // Draft config for next group link
  const [draft, setDraft] = useState<GroupInviteDraft>(defaultDraft);

  // Local-only (session) link info (rawToken not returned by API)
  const [lastCreatedGroupLink, setLastCreatedGroupLink] = useState<{
    url: string;
    token: string;
    createdAt: string;
    pinUsed: string | null;
  } | null>(null);

  // UI
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [invitationFilter, setInvitationFilter] = useState<InvitationFilter>("ACTIVE");
  const [showGroupQr, setShowGroupQr] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Members actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMember, setMenuMember] = useState<OrgMemberRow | null>(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: React.ReactNode;
    actionLabel: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  /* ---------------------------
     Permissions helpers
  -------------------------- */

  const canManageMembers = myOrgRole === "ADMIN" || myOrgRole === "OWNER";
  const canManageAdmins = myOrgRole === "OWNER";

  const canEditRoleFor = (target: OrgMemberRow, nextRole: OrgRole) => {
    if (!myOrgRole) return false;

    // Interdit de set OWNER via endpoint role (ownership endpoint dédié)
    if (nextRole === "OWNER") return false;

    if (myOrgRole === "OWNER") {
      // owner peut modifier VIEWER/EDITOR/ADMIN mais pas OWNER via ce endpoint
      return target.role !== "OWNER";
    }

    if (myOrgRole === "ADMIN") {
      // admin ne touche ni ADMIN ni OWNER, et ne peut pas promouvoir ADMIN
      if (target.role === "ADMIN" || target.role === "OWNER") return false;
      if (nextRole === "ADMIN") return false;
      return true;
    }

    return false;
  };

  const canRemove = (target: OrgMemberRow) => {
    if (!myOrgRole) return false;

    if (myOrgRole === "OWNER") {
      return target.role !== "OWNER";
    }

    if (myOrgRole === "ADMIN") {
      return target.role !== "ADMIN" && target.role !== "OWNER";
    }

    return false;
  };

  const canTransferOwnershipTo = (target: OrgMemberRow) => {
    return myOrgRole === "OWNER" && target.role !== "OWNER";
  };

  /* ---------------------------
     Load initial
  -------------------------- */

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [membersRes, invitationsRes] = await Promise.all([
          listAdminMembers(),
          listInvitations(),
        ]);
        if (cancelled) return;

        setMembers(membersRes);
        setInvitationRows(invitationsRes.map(mapInvitationDtoToRow));
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Impossible de charger les membres et invitations pour cet espace.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadInvitations = async () => {
    try {
      const list = await listInvitations();
      setInvitationRows(list.map(mapInvitationDtoToRow));
    } catch (e) {
      console.error(e);
      setError("Impossible de rafraîchir la liste des invitations.");
    }
  };

  const reloadMembers = async () => {
    try {
      const res = await listAdminMembers();
      setMembers(res);
    } catch (e) {
      console.error(e);
      setError("Impossible de rafraîchir la liste des membres.");
    }
  };

  /* ---------------------------
     Derived
  -------------------------- */

  const search = memberSearch.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    return members.filter((m) =>
      `${m.displayName} ${m.email ?? ""} ${m.personLabel ?? ""}`.toLowerCase().includes(search)
    );
  }, [members, search]);

  const totalMembers = members.length;
  const activeMembersCount = members.filter((m) => m.status === "ACTIVE").length;

  const pendingInvitesCount = invitationRows.filter((inv) => isActiveInvitationStatus(inv.status)).length;
  const acceptedInvitesCount = invitationRows.filter((inv) => inv.status === "ACCEPTED").length;

  const filteredInvitations = invitationRows.filter((inv) => {
    if (invitationFilter === "ALL") return true;
    if (invitationFilter === "ACTIVE") return isActiveInvitationStatus(inv.status);
    return isHistoricalInvitationStatus(inv.status);
  });

  const hasActiveGroupInviteServerSide = invitationRows.some(
    (inv) => inv.type === "GROUP" && isActiveInvitationStatus(inv.status)
  );

  /* ---------------------------
     Actions: Members actions menu
  -------------------------- */

  const openActions = (e: React.MouseEvent<HTMLElement>, m: OrgMemberRow) => {
    setAnchorEl(e.currentTarget);
    setMenuMember(m);
  };

  const closeActions = () => {
    setAnchorEl(null);
    setMenuMember(null);
  };

  const openConfirm = (cfg: NonNullable<typeof confirm>) => setConfirm(cfg);
  const closeConfirm = () => setConfirm(null);

  const doChangeRole = (target: OrgMemberRow, role: OrgRole) => {
    closeActions();
    openConfirm({
      open: true,
      title: "Changer le rôle",
      message: (
        <>
          Voulez-vous changer le rôle de <strong>{target.displayName}</strong> en{" "}
          <strong>{roleLabel(role)}</strong> ?
        </>
      ),
      actionLabel: "Confirmer",
      onConfirm: async () => {
        try {
          setLoading(true);
          await changeMemberRole(target.userId, role);
          await reloadMembers();
          setFeedback("Rôle mis à jour.");
        } catch (e) {
          console.error(e);
          setError("Impossible de changer le rôle.");
        } finally {
          setLoading(false);
          closeConfirm();
        }
      },
    });
  };

  const doRemove = (target: OrgMemberRow) => {
    closeActions();
    openConfirm({
      open: true,
      title: "Retirer ce membre",
      danger: true,
      message: (
        <>
          Confirmez-vous la suppression de l’accès pour <strong>{target.displayName}</strong> ?
          <br />
          Cette action est immédiate.
        </>
      ),
      actionLabel: "Retirer",
      onConfirm: async () => {
        try {
          setLoading(true);
          await removeMemberApi(target.userId);
          await reloadMembers();
          setFeedback("Membre retiré.");
        } catch (e) {
          console.error(e);
          setError("Impossible de retirer ce membre.");
        } finally {
          setLoading(false);
          closeConfirm();
        }
      },
    });
  };

  const doTransferOwnership = (target: OrgMemberRow) => {
    closeActions();
    openConfirm({
      open: true,
      title: "Transférer l’ownership",
      danger: true,
      message: (
        <>
          Vous allez transférer l’ownership à <strong>{target.displayName}</strong>.
          <br />
          Vous deviendrez <strong>Admin</strong> après le transfert.
        </>
      ),
      actionLabel: "Transférer",
      onConfirm: async () => {
        try {
          setLoading(true);
          await transferOwnershipApi(target.userId);
          await reloadMembers();
          setFeedback("Ownership transféré.");
        } catch (e) {
          console.error(e);
          setError("Impossible de transférer l’ownership.");
        } finally {
          setLoading(false);
          closeConfirm();
        }
      },
    });
  };

  /* ---------------------------
     Actions: create group link
  -------------------------- */

  const validateDraft = (): string | null => {
    if (draft.maxUses === "LIMITED") {
      const n = Number(draft.maxUsesValue);
      if (!Number.isFinite(n) || n < 1) return "Le quota doit être un nombre ≥ 1.";
    }
    if (draft.pinEnabled) {
      const p = (draft.pinValue || "").trim();
      if (!/^\d{4,12}$/.test(p)) return "Le PIN doit contenir 4 à 12 chiffres (recommandé : 6).";
    }
    return null;
  };

  const handleCreateOrRotateGroupInvite = async () => {
    const draftError = validateDraft();
    if (draftError) {
      setError(draftError);
      return;
    }

    try {
      setLoading(true);

      const rawToken = randomHex(40);
      const url = buildInviteUrl(rawToken);

      const payload: CreateInvitationRequestDto = {
        type: "SELF_SERVICE",
        email: null,
        personId: null,
        role: draft.role,
        maxUses: draft.maxUses === "UNLIMITED" ? null : Number(draft.maxUsesValue),
        expiresAt: null, // ✅ approach A: back computes from expiryMode

        rawToken,
        rawPin: draft.pinEnabled ? draft.pinValue.trim() : null,

        constraintsJson: buildConstraintsJson({
          kind: "GROUP",
          defaultRole: draft.role,
          expiryMode: draft.expiryMode,
        }),
      };

      await createInvitation(payload);

      // Keep local-only secret values for the session
      setLastCreatedGroupLink({
        token: rawToken,
        url,
        createdAt: new Date().toISOString(),
        pinUsed: draft.pinEnabled ? draft.pinValue.trim() : null,
      });

      await navigator.clipboard.writeText(url);
      setFeedback("Nouveau lien d’inscription généré et copié.");

      await reloadInvitations();
    } catch (e) {
      console.error(e);
      setError("Impossible de générer le lien d’inscription de groupe.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invId: number) => {
    try {
      setLoading(true);
      await revokeInvitation(invId);
      setFeedback("Invitation révoquée.");
      await reloadInvitations();
    } catch (e) {
      console.error(e);
      setError("Impossible de révoquer cette invitation.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     Render
  -------------------------- */

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxHeight: "100%", overflowY: "auto" }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Membres & invitations
      </Typography>
      <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
        Gérez qui peut accéder à cet espace : membres existants, invitations nominatives et lien d’inscription de groupe.
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }} alignItems="center">
        <Chip size="small" label={totalMembers === 0 ? "Aucun membre" : `${totalMembers} membre${totalMembers > 1 ? "s" : ""}`} />
        <Chip
          size="small"
          variant={pendingInvitesCount > 0 ? "outlined" : "filled"}
          color={pendingInvitesCount > 0 ? "info" : "default"}
          label={
            pendingInvitesCount === 0
              ? "Aucune invitation en cours"
              : `${pendingInvitesCount} invitation${pendingInvitesCount > 1 ? "s" : ""} en cours`
          }
        />
        <Chip
          size="small"
          color={hasActiveGroupInviteServerSide ? "success" : "default"}
          variant={hasActiveGroupInviteServerSide ? "filled" : "outlined"}
          label={hasActiveGroupInviteServerSide ? "Lien de groupe actif" : "Pas de lien de groupe actif"}
        />
        {myOrgRole && (
          <Chip
            size="small"
            variant="outlined"
            label={`Votre rôle : ${roleLabel(myOrgRole)}`}
          />
        )}
      </Stack>

      {!canManageMembers && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          Votre rôle actuel ne permet pas de gérer les membres. Vous pouvez consulter la liste, mais les actions (rôles, suppression, transfert) sont désactivées.
        </Alert>
      )}

      <Grid container spacing={2} alignItems="stretch">
        {/* Members */}
        <Grid item xs={12} lg={7} sx={{ display: "flex" }}>
          <Card sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <CardHeader
              avatar={<PeopleAltRoundedIcon color="primary" />}
              title={`Membres de l’espace${totalMembers > 0 ? ` (${totalMembers})` : ""}`}
              subheader="Utilisateurs actuellement rattachés à cet espace."
              action={
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
                  {activeMembersCount > 0 && (
                    <Chip size="small" variant="outlined" label={`${activeMembersCount} actif${activeMembersCount > 1 ? "s" : ""}`} />
                  )}
                  <Button size="small" variant="contained" onClick={() => navigate("/admin/persons")}>
                    Ouvrir le trombinoscope
                  </Button>
                </Stack>
              }
            />
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {loading && members.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Chargement des membres…
                </Typography>
              ) : members.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Aucun membre pour l’instant.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Rechercher un membre"
                      placeholder="Nom, e-mail ou personne liée"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                    <Typography variant="caption" sx={{ opacity: 0.7, minWidth: { sm: 180 } }}>
                      {filteredMembers.length} / {totalMembers} membre{totalMembers > 1 ? "s" : ""} affiché
                      {filteredMembers.length > 1 ? "s" : ""}.
                    </Typography>
                  </Stack>

                  {filteredMembers.length === 0 ? (
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Aucun membre ne correspond à votre recherche.
                    </Typography>
                  ) : (
                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell>E-mail</TableCell>
                            <TableCell>Rôle</TableCell>
                            <TableCell>Personne liée</TableCell>
                            <TableCell align="right">Statut</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMembers.map((m) => (
                            <TableRow key={m.userId} hover>
                              <TableCell>{m.displayName}</TableCell>
                              <TableCell>
                                {m.email ? (
                                  m.email
                                ) : (
                                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={roleLabel(m.role)}
                                  color={
                                    m.role === "OWNER"
                                      ? "warning"
                                      : m.role === "ADMIN"
                                      ? "error"
                                      : m.role === "EDITOR"
                                      ? "primary"
                                      : "default"
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {m.personLabel ? (
                                  <Typography variant="body2">{m.personLabel}</Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                    Non liée
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">{statusChip(m.status)}</TableCell>
                              <TableCell align="right">
                                {canManageMembers ? (
                                  <Tooltip title="Actions">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={loading}
                                        onClick={(e) => openActions(e, m)}
                                      >
                                        <MoreVertRoundedIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <Menu
                        anchorEl={anchorEl}
                        open={!!anchorEl && !!menuMember}
                        onClose={closeActions}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                      >
                        {menuMember && (
                          <>
                            <MenuItem
                              disabled={!canEditRoleFor(menuMember, "VIEWER")}
                              onClick={() => doChangeRole(menuMember, "VIEWER")}
                            >
                              <ListItemIcon>
                                <AdminPanelSettingsRoundedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Définir : Membre" />
                            </MenuItem>

                            <MenuItem
                              disabled={!canEditRoleFor(menuMember, "EDITOR")}
                              onClick={() => doChangeRole(menuMember, "EDITOR")}
                            >
                              <ListItemIcon>
                                <AdminPanelSettingsRoundedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Définir : Contributeur" />
                            </MenuItem>

                            <MenuItem
                              disabled={!canEditRoleFor(menuMember, "ADMIN")}
                              onClick={() => doChangeRole(menuMember, "ADMIN")}
                            >
                              <ListItemIcon>
                                <AdminPanelSettingsRoundedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Définir : Admin" />
                            </MenuItem>

                            <Divider />

                            <MenuItem
                              disabled={!canTransferOwnershipTo(menuMember)}
                              onClick={() => doTransferOwnership(menuMember)}
                            >
                              <ListItemIcon>
                                <SwapHorizRoundedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Transférer l’ownership" />
                            </MenuItem>

                            <MenuItem
                              disabled={!canRemove(menuMember)}
                              onClick={() => doRemove(menuMember)}
                            >
                              <ListItemIcon>
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Retirer du groupe" />
                            </MenuItem>

                            {!canManageAdmins && (
                              <Typography variant="caption" sx={{ px: 2, py: 1, opacity: 0.7, display: "block" }}>
                                Seul un owner peut gérer les admins / ownership.
                              </Typography>
                            )}
                          </>
                        )}
                      </Menu>
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5 }}>
                    Pour inviter une personne nominative, ouvrez sa fiche dans l’onglet <strong>Persons</strong> puis utilisez la section “Invitations”.
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Group link */}
        <Grid item xs={12} lg={5} sx={{ display: "flex" }}>
          <Card sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <CardHeader
              avatar={<LinkRoundedIcon color="primary" />}
              title="Lien d’inscription de groupe"
              subheader="Paramétrez puis générez un lien à partager. Pour changer les paramètres, régénérez un nouveau lien."
              action={
                <Chip
                  size="small"
                  color={hasActiveGroupInviteServerSide ? "success" : "default"}
                  variant={hasActiveGroupInviteServerSide ? "filled" : "outlined"}
                  label={hasActiveGroupInviteServerSide ? "Actif" : "Inactif"}
                />
              }
            />
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {hasActiveGroupInviteServerSide && !lastCreatedGroupLink && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                  Un lien de groupe est déjà actif, mais son URL n’est pas récupérable. Vous pouvez régénérer un nouveau lien ici.
                </Alert>
              )}

              {/* Draft config */}
              <Stack spacing={1.25}>
                <TextField
                  select
                  size="small"
                  label="Rôle des nouveaux membres"
                  value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as OrgRole }))}
                  fullWidth
                  disabled={!canManageMembers}
                  helperText={!canManageMembers ? "Votre rôle ne permet pas de générer un lien d’inscription." : undefined}
                >
                  <MenuItem value="VIEWER">Membre</MenuItem>
                  <MenuItem value="EDITOR">Contributeur</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Durée de validité"
                  value={draft.expiryMode}
                  onChange={(e) => setDraft((d) => ({ ...d, expiryMode: e.target.value as GroupExpiryMode }))}
                  fullWidth
                  disabled={!canManageMembers}
                >
                  <MenuItem value="HOURS_24">24 heures</MenuItem>
                  <MenuItem value="DAYS_7">7 jours</MenuItem>
                  <MenuItem value="DAYS_30">30 jours</MenuItem>
                  <MenuItem value="DAYS_90">90 jours</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Nombre d’utilisations"
                  value={draft.maxUses}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, maxUses: e.target.value as GroupInviteDraft["maxUses"] }))
                  }
                  fullWidth
                  disabled={!canManageMembers}
                >
                  <MenuItem value="UNLIMITED">Illimité</MenuItem>
                  <MenuItem value="LIMITED">Limiter</MenuItem>
                </TextField>

                {draft.maxUses === "LIMITED" && (
                  <TextField
                    size="small"
                    label="Quota (utilisations)"
                    value={draft.maxUsesValue}
                    onChange={(e) => setDraft((d) => ({ ...d, maxUsesValue: Number(e.target.value) }))}
                    type="number"
                    inputProps={{ min: 1 }}
                    fullWidth
                    disabled={!canManageMembers}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.pinEnabled}
                      disabled={!canManageMembers}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDraft((d) => ({
                          ...d,
                          pinEnabled: checked,
                          pinValue: checked ? (d.pinValue || generatePin6()) : "",
                        }));
                      }}
                    />
                  }
                  label="Protéger par un PIN"
                />

                {draft.pinEnabled && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                    <TextField
                      size="small"
                      label="PIN"
                      value={draft.pinValue}
                      onChange={(e) => setDraft((d) => ({ ...d, pinValue: e.target.value }))}
                      type={showPin ? "text" : "password"}
                      fullWidth
                      disabled={!canManageMembers}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPin((v) => !v)} disabled={!canManageMembers}>
                              {showPin ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      helperText="4 à 12 chiffres (recommandé : 6)."
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!canManageMembers}
                      onClick={() => setDraft((d) => ({ ...d, pinValue: generatePin6() }))}
                    >
                      Générer
                    </Button>
                  </Stack>
                )}

                <Divider />

                <Button
                  fullWidth={isSmallScreen}
                  variant="contained"
                  startIcon={<QrCode2RoundedIcon />}
                  onClick={handleCreateOrRotateGroupInvite}
                  disabled={loading || !canManageMembers}
                >
                  {lastCreatedGroupLink ? "Régénérer le lien" : "Créer le lien"}
                </Button>

                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Les paramètres s’appliquent uniquement lors de la génération. Pour modifier le rôle, la durée ou le PIN, régénérez un nouveau lien.
                </Typography>

                {/* Last created link */}
                {lastCreatedGroupLink && (
                  <Stack spacing={1.25} sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Lien à partager"
                      value={lastCreatedGroupLink.url}
                      InputProps={{ readOnly: true }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopyRoundedIcon />}
                        onClick={() => {
                          navigator.clipboard.writeText(lastCreatedGroupLink.url);
                          setFeedback("Lien copié.");
                        }}
                      >
                        Copier le lien
                      </Button>

                      {lastCreatedGroupLink.pinUsed && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyRoundedIcon />}
                          onClick={() => {
                            navigator.clipboard.writeText(lastCreatedGroupLink.pinUsed!);
                            setFeedback("PIN copié.");
                          }}
                        >
                          Copier le PIN
                        </Button>
                      )}
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                    >
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Créé le {formatDateTime(lastCreatedGroupLink.createdAt)}.
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<QrCode2RoundedIcon />}
                        onClick={() => setShowGroupQr((v) => !v)}
                      >
                        {showGroupQr ? "Masquer le QR" : "Afficher le QR"}
                      </Button>
                    </Stack>

                    <Collapse in={showGroupQr} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 2,
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 3,
                            background: "white",
                            boxShadow: `0 8px 20px rgba(0,0,0,0.08)`,
                          }}
                        >
                          <QRCode value={lastCreatedGroupLink.url} size={qrSize} />
                        </Box>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          À afficher à l’accueil ou lors d’un onboarding : les participants scannent le code, créent leur compte et rejoignent l’espace.
                          {lastCreatedGroupLink.pinUsed ? " Un PIN sera demandé." : ""}
                        </Typography>
                      </Box>
                    </Collapse>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Invitations list */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<EmailRoundedIcon color="primary" />}
              title="Invitations"
              subheader="Invitations nominatives et liens (groupes ou self-service) récemment créés."
            />
            <CardContent>
              {loading && invitationRows.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Chargement des invitations…
                </Typography>
              ) : invitationRows.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Aucune invitation enregistrée.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {pendingInvitesCount} en cours · {acceptedInvitesCount} acceptée{acceptedInvitesCount > 1 ? "s" : ""} ·{" "}
                      {invitationRows.length} au total
                    </Typography>
                    <ToggleButtonGroup
                      size="small"
                      value={invitationFilter}
                      exclusive
                      onChange={(_, value) => {
                        if (value) setInvitationFilter(value);
                      }}
                    >
                      <ToggleButton value="ACTIVE">En cours</ToggleButton>
                      <ToggleButton value="HISTORY">Historique</ToggleButton>
                      <ToggleButton value="ALL">Toutes</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  {filteredInvitations.length === 0 ? (
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Aucune invitation dans cette vue.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {filteredInvitations.map((inv) => (
                        <Box
                          key={inv.id}
                          sx={{
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            p: 1,
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{inv.label}</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {formatDateTime(inv.createdAt)} •{" "}
                                {inv.type === "GROUP"
                                  ? "Lien de groupe"
                                  : inv.type === "SELF_SERVICE"
                                  ? "Lien self-service"
                                  : "Invitation e-mail"}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                Rôle : {roleLabel(inv.role)}
                                {inv.email ? ` • ${inv.email}` : ""}
                                {inv.pinRequired ? " • PIN requis" : ""}
                                {inv.expiresAt ? ` • Expire le ${formatDateTime(inv.expiresAt)}` : " • Sans expiration"}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {statusChip(inv.status)}

                              {inv.status === "PENDING" && (
                                <Tooltip title="Révoquer">
                                  <span>
                                    <IconButton size="small" disabled={loading} onClick={() => handleRevokeInvitation(inv.id)}>
                                      <CancelRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      {confirm?.open && (
        <Dialog open onClose={loading ? undefined : closeConfirm} maxWidth="xs" fullWidth>
          <DialogTitle>{confirm.title}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2">{confirm.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfirm} disabled={loading}>
              Annuler
            </Button>
            <Button
              variant="contained"
              color={confirm.danger ? "error" : "primary"}
              onClick={() => void confirm.onConfirm()}
              disabled={loading}
            >
              {confirm.actionLabel}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Feedbacks */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={2500}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {feedback}
        </Alert>
      </Snackbar>

      {error && (
        <Snackbar
          open
          autoHideDuration={3500}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default AdminMembers;
