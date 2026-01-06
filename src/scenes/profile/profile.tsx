// src/scenes/profile/ProfilePage.tsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AddAPhotoRoundedIcon from "@mui/icons-material/AddAPhotoRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

import { useProfile } from "../../contexts/ProfileContext";
import PhotoAvatarSection from "./components/PhotoAvatarSection";
import AccountSection from "./components/AccountSection";
import AttributesSection from "./components/attributes/AttributesSection";
import XpProfileBadge from "./components/XpProfileBadge";

type PersonLinkAction = "DISABLED" | "DIRECT" | "REQUEST";

function isEnabled(action: PersonLinkAction) {
  return action !== "DISABLED";
}

function getCtaLabel(base: string, action: PersonLinkAction) {
  return action === "REQUEST" ? `Demander ${base}` : base;
}

const OnboardingInlineCtas: React.FC<{
  createAction: PersonLinkAction;
  pickAction: PersonLinkAction;
  onCreate: (mode: "DIRECT" | "REQUEST") => void;
  onPick: (mode: "DIRECT" | "REQUEST") => void;
}> = ({ createAction, pickAction, onCreate, onPick }) => {
  const nothingAllowed = createAction === "DISABLED" && pickAction === "DISABLED";
  const hasApproval = createAction === "REQUEST" || pickAction === "REQUEST";

  if (nothingAllowed) {
    return (
      <Alert severity="info" icon={<LockRoundedIcon />}>
        Ton compte n’est pas encore associé à un profil dans cette organisation. Contacte un administrateur.
      </Alert>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        backdropFilter: "blur(12px)",
        bgcolor: "rgba(32,32,32,0.7)",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Finaliser ton profil</Typography>
            {hasApproval ? (
              <Chip size="small" icon={<InfoOutlinedIcon />} label="Validation possible" variant="outlined" />
            ) : null}
          </Box>

          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Crée ton profil (photo + infos) ou choisis un profil existant pour apparaître dans le trombinoscope.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddAPhotoRoundedIcon />}
              disabled={!isEnabled(createAction)}
              onClick={() => onCreate(createAction === "REQUEST" ? "REQUEST" : "DIRECT")}
              fullWidth
            >
              {getCtaLabel("créer mon profil", createAction)}
            </Button>

            <Button
              variant="outlined"
              startIcon={<PersonSearchRoundedIcon />}
              disabled={!isEnabled(pickAction)}
              onClick={() => onPick(pickAction === "REQUEST" ? "REQUEST" : "DIRECT")}
              fullWidth
            >
              {getCtaLabel("choisir un profil", pickAction)}
            </Button>
          </Stack>

          {hasApproval ? (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Certaines actions peuvent nécessiter une validation.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const AttributesEmptyState: React.FC<{
  createAction: PersonLinkAction;
  pickAction: PersonLinkAction;
  onCreate: (mode: "DIRECT" | "REQUEST") => void;
  onPick: (mode: "DIRECT" | "REQUEST") => void;
}> = ({ createAction, pickAction, onCreate, onPick }) => {
  const nothingAllowed = createAction === "DISABLED" && pickAction === "DISABLED";
  const hasApproval = createAction === "REQUEST" || pickAction === "REQUEST";

  return (
    <Card
      variant="outlined"
      sx={{
        backdropFilter: "blur(12px)",
        bgcolor: "rgba(32,32,32,0.7)",
        flex: "0 0 auto",
      }}
    >
      <CardContent>
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 800 }}>Informations du profil</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Les attributs (prénom, nom, etc.) apparaîtront ici une fois ton profil associé.
          </Typography>

          <Divider sx={{ opacity: 0.2 }} />

          {nothingAllowed ? (
            <Alert severity="info" icon={<LockRoundedIcon />}>
              Un administrateur doit d’abord associer ton compte à un profil.
            </Alert>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddAPhotoRoundedIcon />}
                disabled={!isEnabled(createAction)}
                onClick={() => onCreate(createAction === "REQUEST" ? "REQUEST" : "DIRECT")}
                fullWidth
              >
                {getCtaLabel("créer", createAction)}
              </Button>

              <Button
                variant="outlined"
                startIcon={<PersonSearchRoundedIcon />}
                disabled={!isEnabled(pickAction)}
                onClick={() => onPick(pickAction === "REQUEST" ? "REQUEST" : "DIRECT")}
                fullWidth
              >
                {getCtaLabel("choisir", pickAction)}
              </Button>
            </Stack>
          )}

          {hasApproval ? (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Une validation peut être requise selon les règles de l’organisation.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const ProfilePage: React.FC = () => {
  const { refreshProfile, hasPendingChangeRequests, profile, onboarding, loading, error } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const lastRefreshRef = useRef<number>(0);

  // 1) À chaque "entrée" sur la page Profil : si CR en cours → refresh immédiat
  useEffect(() => {
    if (hasPendingChangeRequests) {
      refreshProfile();
      lastRefreshRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, hasPendingChangeRequests]);

  // 2) Quand l’onglet reprend le focus : si CR en cours → refresh (throttlé)
  useEffect(() => {
    if (!hasPendingChangeRequests) return;

    const onFocusOrVisible = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 5000) return; // throttle 5s
      refreshProfile();
      lastRefreshRef.current = now;
    };

    window.addEventListener("focus", onFocusOrVisible);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") onFocusOrVisible();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingChangeRequests]);

  const hasPerson = Boolean(profile);

  const createAction: PersonLinkAction = useMemo(
    () => onboarding?.createPerson ?? "DISABLED",
    [onboarding?.createPerson]
  );
  const pickAction: PersonLinkAction = useMemo(
    () => onboarding?.pickPerson ?? "DISABLED",
    [onboarding?.pickPerson]
  );

  const handleCreate = (mode: "DIRECT" | "REQUEST") => {
    navigate(mode === "DIRECT" ? "/profile/create" : "/profile/create/request");
  };
  const handlePick = (mode: "DIRECT" | "REQUEST") => {
    navigate(mode === "DIRECT" ? "/profile/pick" : "/profile/pick/request");
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "calc(100vh - var(--header-height) - var(--footer-height))",
        display: "flex",
        flexDirection: "column",
        py: 2,
        boxSizing: "border-box",
      }}
    >
      {/* Scroll/comportement identique à ta version initiale (pas de wrapper overflow ajouté) */}
      <Stack spacing={3} flex={1} sx={{ minHeight: 0 }}>
        {/* Header léger */}
        {hasPerson ??
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
              Ton compte est prêt. Il manque juste ton profil public dans l’organisation.
          </Typography>
        </Box>
        }

        {error && <Alert severity="error">Une erreur est survenue lors du chargement du profil.</Alert>}

        {/* 1) Avatar : toujours affiché */}
        <PhotoAvatarSection />

        <XpProfileBadge variant="bar" />

        {/* CTA onboarding subtil (seulement si pas de person) */}
        {!loading && !hasPerson && (
          <OnboardingInlineCtas
            createAction={createAction}
            pickAction={pickAction}
            onCreate={handleCreate}
            onPick={handlePick}
          />
        )}

        {/* 2) Compte : prioritaire */}
        <AccountSection />

        {/* 3) Attributs : vrai bloc si person, sinon état vide */}
        {hasPerson ? (
          <AttributesSection />
        ) : (
          !loading && (
            <AttributesEmptyState
              createAction={createAction}
              pickAction={pickAction}
              onCreate={handleCreate}
              onPick={handlePick}
            />
          )
        )}
      </Stack>
    </Container>
  );
};

export default ProfilePage;
