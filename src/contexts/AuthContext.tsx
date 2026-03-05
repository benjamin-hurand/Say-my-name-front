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

import {
  ensureFreshAccessToken,
  initAuthRuntime,
  setAccessToken,
} from "../services/security/authRuntime";

type LogoutOptions = {
  provider?: "google";
  reason?: string;
};

interface AuthContextProps {
  accessToken: string | null;

  sessionPublicId: string | null;
  sessionDisplayName: string | null;
  isAdmin: boolean;

  /** Emails (vérifiés) retournés dans SessionDto */
  sessionEmails: string[];

  tenants: UserOrganizationDto[];
  activeTenant: UserOrganizationDto | null;

  isAuthenticated: boolean;
  isBooting: boolean;

  login: (auth: AuthResponseDto) => void;

  /**
   * Logout = purge état local + best-effort serveur.
   * IMPORTANT: ne fait AUCUNE navigation. La redirection est gérée par le routing (ProtectedRoute).
   */
  logout: (opts?: LogoutOptions) => Promise<void>;

  switchTenant: (orgId: number) => void;

  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const DBG = (...args: any[]) =>
  console.log("%cAUTHDBG", "color:#7c4dff;font-weight:700", ...args);

const short = (s: string | null | undefined, n = 14) =>
  !s ? null : s.length <= n ? s : `${s.slice(0, n)}…(${s.length})`;

const ORG_ID_KEY = "orgId";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logoutInProgressRef = useRef(false);
  const bootRanRef = useRef(false);
  const mountCount = useRef(0);

  const [isBooting, setIsBooting] = useState(true);

  // ====== Mémoire-only ======
  const [accessToken, _setAccessTokenState] = useState<string | null>(null);

  const [sessionPublicId, setSessionPublicId] = useState<string | null>(null);
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [sessionEmails, setSessionEmails] = useState<string[]>([]);

  const [tenants, setTenants] = useState<UserOrganizationDto[]>([]);
  const [activeTenant, setActiveTenant] = useState<UserOrganizationDto | null>(null);

  const setToken = useCallback((token: string | null) => {
    _setAccessTokenState(token);
  }, []);

  const clearSessionState = useCallback(() => {
    setAccessToken(null);
    setSessionPublicId(null);
    setSessionDisplayName(null);
    setIsAdmin(false);
    setSessionEmails([]);
    setTenants([]);
    setActiveTenant(null);
  }, []);

  const applySessionDto = useCallback((session: SessionDto) => {
    const safeOrgs = session.organizations ?? [];
    const safeEmails = Array.isArray((session as any).emails)
      ? (session as any).emails
      : (session as any).sessionEmails;

    setSessionPublicId(session.publicUserId ?? null);
    setSessionDisplayName(session.displayName ?? null);
    setIsAdmin(!!(session as any).isAdmin);
    setTenants(safeOrgs);

    setSessionEmails(Array.isArray(safeEmails) ? safeEmails.filter(Boolean) : []);

    const storedOrgId = localStorage.getItem(ORG_ID_KEY);
    let selected: UserOrganizationDto | null = null;

    if (storedOrgId) {
      const parsed = parseInt(storedOrgId, 10);
      selected = safeOrgs.find((o) => o.tenantId === parsed) || null;
    }

    if (!selected && safeOrgs.length > 0) {
      selected = safeOrgs[0];
      localStorage.setItem(ORG_ID_KEY, String(selected.tenantId));
    }

    setActiveTenant(selected);
  }, []);

  const applyAuthResponse = useCallback(
    (auth: AuthResponseDto) => {
      DBG("[AuthProvider] applyAuthResponse()", {
        accessToken: short(auth?.accessToken),
        orgsLen: auth?.session?.tenants?.length ?? 0,
      });

      setAccessToken(auth?.accessToken ?? null);

      if (auth?.session) applySessionDto(auth.session);
      else clearSessionState();
    },
    [applySessionDto, clearSessionState]
  );

  const login = useCallback(
    (auth: AuthResponseDto) => {
      logoutInProgressRef.current = false;
      applyAuthResponse(auth);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(
    async (opts?: LogoutOptions) => {
      if (logoutInProgressRef.current) {
        DBG("[AuthProvider] logout() already in progress, skipping");
        return;
      }

      const reason = opts?.reason ?? "user-initiated";

      DBG("[AuthProvider] logout() start", {
        reason,
        provider: opts?.provider ?? null,
        stateAccessToken: short(accessToken),
      });

      logoutInProgressRef.current = true;

      try {
        await logoutServerApi();
      } finally {
        clearSessionState();

        if (opts?.provider === "google") {
          try {
            const mod = await import("@react-oauth/google");
            mod.googleLogout();
            DBG("[AuthProvider] googleLogout() done");
          } catch (e) {
            console.warn("[AuthProvider] googleLogout failed", e);
          }
        }

        logoutInProgressRef.current = false;
        DBG("[AuthProvider] logout() done");
      }
    },
    [accessToken, clearSessionState]
  );

  const isAuthenticated = !!accessToken;

  const switchTenant = useCallback(
    (orgId: number) => {
      const org = tenants.find((o) => o.tenantId === orgId) || null;
      setActiveTenant(org);
      if (org) localStorage.setItem(ORG_ID_KEY, String(org.tenantId));
      else localStorage.removeItem(ORG_ID_KEY);
    },
    [tenants]
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

  useEffect(() => {
    mountCount.current += 1;
    console.log("🎯 [AuthProvider] MOUNTED", { count: mountCount.current });

    if (mountCount.current > 1) {
      console.error("⚠️⚠️ [AuthProvider] MOUNTED MULTIPLE TIMES - DOUBLE PROVIDER DETECTED!");
    }

    return () => {
      console.log("🎯 [AuthProvider] UNMOUNTED");
    };
  }, []);

  useEffect(() => {
    initAuthRuntime({
      refreshAccessToken: async () => {
        const res = await refreshAccessTokenApi();
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

  useEffect(() => {
    const boot = async () => {
      console.log("🚀 [BOOT] START", { bootRanRef: bootRanRef.current });

      if (bootRanRef.current) {
        console.warn("⚠️ [BOOT] Already ran, skipping");
        return;
      }
      bootRanRef.current = true;

      setIsBooting(true);

      // Safety timeout: force setIsBooting(false) after 30s
      const bootTimeout = setTimeout(() => {
        console.error("⏰ [BOOT] TIMEOUT after 30s - forcing setIsBooting(false)");
        setIsBooting(false);
      }, 30000);

      try {
        // ✅ IMPORTANT: boot = mode silencieux (pas de logout serveur si pas de cookie refresh)
        console.log("🔄 [BOOT] Calling ensureFreshAccessToken...");
        const token = await ensureFreshAccessToken("boot", { silent: true });
        console.log("✅ [BOOT] ensureFreshAccessToken done", { hasToken: !!token });

        if (token) {
          console.log("📡 [BOOT] Fetching session...");
          const session = await getSessionApi();
          console.log("✅ [BOOT] Session fetched", { publicUserId: session.publicUserId });
          applySessionDto(session);
          clearTimeout(bootTimeout);
          return;
        }

        console.log("🔍 [BOOT] No token, trying Google silent sign-in...");
        const reconnected = await autoReconnectWithGoogle();
        console.log("🔍 [BOOT] Google silent sign-in result:", { reconnected });

        if (!reconnected) {
          clearSessionState();
        }
      } catch (e) {
        console.warn("❌ [BOOT] Failed", e);
        clearSessionState();
      } finally {
        clearTimeout(bootTimeout);
        console.log("✅ [BOOT] DONE - setIsBooting(false)");
        setIsBooting(false);
      }
    };

    boot();
  }, [autoReconnectWithGoogle, applySessionDto, clearSessionState]);

  useEffect(() => {
    if (tenants.length > 0 && !activeTenant) {
      const fallback = tenants[0];
      setActiveTenant(fallback);
      localStorage.setItem(ORG_ID_KEY, String(fallback.tenantId));
    }
  }, [tenants, activeTenant]);

  const value = useMemo<AuthContextProps>(
    () => ({
      accessToken,
      sessionPublicId,
      sessionDisplayName,
      isAdmin,
      sessionEmails,
      tenants,
      activeTenant,
      isAuthenticated,
      isBooting,
      login,
      logout,
      switchTenant,
      refreshSession,
    }),
    [
      accessToken,
      sessionPublicId,
      sessionDisplayName,
      isAdmin,
      sessionEmails,
      tenants,
      activeTenant,
      isAuthenticated,
      isBooting,
      login,
      logout,
      switchTenant,
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
