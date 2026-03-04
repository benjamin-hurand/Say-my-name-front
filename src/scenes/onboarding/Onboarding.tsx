// src/scenes/onboarding/Onboarding.tsx
import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SvgLogo from "../menu/components/svg/logoSvg";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import { notifyError, notifySuccess } from "../../services/notification/toast.service";

export default function Onboarding() {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();

  const [joinOpen, setJoinOpen] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinLoading, setJoinLoading] = React.useState(false);

  const openJoin = () => setJoinOpen(true);
  const closeJoin = () => {
    if (joinLoading) return;
    setJoinOpen(false);
    setJoinCode("");
  };

  const submitJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;

    setJoinLoading(true);
    try {
      // TODO (backend): appeler ton endpoint "join by code"
      // ex: await joinTenantByCode(code);
      // puis refresh session/orgs si nécessaire
      notifySuccess("Code reçu. Finalise le branchement API pour rejoindre l’organisation.");
      closeJoin();

      // Optionnel: après join, tu peux rediriger vers "/" si org active est set
      // navigate("/", { replace: true });
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Impossible de rejoindre l’organisation avec ce code.");
      setJoinLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        textAlign: "center",
        gap: 3,
      }}
    >
      <SvgLogo
        color={color}
        style={{
          width: "auto",
          height: "clamp(72px, 18svh, 220px)",
          filter: "none",
          transition: "none",
        }}
      />

      <Box sx={{ maxWidth: 560 }}>
        <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700 }}>
          Bienvenue sur SayMyName
        </Typography>

        <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
          Tu es connecté, mais tu n’as pas encore d’organisation.
          <br />
          Crée ton espace ou rejoins une équipe pour commencer.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="center"
          sx={{ mt: 2 }}
        >
          <Button
            variant="contained"
            onClick={() => navigate("/settings")}
            sx={{ minWidth: 240, borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            Créer une organisation
          </Button>

          <Button
            variant="outlined"
            onClick={openJoin}
            sx={{ minWidth: 240, borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            Rejoindre avec un code
          </Button>
        </Stack>

        <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.7 }}>
          Si tu as reçu un lien d’invitation (email, message, QR), ouvre-le directement.
          Sinon, utilise un code fourni par ton équipe.
        </Typography>
      </Box>

      {/* Dialog: Join by code */}
      <Dialog
        open={joinOpen}
        onClose={closeJoin}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Rejoindre une organisation</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Saisis le code fourni par ton équipe. Exemple : <strong>ABCD-1234</strong>
            </Typography>

            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Code"
              placeholder="ABCD-1234"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              inputProps={{ style: { textTransform: "uppercase", letterSpacing: 1 } }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitJoin();
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeJoin} disabled={joinLoading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={submitJoin}
            disabled={!joinCode.trim() || joinLoading}
            sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {joinLoading ? "Connexion…" : "Rejoindre"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
