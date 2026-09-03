// src/scenes/invitations/InvitationPreviewPage.tsx
import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useAuth } from "../../contexts/AuthContext";
import { notifyError, notifySuccess } from "../../services/notification/toast.service";
import {
  InvitationPreviewResponse,
  previewInvitation,
  acceptInvitation,
} from "../../services/business/invitations/publicInvitation.service";
import {
  getPersonDisplayName,
  getPersonInitials,
} from "../../utils/personDisplayName";

// ---- Constantes / helpers ----
const PENDING_INVITATION_KEY = "invitation.pendingToken";

const storePendingInvitationToken = (token: string) => {
  if (!token) return;
  try {
    sessionStorage.setItem(PENDING_INVITATION_KEY, token);
  } catch {
    /* ignore */
  }
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const nMasked =
    name.length <= 2
      ? name[0] + "*"
      : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name.slice(-1);
  const [d1, d2] = domain.split(".");
  const dMasked = d1
    ? d1[0] + "*".repeat(Math.max(1, d1.length - 1))
    : domain;
  return `${nMasked}@${d2 ? `${dMasked}.${d2}` : dMasked}`;
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const normalizeEmail = (e?: string | null) => (e || "").trim().toLowerCase();

// ---- Petit composant pour afficher le profil de la personne ----
type PersonProfileProps = {
  person: NonNullable<InvitationPreviewResponse["person"]>;
};

const PersonProfilePreview: React.FC<PersonProfileProps> = ({ person }) => {
  const attrs = person.attributes || [];
  const fullName = getPersonDisplayName(person);
  const initials = getPersonInitials(person);
  const primaryPhoto =
    person.photos && person.photos.length > 0 ? person.photos[0] : null;

  const otherAttributes = attrs.slice(0, 4);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        p: 1.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.action.hover,
      }}
    >
      <Avatar src={primaryPhoto?.url || undefined} alt={fullName} sx={{ width: 56, height: 56 }}>
        {initials}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {fullName}
        </Typography>

        {otherAttributes.length > 0 && (
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
            {otherAttributes.map((attr) => (
              <Chip key={attr.id} size="small" label={attr.value} />
            ))}
          </Stack>
        )}

        <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
          Cette invitation est destinée à cette personne. Si ce n’est pas vous, ne validez pas l’invitation et contactez
          votre administrateur.
        </Typography>
      </Box>
    </Box>
  );
};

export default function InvitationPreviewPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { refreshSession, isAuthenticated, sessionEmails } = useAuth();

  const token = (search.get("token") || "").trim();
  const pinFromUrl = (search.get("pin") || "").trim(); // optionnel (utile pour email)

  const [loading, setLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<InvitationPreviewResponse | null>(null);
  const [error, setError] = React.useState<string>("");

  const [pin, setPin] = React.useState<string>(pinFromUrl);
  const [showPin, setShowPin] = React.useState<boolean>(false);
  const [accepting, setAccepting] = React.useState<boolean>(false);

  const depleted = React.useMemo(() => {
    if (!data) return false;
    return data.maxUses != null && data.usesCount >= data.maxUses;
  }, [data]);

  const isActive = React.useMemo(() => {
    if (!data) return false;
    return !data.revoked && !data.expired && !depleted;
  }, [data, depleted]);

  // ✅ IMPORTANT: pinRequired doit venir du back (bool).
  // Ici on garde un fallback en "any" pour éviter un crash si le type TS n'est pas encore aligné.
  const pinRequired = !!(data as any)?.pinRequired;

  // Charger l’aperçu via service
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setError("Lien invalide : token manquant.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await previewInvitation(token);
        if (!cancelled) {
          setData(res);
          setError("");

          // Si le lien contient un pin=... et que l'input est vide, on le préremplit.
          // (utile dans le cas EMAIL où on a mis pin en query param)
          const maybePinRequired = !!(res as any)?.pinRequired;
          if (maybePinRequired && pinFromUrl && !pin) {
            setPin(pinFromUrl);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.response?.status === 404
              ? "Invitation introuvable ou invalide."
              : e?.response?.data?.message || "Impossible de charger l’invitation.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notifySuccess("Lien copié dans le presse-papiers.");
    } catch {
      notifyError("Impossible de copier le lien.");
    }
  };

  const goToAuth = (mode: "signin" | "signup") => {
    if (!token) return;
    storePendingInvitationToken(token);
    navigate(`/${mode}?token=${encodeURIComponent(token)}&fromInvitation=1`);
  };

  const handleAccept = async () => {
    if (!data || !token) return;
    if (!isActive) return;

    // ✅ Si PIN requis, on bloque côté client si vide
    if (pinRequired && !pin.trim()) {
      notifyError("Ce lien est protégé par un PIN. Veuillez saisir le PIN.");
      return;
    }

    try {
      setAccepting(true);
      await acceptInvitation({
        token,
        pin: pinRequired ? pin.trim() : null,
        personId: data.person ? data.person.id : null,
      });
      await refreshSession();
      notifySuccess("Invitation acceptée !");
      navigate("/");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Échec de l’acceptation.";
      notifyError(msg);
    } finally {
      setAccepting(false);
    }
  };

  // UI: chargement / erreur
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={0} variant="outlined">
          <CardHeader title="Invitation" subheader="Chargement…" />
          <CardContent>
            <Stack gap={2}>
              <LinearProgress />
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Merci de patienter, on vérifie ce lien…
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={0} variant="outlined">
          <CardHeader title="Invitation" />
          <CardContent>
            <Alert severity="error" icon={<InfoOutlinedIcon />}>
              {error || "Invitation introuvable."}
            </Alert>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate("/")}>
                Retour à l’accueil
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ---- Vérif email d’invitation vs emails du compte ----
  const invitationEmailNorm = data.email ? normalizeEmail(data.email) : null;
  const accountEmailsNorm = (sessionEmails || []).map(normalizeEmail);

  const hasMatchingEmail =
    !!invitationEmailNorm && accountEmailsNorm.includes(invitationEmailNorm);

  const mustMatchEmail = !!data.email; // on ne bloque que si une adresse est spécifiée sur l’invitation
  const emailMismatch = mustMatchEmail && isAuthenticated && !hasMatchingEmail;

  const canAccept =
    isActive &&
    !accepting &&
    (!pinRequired || pin.trim().length > 0) &&
    (!mustMatchEmail || !isAuthenticated || hasMatchingEmail);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card elevation={1} variant="outlined">
        <CardHeader
          title={data.label || "Invitation à rejoindre l’organisation"}
          subheader={data.role ? `Rôle proposé : ${data.role}` : undefined}
          action={
            <Tooltip title="Copier l’URL">
              <IconButton onClick={handleCopyUrl}>
                <ContentCopyRoundedIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          {/* Badges d’état */}
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {data.type && (
              <Chip
                size="small"
                label={data.type === "EMAIL" ? "Invitation par e-mail" : "Lien partagé"}
              />
            )}
            {data.role && (
              <Chip size="small" color="primary" label={`Rôle proposé : ${data.role}`} />
            )}
            {data.email && (
              <Chip size="small" variant="outlined" label={`Nominative : ${maskEmail(data.email)}`} />
            )}
            {data.person && !data.email && (
              <Chip size="small" variant="outlined" label="Invitation nominative (fiche personne)" />
            )}
            {pinRequired && <Chip size="small" variant="outlined" label="PIN requis" />}
            {data.expiresAt && (
              <Chip
                size="small"
                variant="outlined"
                label={`Expire le ${fmtDateTime(data.expiresAt)}`}
                color={data.expired ? "error" : "default"}
              />
            )}
            {data.revoked && <Chip size="small" color="error" label="Révoquée" />}
            {depleted && <Chip size="small" color="warning" label="Nombre d’utilisations atteint" />}
          </Stack>

          {/* Note libre */}
          {!!data.note && (
            <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}>
              {data.note}
            </Typography>
          )}

          {/* Profil de la personne nominative */}
          {data.person && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.9 }}>
                Cette invitation est nominative
              </Typography>
              <PersonProfilePreview person={data.person} />
            </Box>
          )}

          {/* Explication email si invitation nominative par email */}
          {data.email && !isAuthenticated && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Cette invitation est destinée à l’adresse <strong>{data.email}</strong>. Connectez-vous ou créez un compte
              (idéalement avec cette adresse, ou ajoutez-la ensuite à votre compte) pour pouvoir accepter l’invitation.
            </Alert>
          )}

          {data.email && isAuthenticated && hasMatchingEmail && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Cette invitation est destinée à <strong>{data.email}</strong>. Cet e-mail est déjà rattaché à votre compte.
            </Alert>
          )}

          {emailMismatch && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Cette invitation est destinée à l’adresse <strong>{data.email}</strong>, mais cette adresse n’est pas
                encore rattachée à votre compte.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Ajoutez cet e-mail à votre compte, validez-le, puis revenez sur cette page pour accepter l’invitation.
              </Typography>
              <Box sx={{ mt: 1.5, textAlign: "right" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    navigate(`/settings?section=emails&emailHint=${encodeURIComponent(data.email!)}`)
                  }
                >
                  Gérer mes e-mails
                </Button>
              </Box>
            </Alert>
          )}

          {/* Quotas */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Utilisations
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {data.maxUses == null ? "illimitées" : `${data.usesCount}/${data.maxUses}`}
              </Typography>
            </Stack>
            {data.maxUses != null ? (
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (data.usesCount / Math.max(1, data.maxUses)) * 100)}
              />
            ) : (
              <LinearProgress variant="indeterminate" sx={{ opacity: 0.25 }} />
            )}
          </Box>

          {/* Bannières d’état si non active */}
          {!isActive && (
            <Alert severity={data.revoked ? "error" : data.expired ? "error" : "warning"} sx={{ mb: 2 }}>
              {data.revoked
                ? "Cette invitation a été révoquée par un administrateur."
                : data.expired
                ? "Cette invitation est expirée."
                : depleted
                ? "Le nombre d’utilisations maximum est atteint."
                : "Invitation inactive."}
            </Alert>
          )}

          {/* Guide */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.9 }}>
              Comment ça marche ?
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              1) Connectez-vous ou créez un compte. 2) Si nécessaire, ajoutez l’e-mail requis à votre compte. 3) Revenez
              sur cette page pour accepter l’invitation et rejoindre l’organisation avec le rôle proposé.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Actions */}
          {!isAuthenticated ? (
            <Stack gap={1.5}>
              <Alert severity="info" sx={{ mb: 0.5 }}>
                Vous avez reçu une invitation. Connectez-vous ou créez un compte pour pouvoir la confirmer. Nous vous
                ramènerons automatiquement ici après l’authentification.
              </Alert>

              <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => goToAuth("signup")}>
                  Créer un compte
                </Button>
                <Button onClick={() => goToAuth("signin")} variant="contained" startIcon={<LoginRoundedIcon />}>
                  Se connecter
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack gap={1.5}>
              {/* ✅ PIN uniquement si requis */}
              {pinRequired && (
                <>
                  <TextField
                    label="Code PIN requis"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Saisissez le PIN fourni par l’administrateur"
                    autoComplete="one-time-code"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPin((v) => !v)} edge="end">
                            {showPin ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Typography variant="caption" sx={{ mt: -0.5, opacity: 0.75 }}>
                    Ce lien est protégé par un PIN. Si vous ne l’avez pas, contactez votre administrateur.
                  </Typography>
                </>
              )}

              {emailMismatch && (
                <Typography variant="caption" color="warning.main" sx={{ mt: -0.5 }}>
                  Pour accepter cette invitation, vous devez d’abord ajouter l’e-mail nominatif à votre compte.
                </Typography>
              )}

              <Stack direction="row" gap={1} justifyContent="flex-end">
                <Button variant="text" onClick={() => navigate("/")}>
                  Plus tard
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    accepting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CheckCircleRoundedIcon />
                    )
                  }
                  disabled={!canAccept}
                  onClick={handleAccept}
                >
                  Accepter l’invitation
                </Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 2, textAlign: "center", opacity: 0.7 }}>
        <Typography variant="caption">
          Besoin d’aide ? Contactez votre administrateur. Ne partagez pas ce lien.
        </Typography>
      </Box>
    </Container>
  );
}
