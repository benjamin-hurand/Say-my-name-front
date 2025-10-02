import React, { createContext, useState, useEffect, useContext } from "react";
import {
  AuthResponse,
  loginWithGoogle,
  silentGoogleSignIn,
  verifyToken as verifyTokenApi,
} from "../services/security/Auth.service";
import { User } from "../models/commons/User";
import { CredentialResponse } from "@react-oauth/google";
import { UserOrganizationDto } from "../services/dto/organization/UserOrganizationDto";

interface AuthContextProps {
  user: User | null;
  token: string | null;
  organizations: UserOrganizationDto[];
  activeOrganization: UserOrganizationDto | null;
  isAuthenticated: boolean;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  switchOrganization: (orgId: number) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined" || stored === "null") return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const [organizations, setOrganizations] = useState<UserOrganizationDto[]>(() => {
    const stored = localStorage.getItem("organizations");
    if (!stored || stored === "undefined" || stored === "null") return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  const [activeOrganization, setActiveOrganization] = useState<UserOrganizationDto | null>(() => {
    const storedOrgId = localStorage.getItem("orgId");
    const storedOrgs = localStorage.getItem("organizations");

    if (!storedOrgId || !storedOrgs) return null;

    try {
      const orgs: UserOrganizationDto[] = JSON.parse(storedOrgs);
      const parsedId = parseInt(storedOrgId, 10);
      return orgs.find((o) => o.organizationId === parsedId) || null;
    } catch {
      return null;
    }
  });

  const login = (authResponse: AuthResponse) => {
    const { bearerToken, userId, username, email, roles, srsAlgorithm, organizations } =
      authResponse;

    const newUser: User = {
      id: userId,
      username,
      email,
      roles,
      srsAlgorithm,
      organizations,
    };

    localStorage.setItem("token", bearerToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    if (organizations && organizations.length > 0) {
      localStorage.setItem("organizations", JSON.stringify(organizations));

      // ✅ soit on reprend l’orgId déjà stocké si valide
      const storedOrgId = localStorage.getItem("orgId");
      let defaultOrg: UserOrganizationDto | null = null;

      if (storedOrgId) {
        const parsed = parseInt(storedOrgId, 10);
        defaultOrg = organizations.find((o) => o.organizationId === parsed) || null;
      }

      // ✅ sinon on prend la première
      if (!defaultOrg) {
        defaultOrg = organizations[0];
        localStorage.setItem("orgId", String(defaultOrg.organizationId));
      }

      setActiveOrganization(defaultOrg);
    } else {
      localStorage.removeItem("organizations");
      localStorage.removeItem("orgId");
      setActiveOrganization(null);
    }

    setToken(bearerToken);
    setUser(newUser);
    setOrganizations(organizations || []);
  };

  const switchOrganization = (orgId: number) => {
    const org = organizations.find((o) => o.organizationId === orgId) || null;
    setActiveOrganization(org);
    if (org) {
      localStorage.setItem("orgId", String(org.organizationId));
    } else {
      localStorage.removeItem("orgId");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizations");
    localStorage.removeItem("orgId");
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setActiveOrganization(null);
  };

  const isAuthenticated = !!token;

  const verifyTokenn = async (currentToken: string) => {
    try {
      await verifyTokenApi(currentToken);
      return true;
    } catch {
      return false;
    }
  };

  const autoReconnectWithGoogle = async () => {
    try {
      const googleResponse: CredentialResponse = await silentGoogleSignIn();
      if (googleResponse?.credential) {
        const apiResponse = await loginWithGoogle(googleResponse);
        login(apiResponse);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-reconnexion avec Google échouée:", error);
      return false;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        const valid = await verifyTokenn(token);
        if (!valid) {
          const reconnected = await autoReconnectWithGoogle();
          if (!reconnected) logout();
        }
      }
    };

    checkSession();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organizations,
        activeOrganization,
        isAuthenticated,
        login,
        logout,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
