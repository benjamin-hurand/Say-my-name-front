import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { OrgRole, formatRole } from "../../../../../models/organizations/UserOrganization";
import { listInvitations, createInvitation, revokeInvitation, deleteInvitation } from "../../../../../services/business/admin/invitations.service";
import { InvitationDto, isInvitationExpired, CreateInvitationRequestDto } from "../../../../../services/dto/person/admin/InvitationDto";
import { PersonEmailDto } from "../../../../../services/dto/person/admin/PersonEmailDto";


/* ====================================================================
   Helpers & types
==================================================================== */

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const randomHex = (len = 64) =>
  [...crypto.getRandomValues(new Uint8Array(len / 2))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const randomPin = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

type DerivedStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

function deriveStatus(inv: InvitationDto): DerivedStatus {
  if (inv.acceptedAt) return "ACCEPTED";
  if (inv.revokedAt) return "REVOKED";
  if (isInvitationExpired(inv.expiresAt)) return "EXPIRED";
  return "PENDING";
}

const statusChip = (inv: InvitationDto) => {
  const s = deriveStatus(inv);
  switch (s) {
    case "ACCEPTED":
      return <Chip size="small" color="success" label="Acceptée" />;
    case "PENDING":
      return <Chip size="small" color="info" label="En attente" />;
    case "EXPIRED":
      return <Chip size="small" color="default" label="Expirée" />;
    case "REVOKED":
      return <Chip size="small" color="warning" label="Révoquée" />;
    default:
      return <Chip size="small" label={s} />;
  }
};

const ORG_ROLES: OrgRole[] = ["VIEWER", "EDITOR", "ADMIN", "OWNER"];
type InviteType = "EMAIL" | "LINK";
export type OrgInvitationDefaults = {
  /** Rôle proposé par défaut (peut être verrouillé) */
  defaultRole?: OrgRole | null;
  /** Locale par défaut, ex: "fr" */
  defaultLocale?: string;
  /** Faut-il un PIN par défaut ? */
  requirePin?: boolean;
  /** Faut-il que l'email du compte matche celui de l'invitation ? */
  requireEmailMatch?: boolean;

  /** Nombre d'utilisations max par défaut (null = illimité) */
  maxUses?: number | null;

  /** Verrouiller ces paramètres côté front (readonly) */
  lockRole?: boolean;
  lockPin?: boolean;
  lockEmailMatch?: boolean;
  lockMaxUses?: boolean;
};

type Props = {
  open: boolean;
  personId: number;
  emails: PersonEmailDto[];
  /** Vrai si une fiche user est deja liee a cette personne */
  hasLinkedUserAccount: boolean;
  /** Defaults eventuels d'organisation */
  orgDefaults?: OrgInvitationDefaults | null;
  /** Pour prevenir le parent qu'une invitation a ete creee / modifiee (facultatif) */
  onInvitesChanged?: () => void | Promise<void>;
  /** Permet d'ouvrir le formulaire depuis le parent (incrementer la valeur) */
  openFormSignal?: number;
};

export const AdminPersonInvitationsSection: React.FC<Props> = (props) => {
  const {
    open,
    personId,
    emails,
    hasLinkedUserAccount,
    orgDefaults,
    onInvitesChanged,
    openFormSignal,
  } = props;
  const theme = useTheme();

  // ===== Emails existants =====
  const activeEmails = useMemo(
    () => emails.filter((e) => e.active),
    [emails]
  );
  const primaryEmail = useMemo(
    () => emails.find((e) => e.primary) || null,
    [emails]
  );

  // ===== Liste des invitations =====
  const [invites, setInvites] = useState<InvitationDto[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);

  const refreshInvites = async () => {
    if (!personId) return;
    setInvLoading(true);
    setInvError(null);
    try {
      const list = await listInvitations();
      setInvites(list);
    } catch (e: any) {
      setInvError(e?.message || "Impossible de charger les invitations.");
    } finally {
      setInvLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !personId) return;
    void refreshInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personId]);

  const personEmailsSet = useMemo(
    () => new Set(emails.map((e) => e.email)),
    [emails]
  );

  const personInvites = useMemo(
    () =>
      invites.filter(
        (inv) =>
          inv.personId === personId ||
          (inv.email ? personEmailsSet.has(inv.email) : false)
      ),
    [invites, personId, personEmailsSet]
  );

  // ===== Formulaire dâ€™invitation =====
  const [showInvite, setShowInvite] = useState(false);
  const [inviteType, setInviteType] = useState<InviteType>("EMAIL");
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<OrgRole | "">("");
  const [inviteLocale, setInviteLocale] = useState<string>("fr");
  const [inviteMsg, setInviteMsg] = useState<string>("");

  // Nouveaux paramÃ¨tres
  const [requirePin, setRequirePin] = useState<boolean>(true);
  const [requireEmailMatch, setRequireEmailMatch] = useState<boolean>(false);
  const [maxUsesEnabled, setMaxUsesEnabled] = useState<boolean>(false);
  const [maxUses, setMaxUses] = useState<number>(1);

  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const lastOpenSignal = useRef<number>(openFormSignal ?? 0);

  // Init des valeurs par dÃ©faut Ã  lâ€™ouverture
  useEffect(() => {
    if (!open) return;

    const preferred = primaryEmail?.email || activeEmails[0]?.email || "";
    setInviteEmail(preferred);

    setInviteRole((orgDefaults?.defaultRole ?? "") as OrgRole | "");
    setInviteLocale(orgDefaults?.defaultLocale ?? "fr");
    setRequirePin(orgDefaults?.requirePin ?? true);
    setRequireEmailMatch(orgDefaults?.requireEmailMatch ?? false);

    if (orgDefaults?.maxUses != null) {
      setMaxUsesEnabled(true);
      setMaxUses(Math.max(1, orgDefaults.maxUses));
    } else {
      setMaxUsesEnabled(false);
      setMaxUses(1);
    }

    setInviteMsg("");
    setInviteHint(null);
    setInvError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personId, primaryEmail?.email]);
  useEffect(() => {
    if (openFormSignal == null) return;
    if (openFormSignal !== lastOpenSignal.current) {
      lastOpenSignal.current = openFormSignal;
      setShowInvite(true);
      setInviteHint(null);
      setInvError(null);
    }
  }, [openFormSignal]);

  const canSendInvite = useMemo(() => {
    if (!personId) return false;
    if (inviteType === "EMAIL") return isEmail(inviteEmail);
    return true; // LINK
  }, [inviteType, inviteEmail, personId]);

  const handleSendInvite = async () => {
    if (!personId) return;
    setInviteHint(null);
    setInvError(null);

    if (!canSendInvite) {
      setInvError(
        inviteType === "EMAIL"
          ? "Veuillez saisir un e-mail valide."
          : "Paramètres d'invitation invalides."
      );
      return;
    }

    setInviteBusy(true);
    try {
      const constraints: Record<string, any> = {
        locale: inviteLocale || "fr",
        message: inviteMsg || undefined,
        requireEmailMatch: requireEmailMatch || undefined,
        requirePin: requirePin || undefined,
      };

      const payload: CreateInvitationRequestDto = {
        type: inviteType,
        label: null,
        note: null,
        constraintsJson: JSON.stringify(constraints),
        role: (inviteRole || null) as OrgRole | null,
        email: inviteType === "EMAIL" ? inviteEmail : null,
        personId,
        expiresAt: null,
        maxUses: maxUsesEnabled ? maxUses : null,
        rawToken: randomHex(64),
        rawPin: requirePin ? randomPin() : undefined,
      };

      await createInvitation(payload);
      await refreshInvites();
      if (onInvitesChanged) await onInvitesChanged();

      setInviteHint(
        inviteType === "LINK"
          ? "Lien d'invitation créé."
          : "Invitation envoyée."
      );
      setInviteMsg("");
    } catch (e: any) {
      setInvError(e?.message || "Échec de l'invitation.");
    } finally {
      setInviteBusy(false);
    }
  };
    } finally {
      setInviteBusy(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setInviteHint("Lien copiÃ© dans le presse-papiers.");
    } catch {
      setInviteHint("Impossible de copier le lien.");
    }
  };

  const handleRevoke = async (id: number) => {
    await revokeInvitation(id);
    await refreshInvites();
    if (onInvitesChanged) await onInvitesChanged();
  };

  const handleDelete = async (id: number) => {
    await deleteInvitation(id);
    await refreshInvites();
    if (onInvitesChanged) await onInvitesChanged();
  };

  return (
    <Box>
      <Divider sx={{ my: 2.5, opacity: 0.6 }} />

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Invitations</Typography>
        {!!personInvites.length && (
          <Chip
            size="small"
            variant="outlined"
            label={`${personInvites.length}`}
          />
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="contained"
          startIcon={<EmailRoundedIcon />}
          onClick={() => setShowInvite((v) => !v)}
          disabled={inviteBusy}
        >
          {showInvite
            ? "Fermer"
            : hasLinkedUserAccount
            ? "Inviter Ã  nouveau"
            : "Inviter"}
        </Button>
      </Stack>

      {showInvite && (
        <Stack
          spacing={1}
          sx={{
            mb: 1.5,
            p: 1.25,
            borderRadius: 2,
            border: `1px dashed ${alpha(
              theme.palette.text.primary,
              0.2
            )}`,
          }}
        >
          {/* Ligne type + rÃ´le + langue */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={inviteType}
              onChange={(_, v: InviteType | null) => v && setInviteType(v)}
            >
              <ToggleButton value="EMAIL">
                <EmailRoundedIcon fontSize="small" sx={{ mr: 0.5 }} /> E-mail
              </ToggleButton>
              <ToggleButton value="LINK">
                <LinkRoundedIcon fontSize="small" sx={{ mr: 0.5 }} /> Lien
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              size="small"
              label="Rôle"
              select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole((e.target.value || "") as OrgRole | "")
              }
              sx={{ minWidth: 180 }}
              helperText={
                orgDefaults?.lockRole
                  ? "Rôle imposé par l'organisation."
                  : "Optionnel — si vide, le rôle par défaut sera appliqué."
              }
              disabled={!!orgDefaults?.lockRole}
            >
              <MenuItem value="">
                <em>(aucun)</em>
              </MenuItem>
              {ORG_ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {formatRole(r)}
                </MenuItem>
              ))}
            </TextField>
            </TextField>

            <TextField
              size="small"
              label="Langue"
              value={inviteLocale}
              onChange={(e) => setInviteLocale(e.target.value)}
              sx={{ width: 110 }}
            />
          </Stack>

          {/* Email si mode EMAIL */}
          {inviteType === "EMAIL" && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                size="small"
                label="E-mail destinataire"
                placeholder={primaryEmail?.email || "prenom.nom@exemple.com"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                error={!!inviteEmail && !isEmail(inviteEmail)}
                sx={{ maxWidth: 420 }}
                helperText={
                  activeEmails.length
                    ? `E-mails connus : ${activeEmails
                        .map((e) => e.email)
                        .join(', ')}`
                    : "Aucun e-mail actif trouvé — saisissez une adresse."
                }
              />
            </Stack>
          )}

          {/* Options avancées : PIN, match email, maxUses */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexWrap="wrap"
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={requirePin}
                  onChange={(e) => setRequirePin(e.target.checked)}
                  disabled={!!orgDefaults?.lockPin}
                />
              }
              label="Protéger l'invitation par un code PIN"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={requireEmailMatch}
                  onChange={(e) => setRequireEmailMatch(e.target.checked)}
                  disabled={!!orgDefaults?.lockEmailMatch}
                />
              }
              label="L'e-mail du compte devra correspondre"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={maxUsesEnabled}
                  onChange={(e) => setMaxUsesEnabled(e.target.checked)}
                  disabled={!!orgDefaults?.lockMaxUses}
                />
              }
              label="Limiter le nombre d'utilisations"
            />

            {maxUsesEnabled && (
              <TextField
                size="small"
                type="number"
                label="Utilisations max."
                value={maxUses}
                onChange={(e) =>
                  setMaxUses(
                    Math.max(1, Number(e.target.value) || 1)
                  )
                }
                sx={{ width: 150 }}
              />
            )}
          </Stack>

          <TextField
            size="small"
            label="Message (optionnel)"
            placeholder="Quelques mots pour personnaliser l'invitation"
            value={inviteMsg}
            onChange={(e) => setInviteMsg(e.target.value)}
            multiline
            minRows={2}
          />

          {invError && <Alert severity="error">{invError}</Alert>}
          {inviteHint && <Alert severity="success">{inviteHint}</Alert>}

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={
                inviteType === "EMAIL" ? (
                  <EmailRoundedIcon />
                ) : (
                  <LinkRoundedIcon />
                )
              }
              onClick={handleSendInvite}
              disabled={!canSendInvite || inviteBusy}
            >
              {inviteType === "EMAIL"
                ? "Envoyer l'invitation"
                : "Générer un lien"}
            </Button>
            <Button
              variant="text"
              onClick={() => setShowInvite(false)}
              disabled={inviteBusy}
            >
            >
              Annuler
            </Button>
          </Stack>
        </Stack>
      )}

      {/* Liste des invitations existantes */}
      {invLoading ? (
        <CircularProgress size={18} />
      ) : personInvites.length > 0 ? (
        <Stack spacing={1}>
          {personInvites.map((inv) => {
            const status = deriveStatus(inv);
            const canCancel = status === "PENDING";

            const maybeLink =
              inv.type === "LINK"
                ? ((inv as any).publicUrl ||
                   (inv as any).url ||
                   (inv as any).link ||
                   null)
                : null;

            return (
              <Stack
                key={inv.id}
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ minWidth: 0, flex: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {new Date(inv.createdAt).toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    {inv.role
                      ? formatRole(inv.role as OrgRole)
                      : "—"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {inv.email ?? (maybeLink ? "Lien d'invitation" : "—")}
                  </Typography>
                  <Box sx={{ ml: 1 }}>{statusChip(inv)}</Box>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  {maybeLink && (
                    <Tooltip title="Copier le lien">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleCopy(String(maybeLink))
                          }
                        >
                          <ContentCopyRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title="Révoquer">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleRevoke(inv.id)}
                        disabled={!canCancel}
                      >
                        <CancelRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(inv.id)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Aucune invitation envoyée pour cette personne.
        </Typography>
      )}
    </Box>
  );
};
      )}
    </Box>
  );
};



