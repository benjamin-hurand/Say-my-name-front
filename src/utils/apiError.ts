// src/utils/apiError.ts

/**
 * Extrait un message lisible depuis une réponse d'erreur d'API.
 * Compatible ProblemDetail (Spring 6 / RFC 7807) et anciens formats.
 */
export function getApiErrorMessage(err: any, fallback = "Une erreur est survenue.") {
  const data = err?.response?.data;

  if (data && typeof data === "object") {
    // Format ProblemDetail: { title, detail, status, ... }
    const detail = data.detail ?? data.message ?? data.error;
    const title = data.title;
    const fieldErrors = Array.isArray(data.fieldErrors) ? data.fieldErrors : null;

    if (fieldErrors && fieldErrors.length > 0) {
      const fe = fieldErrors.join(" • ");
      if (detail) return `${detail} — ${fe}`;
      if (title) return `${title} — ${fe}`;
      return fe;
    }
    if (detail) return detail;
    if (title) return title;
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed?.detail) return parsed.detail;
    } catch {
      // laisse tomber, on utilisera fallback
    }
  }

  return err?.message || fallback;
}

/** Récupère le status HTTP si dispo (utile pour des comportements conditionnels). */
export function getApiStatus(err: any): number | undefined {
  return err?.response?.status;
}
