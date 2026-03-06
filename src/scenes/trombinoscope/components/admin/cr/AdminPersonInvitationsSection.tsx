// src/components/trombinoscope/components/cr/AdminPersonInvitationsSection.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import QRCode from "react-qr-code";

import {
  listInvitations,
  createInvitation,
  revokeInvitation,
  deleteInvitation,
} from "../../../../../services/business/admin/invitations.service";
import {
  InvitationDto,
  isInvitationExpired,
  CreateInvitationRequestDto,
  buildConstraintsJson,
} from "../../../../../services/dto/person/admin/InvitationDto";
import {
  createPersonEmail,
} from "../../../../../services/business/admin/personEmails.service";
import {
  PersonEmailDto,
  CreatePersonEmailRequestDto,
} from "../../../../../services/dto/person/admin/PersonEmailDto";
import { OrgRole, formatRole } from "../../../../../models/tenants/TenantMembership";

/* =============================================================
   Helpers
============================================================= */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const randomHex = (len = 64) =>
  [...crypto.getRandomValues(new Uint8Array(len / 2))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

// URL publique d’invitation construite côté front
// ⚠️ adapte la route si ton front expose l’écran sur un autre path
const buildInviteUrl = (token: string) => {
  const base = window.location.origin; // ex : https://app.saymyname.app
  const route = "/invitation";
  return `${base}${route}?token=${encodeURIComponent(token)}`;
};

type InviteMode = "EMAIL" | "SELF_SERVICE" | null;

type Props = {
  personId: number;
  emails: PersonEmailDto[];
  hasLinkedUserAccount: boolean;
  onInvitesChanged?: () => void;
};

/* =============================================================
   Shared role select
============================================================= */

type RoleSelectProps = {
  value: OrgRole;
  onChange: (role: OrgRole) => void;
  sx?: any;
};

const RoleSelect: React.FC<RoleSelectProps> = ({ value, onChange, sx }) => (
  <TextField
    select
    size="small"
    label="Rôle dans l’espace"
    value={value}
    onChange={(e) => onChange(e.target.value as OrgRole)}
    sx={{ minWidth: 240, ...sx }}
  >
    <MenuItem value="VIEWER">
      <Stack spacing={0.2}>
        <Typography variant="body2">Membre</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          S'entrainer et consulter les fiches
        </Typography>
      </Stack>
    </MenuItem>

    <MenuItem value="EDITOR">
      <Stack spacing={0.2}>
        <Typography variant="body2">Contributeur</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Gérer les fiches et photos
        </Typography>
      </Stack>
    </MenuItem>

    <MenuItem value="ADMIN">
      <Stack spacing={0.2}>
        <Typography variant="body2">Admin</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Gérer les membres, les rôles et les paramètres
        </Typography>
      </Stack>
    </MenuItem>
  </TextField>
);

/* =============================================================
   Component
============================================================= */
export const AdminPersonInvitationsSection: React.FC<Props> = ({
  personId,
  emails,
  hasLinkedUserAccount,
  onInvitesChanged,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const qrSize = isSmallScreen ? 180 : 200;
  const largeQrSize = Math.max(Math.round(qrSize * 1.6), 280);

  const [invites, setInvites] = useState<InvitationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [showMore, setShowMore] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // ➜ mode collapsed par défaut
  const [mode, setMode] = useState<InviteMode>(null);

  const [emailValue, setEmailValue] = useState("");
  const [role, setRole] = useState<OrgRole>("VIEWER");

  // Lien SELF_SERVICE (servira aussi pour le QR)
  const [selfServiceLink, setSelfServiceLink] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const list = await listInvitations();
      setInvites(list.filter((i) => i.personId === personId));
    } catch (e: any) {
      console.error(e);
      setError("Erreur lors du chargement des invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvites();
  }, [personId]);

  useEffect(() => {
    // Pré-remplir avec l’e-mail connu si dispo
    setEmailValue(emails[0]?.email || "");
  }, [emails, personId]);

  useEffect(() => {
    if (!selfServiceLink) {
      setQrDialogOpen(false);
    }
  }, [selfServiceLink]);

  const hasInvites = invites.length > 0;

  /* ============================
     Actions d'invitation
  ============================ */

  const sendEmailInvite = async () => {
    const email = emailValue.trim();
    if (!isEmail(email)) {
      setError("Adresse e-mail invalide.");
      return;
    }

    setLoading(true);
    try {
      // Enregistrer l’e-mail s’il n’existe pas encore
      if (!emails.some((e) => e.email === email)) {
        const payloadEmail: CreatePersonEmailRequestDto = {
          email,
          kind: "WORK",
          sourceKind: "MANUAL",
          sourceLabel: "invite",
          primary: emails.length === 0 ? true : null,
        };
        await createPersonEmail(personId, payloadEmail);
      }

      const payload: CreateInvitationRequestDto = {
        personId,
        type: "EMAIL",
        email,
        role: role || "VIEWER",
        rawToken: randomHex(),
        constraintsJson: buildConstraintsJson({
          kind: "PERSONAL",
          requireEmailMatch: true,
        }),
        // maxUses: 1 // optionnel, default déjà à 1 côté service
      };
      await createInvitation(payload);

      setFeedback("Invitation envoyée par e-mail.");
      await loadInvites();
      onInvitesChanged && onInvitesChanged();
    } catch (e: any) {
      console.error(e);
      setError("Impossible d'envoyer l'invitation.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crée une invitation nominative SELF_SERVICE + génère
   * un lien et le QR associé (selfServiceLink).
   * Le lien est nominatif pour cette fiche personne.
   */
  const createSelfServiceInvite = async () => {
    setLoading(true);
    try {
      const rawToken = randomHex();

      const payload: CreateInvitationRequestDto = {
        personId,
        type: "SELF_SERVICE",
        role,
        rawToken,
        constraintsJson: buildConstraintsJson({
          kind: "PERSONAL",
          requirePersonMatch: true,
        }),
        // maxUses: 1 // nominative : une seule utilisation si tu veux être strict
      };

      await createInvitation(payload);

      const link = buildInviteUrl(rawToken);
      setSelfServiceLink(link || null);

      await navigator.clipboard.writeText(link);
      setFeedback("Lien d’invitation copié.");

      await loadInvites();
      onInvitesChanged && onInvitesChanged();
    } catch (e: any) {
      console.error(e);
      setError("Échec de la création de l’invitation.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     Gestion des invitations existantes
  ============================ */

  const handleRevoke = async (id: number) => {
    await revokeInvitation(id);
    await loadInvites();
    onInvitesChanged && onInvitesChanged();
  };

  const handleDelete = async (id: number) => {
    await deleteInvitation(id);
    await loadInvites();
    onInvitesChanged && onInvitesChanged();
  };

  const renderInviteRow = (inv: InvitationDto) => {
    const status = inv.acceptedAt
      ? "Acceptée"
      : inv.revokedAt
      ? "Révoquée"
      : isInvitationExpired(inv.expiresAt)
      ? "Expirée"
      : "En attente";
    const color =
      status === "Acceptée"
        ? "success"
        : status === "Révoquée"
        ? "warning"
        : status === "Expirée"
        ? "default"
        : "info";

    return (
      <Stack
        key={inv.id}
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="body2">
          {new Date(inv.createdAt).toLocaleString()} •{" "}
          {inv.role ? formatRole(inv.role as OrgRole) : "—"}{" "}
          {inv.email && <>• {inv.email}</>}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Chip size="small" color={color as any} label={status} />
          <Tooltip title="Révoquer">
            <IconButton size="small" onClick={() => handleRevoke(inv.id)}>
              <CancelRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton size="small" onClick={() => handleDelete(inv.id)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    );
  };

  /* =============================================================
     RENDER
  ============================================================= */

  const ctaBaseSx = {
    borderRadius: 999,
    textTransform: "none" as const,
    px: 2.4,
    py: 0.7,
    fontWeight: 500,
  };

  const makeCtaSx = (active: boolean) =>
    active
      ? {
          ...ctaBaseSx,
          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.5)}`,
        }
      : {
          ...ctaBaseSx,
          borderColor: alpha(theme.palette.primary.main, 0.35),
          backgroundColor: alpha(theme.palette.background.paper, 0.6),
        };

  return (
    <Box sx={{ mt: 1.5 }}>
      {/* Statut + CTA alignés sur une seule ligne */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <Chip
          label={
            hasLinkedUserAccount
              ? "Compte lié"
              : hasInvites
              ? "En attente de création de compte"
              : "Aucun compte utilisateur"
          }
          color={
            hasLinkedUserAccount
              ? "success"
              : hasInvites
              ? "info"
              : "warning"
          }
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexWrap: "wrap" }}
        >
          <Button
            variant={mode === "EMAIL" ? "contained" : "outlined"}
            startIcon={<EmailRoundedIcon />}
            onClick={() => setMode(mode === "EMAIL" ? null : "EMAIL")}
            sx={makeCtaSx(mode === "EMAIL")}
          >
            Envoyer par e-mail
          </Button>
          <Button
            variant={mode === "SELF_SERVICE" ? "contained" : "outlined"}
            startIcon={<LinkRoundedIcon />}
            onClick={() =>
              setMode(mode === "SELF_SERVICE" ? null : "SELF_SERVICE")
            }
            sx={makeCtaSx(mode === "SELF_SERVICE")}
          >
            Invitation à partager
          </Button>
        </Stack>
      </Stack>

      {/* Formulaire e-mail */}
      <Collapse in={mode === "EMAIL"} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Invitation envoyée par e-mail
          </Typography>
          <Typography
            variant="caption"
            sx={{ opacity: 0.7, display: "block", mb: 1 }}
          >
            Un e-mail d’invitation est envoyé directement à cette personne avec
            un lien de création de compte.
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              fullWidth
              size="small"
              label="Adresse e-mail"
              placeholder="prenom.nom@exemple.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
            />

            <RoleSelect value={role} onChange={setRole} />

            <Button
              variant="contained"
              onClick={sendEmailInvite}
              disabled={loading}
              sx={{ whiteSpace: "nowrap" }}
            >
              Envoyer l’invitation
            </Button>
          </Stack>
        </Box>
      </Collapse>

      {/* Formulaire SELF_SERVICE = lien + QR code */}
      <Collapse in={mode === "SELF_SERVICE"} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Invitation à partager
          </Typography>
          <Typography
            variant="caption"
            sx={{ opacity: 0.7, display: "block", mb: 1 }}
          >
            Génère un lien nominatif pour cette personne. Vous pouvez le copier,
            l’envoyer sur le canal de votre choix ou l’afficher sous forme de
            QR code.
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <RoleSelect
              value={role}
              onChange={setRole}
              sx={{ maxWidth: 320 }}
            />

            <Button
              variant="contained"
              startIcon={<QrCode2RoundedIcon />}
              onClick={createSelfServiceInvite}
              disabled={loading}
              sx={{ whiteSpace: "nowrap" }}
            >
              Générer l’invitation
            </Button>
          </Stack>

          {/* Lien + QR inline */}
          <Collapse in={!!selfServiceLink} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mt: 2,
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                border: `1px dashed ${alpha(
                  theme.palette.primary.main,
                  0.4
                )}`,
                backgroundColor: alpha(theme.palette.primary.light, 0.05),
                display: "grid",
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {/* Lien affiché + copie */}
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  Lien d’invitation nominatif
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  C’est le même lien que celui encodé dans le QR code
                  ci-dessous.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={selfServiceLink || ""}
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyRoundedIcon />}
                    onClick={() => {
                      if (selfServiceLink) {
                        navigator.clipboard.writeText(selfServiceLink);
                      }
                      setFeedback("Lien copié.");
                    }}
                  >
                    Copier
                  </Button>
                </Stack>
              </Stack>

              {/* QR code responsive */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1.5, sm: 2 }}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    maxWidth: 280,
                    mx: "auto",
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.12
                    )}, ${alpha(theme.palette.primary.main, 0.04)})`,
                    boxShadow: `0 10px 30px ${alpha(
                      theme.palette.primary.main,
                      0.14
                    )}`,
                  }}
                >
                  <Box
                    sx={{
                      p: { xs: 1.2, sm: 1.6 },
                      borderRadius: 2,
                      background: "white",
                      boxShadow: `0 8px 18px ${alpha(
                        theme.palette.common.black,
                        0.08
                      )}`,
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <QRCode value={selfServiceLink || ""} size={qrSize} />
                  </Box>
                </Box>

                <Stack spacing={1} sx={{ minWidth: { sm: 260 } }}>
                  <Typography variant="body2" fontWeight={600}>
                    QR code d’invitation
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Le QR encode le même lien nominatif. Idéal à afficher sur
                    un écran ou à imprimer pour un onboarding rapide.
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<ZoomInRoundedIcon />}
                      onClick={() => selfServiceLink && setQrDialogOpen(true)}
                    >
                      Agrandir le QR
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setSelfServiceLink(null)}
                    >
                      Masquer
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Collapse>

      {/* Dialog pour afficher le QR en grand */}
      {selfServiceLink && (
        <Dialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>QR code d'invitation</DialogTitle>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              pt: 1,
            }}
          >
            <Box
              sx={{
                p: { xs: 1.8, sm: 2.4 },
                borderRadius: 3,
                background: "white",
                boxShadow: `0 12px 30px ${alpha(
                  theme.palette.common.black,
                  0.12
                )}`,
              }}
            >
              <QRCode value={selfServiceLink} size={largeQrSize} />
            </Box>
            <Typography variant="body2" align="center">
              Scannez ce code ou partagez le lien associé pour rejoindre
              l’espace.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={() => {
                navigator.clipboard.writeText(selfServiceLink);
                setFeedback("Lien copié.");
              }}
            >
              Copier le lien
            </Button>
            <Button variant="contained" onClick={() => setQrDialogOpen(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Historique (caché par défaut) */}
      <Divider sx={{ my: 2, opacity: 0.15 }} />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="subtitle2">Historique des invitations</Typography>
        <Button
          size="small"
          variant="text"
          onClick={() => setShowHistory((v) => !v)}
          endIcon={
            showHistory ? (
              <ExpandLessRoundedIcon fontSize="small" />
            ) : (
              <ExpandMoreRoundedIcon fontSize="small" />
            )
          }
        >
          {showHistory ? "Masquer" : "Afficher"}
        </Button>
      </Stack>

      <Collapse in={showHistory} timeout="auto" unmountOnExit>
        {loading ? (
          <CircularProgress size={18} />
        ) : invites.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Aucune invitation envoyée pour cette personne.
          </Typography>
        ) : (
          <>
            <Stack spacing={1}>
              {invites.slice(0, 3).map(renderInviteRow)}
            </Stack>
            {invites.length > 3 && (
              <>
                <Collapse in={showMore} unmountOnExit>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {invites.slice(3).map(renderInviteRow)}
                  </Stack>
                </Collapse>
                <Button
                  size="small"
                  onClick={() => setShowMore((v) => !v)}
                  endIcon={
                    showMore ? (
                      <ExpandLessRoundedIcon fontSize="small" />
                    ) : (
                      <ExpandMoreRoundedIcon fontSize="small" />
                    )
                  }
                  sx={{ mt: 1 }}
                >
                  {showMore
                    ? "Masquer"
                    : `Voir ${invites.length - 3} de plus`}
                </Button>
              </>
            )}
          </>
        )}
      </Collapse>

      {/* Feedbacks */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={2000}
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
          autoHideDuration={3000}
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
