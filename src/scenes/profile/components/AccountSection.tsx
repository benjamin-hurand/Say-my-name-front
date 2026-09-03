// src/components/settings/account/AccountSection.tsx
import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorOutlineIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useProfile } from "../../../contexts/ProfileContext";
import { updateDisplayName } from "../../../services/business/profile/profile.service";

// -----------------------------
// Helpers
// -----------------------------
function safeTrim(s?: string | null) {
  return (s ?? "").trim();
}

function prettifyApiError(e: any): string {
  const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Une erreur est survenue.";
  return String(msg);
}

// -----------------------------
// Dialog: Edit display name
// -----------------------------
type EditDisplayNameDialogProps = {
  open: boolean;
  currentValue: string;
  onClose: () => void;
  onSaved: (newDisplayName?: string) => Promise<void> | void;
};

const EditDisplayNameDialog: React.FC<EditDisplayNameDialogProps> = ({
  open,
  currentValue,
  onClose,
  onSaved,
}) => {
  const [value, setValue] = React.useState(currentValue);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setValue(currentValue);
    setLoading(false);
    setError(null);
  }, [open, currentValue]);

  const handleSave = async () => {
    setError(null);
    const v = safeTrim(value);

    if (!v) {
      setError("Renseigne un nom de compte.");
      return;
    }
    if (v.length > 50) {
      setError("Le nom du compte est trop long (50 caractères max).");
      return;
    }
    if (v === safeTrim(currentValue)) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const res = await updateDisplayName({ displayName: v });
      await onSaved(res?.displayName ?? v);
      onClose();
    } catch (e) {
      setError(prettifyApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Modifier le nom du compte</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nom du compte"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            fullWidth
            disabled={loading}
            inputProps={{ maxLength: 50 }}
            helperText="Ce nom sert à identifier ton compte."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// -----------------------------
// Main Section
// -----------------------------
const AccountSection: React.FC = () => {
  const { user, profile, refreshProfile } = useProfile();

  const displayName = user?.displayName ?? "Moi";

  // Optimistic display name
  const [optimisticDisplayName, setOptimisticDisplayName] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOptimisticDisplayName(null);
  }, [user?.displayName]);

  const renderedDisplayName = optimisticDisplayName ?? displayName;

  // Emails (read-only)
  const primaryEmail: string = (user as any)?.primaryEmail ?? (user as any)?.email ?? "";
  const emailsList: Array<any> = (user as any)?.emails ?? (profile as any)?.user?.emails ?? [];

  const emails = React.useMemo(() => {
    if (Array.isArray(emailsList) && emailsList.length > 0) return emailsList;
    if (primaryEmail) return [{ id: "primary", email: primaryEmail, verifiedAt: true }];
    return [];
  }, [emailsList, primaryEmail]);

  const hasUnverified = emails.some((e: any) => !Boolean(e.verifiedAt ?? e.isVerified));

  // Dialogs
  const [openEditName, setOpenEditName] = React.useState(false);

  // Menu actions
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchor);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const [refreshError, setRefreshError] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshError(null);
    try {
      await refreshProfile();
    } catch {
      setRefreshError("Impossible de rafraîchir les informations du compte.");
    }
  };

  const handleDisplayNameSaved = async (newDisplayName?: string) => {
    if (newDisplayName) setOptimisticDisplayName(newDisplayName);
    await handleRefresh();
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{ backdropFilter: "blur(12px)", bgcolor: "rgba(32,32,32,0.7)", flex: "0 0 auto" }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Mon Compte
            </Typography>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Rafraîchir">
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Options">
                <IconButton onClick={openMenu} size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Menu
              anchorEl={menuAnchor}
              open={isMenuOpen}
              onClose={closeMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem
                onClick={() => {
                  closeMenu();
                  setOpenEditName(true);
                }}
              >
                <EditIcon fontSize="small" style={{ marginRight: 10 }} />
                Modifier le nom du compte
              </MenuItem>
            </Menu>
          </Box>

          {refreshError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {refreshError}
            </Alert>
          )}

          <Stack spacing={2}>
            {/* Nom du compte */}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Nom du compte
              </Typography>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {renderedDisplayName}
              </Typography>
            </Box>

            <Divider sx={{ opacity: 0.25 }} />

            {/* Emails */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Emails</Typography>
                {hasUnverified ? (
                  <Chip size="small" icon={<ErrorOutlineIcon />} label="Action requise" variant="outlined" />
                ) : null}
              </Box>

              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {emails.length === 0 ? (
                  <Typography sx={{ opacity: 0.8 }}>Aucun email.</Typography>
                ) : (
                  emails.map((e: any, idx: number) => {
                    const value = e.email ?? e.value ?? "";
                    const isVerified = Boolean(e.verifiedAt ?? e.isVerified);

                    return (
                      <Box
                        key={e.id ?? `${value}-${idx}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          py: 0.25,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600 }} noWrap>
                            {value}
                          </Typography>

                          {!isVerified && (
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center" }}>
                              <Chip size="small" icon={<ErrorOutlineIcon />} label="Non vérifié" variant="outlined" />
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <EditDisplayNameDialog
        open={openEditName}
        currentValue={renderedDisplayName}
        onClose={() => setOpenEditName(false)}
        onSaved={handleDisplayNameSaved}
      />
    </>
  );
};

export default AccountSection;
