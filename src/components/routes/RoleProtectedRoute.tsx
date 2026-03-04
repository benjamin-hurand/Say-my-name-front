import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface RoleProtectedRouteProps {
  element: React.JSX.Element;
  allowedRoles: string[];
  redirectPath?: string; // chemin vers lequel rediriger si l’accès est refusé
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  element,
  allowedRoles,
  redirectPath = "/", // fallback par défaut
}) => {
  const { isAuthenticated, activeTenant } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  const orgRole = activeTenant?.role;

  if (!orgRole || !allowedRoles.includes(orgRole)) {
    return <Navigate to={redirectPath} replace />;
  }

  return element;
};

export default RoleProtectedRoute;
