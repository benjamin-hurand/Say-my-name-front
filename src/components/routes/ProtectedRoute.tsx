// src/components/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  element: React.JSX.Element;
};

/**
 * Guard d'auth:
 * - Pendant le boot (refresh cookie + /session): on affiche un loader (PAS de redirect).
 * - Après boot:
 *   - si authentifié -> render
 *   - sinon -> redirect /signin
 */
const ProtectedRoute: React.FC<Props> = ({ element }) => {
  const { isAuthenticated, isBooting } = useAuth();
  const location = useLocation();

  console.log("🛡️ [ProtectedRoute]", {
    isBooting,
    isAuthenticated,
    path: location.pathname
  });

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

  return element;
};

export default ProtectedRoute;
