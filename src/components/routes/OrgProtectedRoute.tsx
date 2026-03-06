// src/components/routes/OrgProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  element: React.ReactElement;
  redirectToOnboarding?: string;
};

export default function OrgProtectedRoute({
  element,
  redirectToOnboarding = "/onboarding",
}: Props) {
  const { isAuthenticated, isBooting, activeTenant, tenants } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location }}
      />
    );
  }

  // Aucun tenant réel -> onboarding
  if (!tenants || tenants.length === 0) {
    return <Navigate to={redirectToOnboarding} replace />;
  }

  // On a bien des tenants, mais le tenant actif n'est pas encore fixé
  if (!activeTenant) {
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

  return element;
}