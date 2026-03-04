// src/components/routes/OrgProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  element: React.ReactElement;
  redirectToOnboarding?: string; // défaut: "/onboarding"
};

export default function OrgProtectedRoute({
  element,
  redirectToOnboarding = "/onboarding",
}: Props) {
  const { isAuthenticated, isBooting, activeTenant } = useAuth();
  const location = useLocation();

  // ⏳ Pendant le boot (refresh cookie + /session)
  if (isBooting) {
    return (
      <Box
        sx={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ❌ Pas authentifié → signin
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location }}
      />
    );
  }

  // ⚠️ Auth OK mais aucune organisation → onboarding
  if (!activeTenant) {
    return <Navigate to={redirectToOnboarding} replace />;
  }

  // ✅ Auth + org OK
  return element;
}
