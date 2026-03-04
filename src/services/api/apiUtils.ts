// src/services/api/apiUtils.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, ensureFreshAccessToken, shouldSkipAuthRetry } from "../security/authRuntime";

// --------------------
// Helpers cookies (XSRF)
// --------------------
const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((c) => c.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.substring(name.length + 1));
};

// --------------------
// Axios instance
// --------------------
const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // IMPORTANT: refresh cookie HttpOnly + cookie XSRF
  timeout: 30000, // 30s timeout global (backend down/lent)
});

// Pour éviter boucles infinies de refresh
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// --------------------
// Request interceptor
// --------------------
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("📤 [API] Request", {
      method: config.method?.toUpperCase(),
      url: config.url,
      retry: config._retry
    });

    // Access token (mémoire-only)
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete (config.headers as any).Authorization;
    }

    // Org context (préférence UX non sensible)
    const orgId = localStorage.getItem("tenantId");
    if (orgId) config.headers["X-Tenant-Id"] = orgId;

    // CSRF Double Submit:
    // cookie XSRF-TOKEN (non HttpOnly) => header X-XSRF-TOKEN
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) {
      config.headers["X-XSRF-TOKEN"] = xsrf;
    }

    // Content-Type
    if (config.data instanceof FormData) {
      delete (config.headers as any)["Content-Type"];
    } else {
      (config.headers as any)["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------
// Response interceptor (401 -> refresh -> retry)
// --------------------
API.interceptors.response.use(
  async (res) => {
    console.log("📥 [API] Response", {
      status: res.status,
      url: res.config.url
    });

    // CRITICAL: Intercepte les 401 MÊME si validateStatus les accepte
    // (ex: validateStatus: (s) => s < 500 accepte 401 sans créer d'error)
    if (res.status === 401) {
      const original = res.config as InternalAxiosRequestConfig;
      const url = original.url ?? "";

      // Ne jamais refresh/retry sur endpoints auth (dont /auth/refresh), sinon boucle.
      if (shouldSkipAuthRetry(url)) {
        return res; // Retourne le 401 tel quel
      }

      // Un seul retry par requête
      if (original._retry) {
        return res; // Retourne le 401 tel quel
      }
      original._retry = true;

      // Tentative refresh centralisée (anti-storm géré dans authRuntime)
      const newToken = await ensureFreshAccessToken("api-401");

      if (!newToken) {
        // Refresh impossible -> on retourne le 401 original
        return res;
      }

      // Rejouer la requête initiale avec le nouveau token
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;

      return API.request(original);
    }

    return res;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (!original || status !== 401) {
      return Promise.reject(error);
    }

    const url = original.url ?? "";

    // Ne jamais refresh/retry sur endpoints auth (dont /auth/refresh), sinon boucle.
    if (shouldSkipAuthRetry(url)) {
      return Promise.reject(error);
    }

    // Un seul retry par requête
    if (original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    // Tentative refresh centralisée (anti-storm géré dans authRuntime)
    const newToken = await ensureFreshAccessToken("api-401");

    if (!newToken) {
      // Refresh impossible -> on remonte le 401
      return Promise.reject(error);
    }

    // Rejouer la requête initiale avec le nouveau token
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;

    return API.request(original);
  }
);

export default API;
