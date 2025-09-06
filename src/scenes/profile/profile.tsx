// src/scenes/profile/ProfilePage.tsx
import React from "react";
import { Container, Stack } from "@mui/material";
import { useProfile } from "../../contexts/ProfileContext";
import PhotoAvatarSection from "./components/PhotoAvatarSection";
import AccountSection from "./components/AccountSection";
import AttributesSection from "./components/attributes/AttributesSection";

const ProfilePage: React.FC = () => {
  // Le parent reste minimaliste, tout le fonctionnement est délégué aux enfants.
  useProfile(); // Optionnel : utile si tu veux précharger/side-effects globaux ici.

  return (
    <Container
      maxWidth="sm"
      sx={{
        height:
          "calc(100vh - var(--header-height) - var(--footer-height))",
        display: "flex",
        flexDirection: "column",
        py: 2,
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3} flex={1} sx={{ minHeight: 0 }}>
        {/* --- Avatar + actions --- */}
        <PhotoAvatarSection />

        {/* --- Mon Compte --- */}
        <AccountSection />

        {/* --- Mes Attributs --- */}
        <AttributesSection />
      </Stack>
    </Container>
  );
};

export default ProfilePage;
