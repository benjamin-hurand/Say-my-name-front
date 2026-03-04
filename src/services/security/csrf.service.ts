// src/services/security/csrf.ts
import type { AxiosInstance } from "axios";

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((c) => c.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.substring(name.length + 1));
};

export const hasXsrfCookie = (): boolean => !!readCookie("XSRF-TOKEN");

/**
 * Bootstraps the XSRF cookie by calling GET /api/auth/csrf.
 * - Must be called with Axios instance configured with withCredentials=true
 * - No extra headers: avoid unnecessary CORS preflight
 */
export const ensureXsrfCookie = async (API: AxiosInstance): Promise<void> => {
  if (hasXsrfCookie()) return;

  try {
    await API.get("/auth/csrf");
  } catch (e) {
    // En dev, c'est utile de voir pourquoi ça n'a pas marché.
    // En prod, tu peux décider de ne pas logguer pour éviter du bruit.
    console.warn("[csrf] Failed to bootstrap XSRF cookie via GET /auth/csrf", e);
  }
};
