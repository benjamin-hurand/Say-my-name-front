// src/services/security/authRuntime.ts

export type SessionDto = {
  publicUserId: string | null;
  displayName: string | null;
  isAdmin: boolean;
  organizations: any[];
};

export type AuthResponseDto = {
  accessToken: string;
  session: SessionDto;
};

export type SetTokenFn = (token: string | null) => void;
export type OnLogoutFn = (opts?: { reason?: string }) => Promise<void> | void;

type Deps = {
  /**
   * Fonction de refresh (POST /auth/refresh) qui renvoie AuthResponseDto :
   * { accessToken, session }.
   * Doit envoyer le refresh token via cookie HttpOnly (axios withCredentials=true).
   */
  refreshAccessToken: () => Promise<AuthResponseDto>;

  /** Setter du token en mémoire */
  setToken: SetTokenFn;

  /** Callback de logout (best effort) */
  onLogout: OnLogoutFn;
};

let _accessToken: string | null = null;
let _setToken: SetTokenFn | null = null;
let _onLogout: OnLogoutFn | null = null;
let _refreshAccessToken: (() => Promise<AuthResponseDto>) | null = null;

// Anti “refresh storm”
let _refreshPromise: Promise<string | null> | null = null;

export const initAuthRuntime = (deps: Deps) => {
  _refreshAccessToken = deps.refreshAccessToken;
  _setToken = deps.setToken;
  _onLogout = deps.onLogout;
};

export const getAccessToken = (): string | null => _accessToken;

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
  if (_setToken) _setToken(token);
};

export const shouldSkipAuthRetry = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/google") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
};

/**
 * Assure qu'on a un access token frais.
 * - 1 seul refresh concurrent (anti storm)
 * - en cas d'échec: clear token + onLogout(best effort)
 */
export const ensureFreshAccessToken = async (reason?: string): Promise<string | null> => {
  if (!_refreshAccessToken) {
    throw new Error("authRuntime not initialized: missing refreshAccessToken()");
  }

  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await _refreshAccessToken();
      const newToken = res?.accessToken ?? null;

      setAccessToken(newToken);

      if (!newToken && _onLogout) {
        await _onLogout({ reason: reason ?? "refresh-returned-empty-token" });
      }

      return newToken;
    } catch (e) {
      setAccessToken(null);

      if (_onLogout) {
        try {
          await _onLogout({ reason: reason ?? "refresh-failed" });
        } catch {
          // non bloquant
        }
      }

      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
};
