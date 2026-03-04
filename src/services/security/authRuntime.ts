// src/services/security/authRuntime.ts

export type SessionDto = {
  publicUserId: string | null;
  displayName: string | null;
  isAdmin: boolean;
  tenants: any[];
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
    url.includes("/auth/logout") ||
    url.includes("/auth/csrf") ||
    url.includes("/auth/session")
  );
};

type EnsureOptions = {
  /**
   * Mode silencieux:
   * - ne déclenche PAS de logout()
   * - retourne simplement null si refresh impossible
   *
   * À utiliser pour le BOOT (absence de cookie refresh = utilisateur non connecté).
   */
  silent?: boolean;
};

/**
 * Assure qu'on a un access token frais.
 * - 1 seul refresh concurrent (anti storm)
 * - en cas d'échec:
 *   - silent=true  => clear token + return null (PAS de logout)
 *   - silent=false => clear token + onLogout()
 */
export const ensureFreshAccessToken = async (
  reason?: string,
  opts?: EnsureOptions
): Promise<string | null> => {
  if (!_refreshAccessToken) {
    throw new Error("authRuntime not initialized: missing refreshAccessToken()");
  }

  if (_refreshPromise) return _refreshPromise;

  const silent = !!opts?.silent;

  _refreshPromise = (async () => {
    try {
      const res = await _refreshAccessToken();
      const newToken = res?.accessToken ?? null;

      setAccessToken(newToken);

      // Token vide = état incohérent => traité comme échec
      if (!newToken) {
        if (!silent && _onLogout) {
          await _onLogout({ reason: reason ?? "refresh-returned-empty-token" });
        }
        return null;
      }

      return newToken;
    } catch (e) {
      // Échec 401/403 du refresh token (cookie absent / expiré / révoqué / DB reset)
      setAccessToken(null);

      if (!silent && _onLogout) {
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
