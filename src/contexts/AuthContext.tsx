// src/contexts/AuthContext.tsx
import { CredentialResponse } from "@react-oauth/google";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UserOrganizationDto } from "../services/dto/organization/UserOrganizationDto";

import {
  AuthResponseDto,
  SessionDto,
  getSession as getSessionApi,
  loginWithGoogle,
  logoutServer as logoutServerApi,
  refreshAccessToken as refreshAccessTokenApi,
  silentGoogleSignIn,
} from "../services/security/Auth.service";

import { ensureFreshAccessToken, initAuthRuntime, setAccessToken } from "../services/security/authRuntime";

type LogoutOptions = {
  provider?: "google";
  reason?: string;
};

interface AuthContextProps {
  accessToken: string | null;

  sessionPublicId: string | null;
  sessionDisplayName: string | null;
  isAdmin: boolean;

  /** ✅ Emails (vérifiés) retournés dans SessionDto */
  sessionEmails: string[];

  organizations: UserOrganizationDto[];
  activeOrganization: UserOrganizationDto | null;

  isAuthenticated: boolean;
  isBooting: boolean;

  /** login/register/google/refresh : AuthResponseDto */
  login: (auth: AuthResponseDto) => void;

  logout: (opts?: LogoutOptions) => Promise<void>;

  switchOrganization: (orgId: number) => void;

  /** re-fetch session via /auth/session */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const DBG = (...args: any[]) =>
  console.log("%cAUTHDBG", "color:#7c4dff;font-weight:700", ...args);

const short = (s: string | null | undefined, n = 14) =>
  !s ? null : s.length <= n ? s : `${s.slice(0, n)}…(${s.length})`;

// Stockage non-sensible (préférence UX)
const ORG_ID_KEY = "orgId";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logoutInProgressRef = useRef(false);
  const bootRanRef = useRef(false);

  const [isBooting, setIsBooting] = useState(true);

  // ====== Mémoire-only ======
  const [accessToken, _setAccessTokenState] = useState<string | null>(null);

  const [sessionPublicId, setSessionPublicId] = useState<string | null>(null);
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [sessionEmails, setSessionEmails] = useState<string[]>([]);

  const [organizations, setOrganizations] = useState<UserOrganizationDto[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<UserOrganizationDto | null>(null);

  // Runtime -> State (token)
  const setToken = useCallback((token: string | null) => {
    _setAccessTokenState(token);
  }, []);

  const applySessionDto = useCallback((session: SessionDto) => {
    const safeOrgs = session.organizations ?? [];
    const safeEmails = Array.isArray((session as any).emails) ? (session as any).emails : (session as any).sessionEmails;

    setSessionPublicId(session.publicUserId ?? null);
    setSessionDisplayName(session.displayName ?? null);
    setIsAdmin(!!session.isAdmin);
    setOrganizations(safeOrgs);

    // ✅ emails en mémoire (défaut [])
    setSessionEmails(Array.isArray(safeEmails) ? safeEmails.filter(Boolean) : []);

    // Orga active (préférence non sensible)
    const storedOrgId = localStorage.getItem(ORG_ID_KEY);
    let selected: UserOrganizationDto | null = null;

    if (storedOrgId) {
      const parsed = parseInt(storedOrgId, 10);
      selected = safeOrgs.find((o) => o.organizationId === parsed) || null;
    }

    if (!selected && safeOrgs.length > 0) {
      selected = safeOrgs[0];
      localStorage.setItem(ORG_ID_KEY, String(selected.organizationId));
    }

    setActiveOrganization(selected);
  }, []);

  const applyAuthResponse = useCallback(
    (auth: AuthResponseDto) => {
      DBG("[AuthProvider] applyAuthResponse()", {
        accessToken: short(auth?.accessToken),
        orgsLen: auth?.session?.organizations?.length ?? 0,
      });

      // token en mémoire (via runtime)
      setAccessToken(auth.accessToken);

      // session
      applySessionDto(auth.session);
    },
    [applySessionDto]
  );

  const clearSessionState = useCallback(() => {
    setAccessToken(null);
    setSessionPublicId(null);
    setSessionDisplayName(null);
    setIsAdmin(false);
    setSessionEmails([]);
    setOrganizations([]);
    setActiveOrganization(null);
  }, []);

  const login = useCallback(
    (auth: AuthResponseDto) => {
      logoutInProgressRef.current = false;
      applyAuthResponse(auth);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(
    async (opts?: LogoutOptions) => {
      const reason = opts?.reason ?? "user-initiated";

      DBG("[AuthProvider] logout() start", {
        reason,
        provider: opts?.provider ?? null,
        stateAccessToken: short(accessToken),
      });

      logoutInProgressRef.current = true;

      // Best effort server logout (révoque refresh + clear cookies)
      try {
        await logoutServerApi();
      } catch (e) {
        console.warn("[AuthProvider] logoutServer failed (non-blocking)", e);
      }

      clearSessionState();

      // Google logout (optionnel)
      if (opts?.provider === "google") {
        try {
          const mod = await import("@react-oauth/google");
          mod.googleLogout();
          DBG("[AuthProvider] googleLogout() done");
        } catch (e) {
          console.warn("[AuthProvider] googleLogout failed", e);
        }
      }

      DBG("[AuthProvider] logout() done");
    },
    [accessToken, clearSessionState]
  );

  const isAuthenticated = !!accessToken;

  const switchOrganization = useCallback(
    (orgId: number) => {
      const org = organizations.find((o) => o.organizationId === orgId) || null;
      setActiveOrganization(org);
      if (org) localStorage.setItem(ORG_ID_KEY, String(org.organizationId));
      else localStorage.removeItem(ORG_ID_KEY);
    },
    [organizations]
  );

  const refreshSession = useCallback(async () => {
    if (!isAuthenticated || logoutInProgressRef.current) return;
    try {
      const session = await getSessionApi();
      applySessionDto(session);
    } catch (error) {
      console.error("Impossible de rafraîchir la session :", error);
    }
  }, [isAuthenticated, applySessionDto]);

  const autoReconnectWithGoogle = useCallback(async () => {
    try {
      const googleResponse: CredentialResponse = await silentGoogleSignIn();
      if (googleResponse?.credential) {
        const auth = await loginWithGoogle(googleResponse);
        login(auth);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-reconnexion avec Google échouée:", error);
      return false;
    }
  }, [login]);

  // Init authRuntime (refresh + setToken + logout)
  useEffect(() => {
    initAuthRuntime({
      refreshAccessToken: async () => {
        const res = await refreshAccessTokenApi(); // Promise<AuthResponseDto>
        return res;
      },
      setToken,
      onLogout: async ({ reason } = {}) => {
        if (logoutInProgressRef.current) return;
        await logout({ reason: reason ?? "runtime-logout" });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boot flow optimal
  // - tente ensureFreshAccessToken() (cookie refresh) -> met token
  // - hydrate ensuite session via /auth/session (SessionDto)
  useEffect(() => {
    const boot = async () => {
      if (bootRanRef.current) return;
      bootRanRef.current = true;

      setIsBooting(true);

      // 1) refresh via cookie (source de vérité)
      const token = await ensureFreshAccessToken("boot");
      if (token) {
        try {
          const session = await getSessionApi();
          applySessionDto(session);
          setIsBooting(false);
          return;
        } catch (e) {
          console.warn("[AuthProvider] boot: session fetch failed after refresh", e);
          clearSessionState();
          setIsBooting(false);
          return;
        }
      }

      // 2) optionnel: silent google
      const reconnected = await autoReconnectWithGoogle();
      if (!reconnected) {
        clearSessionState();
      }

      setIsBooting(false);
    };

    boot();
  }, [autoReconnectWithGoogle, applySessionDto, clearSessionState]);

  // Fallback active org
  useEffect(() => {
    if (organizations.length > 0 && !activeOrganization) {
      const fallback = organizations[0];
      setActiveOrganization(fallback);
      localStorage.setItem(ORG_ID_KEY, String(fallback.organizationId));
    }
  }, [organizations, activeOrganization]);

  const value = useMemo<AuthContextProps>(
    () => ({
      accessToken,
      sessionPublicId,
      sessionDisplayName,
      isAdmin,
      sessionEmails,
      organizations,
      activeOrganization,
      isAuthenticated,
      isBooting,
      login,
      logout,
      switchOrganization,
      refreshSession,
    }),
    [
      accessToken,
      sessionPublicId,
      sessionDisplayName,
      isAdmin,
      sessionEmails,
      organizations,
      activeOrganization,
      isAuthenticated,
      isBooting,
      login,
      logout,
      switchOrganization,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
