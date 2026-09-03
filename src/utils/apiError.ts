// src/utils/apiError.ts

/**
 * Extrait un message lisible depuis une réponse d'erreur d'API.
 * Compatible ProblemDetail (Spring 6 / RFC 7807) et anciens formats.
 */
type ApiErrorLike = {
  message?: unknown;
  response?: {
    data?: unknown;
    status?: number;
  };
};

function asApiError(err: unknown): ApiErrorLike | undefined {
  return typeof err === "object" && err !== null
    ? (err as ApiErrorLike)
    : undefined;
}

function asMessage(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue.",
): string {
  const error = asApiError(err);
  const data = error?.response?.data;

  if (data && typeof data === "object") {
    // Format ProblemDetail: { title, detail, status, ... }
    const problem = data as Record<string, unknown>;
    const detail =
      asMessage(problem.detail) ??
      asMessage(problem.message) ??
      asMessage(problem.error);
    const title = asMessage(problem.title);
    const fieldErrors = Array.isArray(problem.fieldErrors)
      ? problem.fieldErrors.map(String)
      : null;

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
      const parsed: unknown = JSON.parse(data);
      if (parsed && typeof parsed === "object") {
        const detail = asMessage((parsed as Record<string, unknown>).detail);
        if (detail) return detail;
      }
    } catch {
      // laisse tomber, on utilisera fallback
    }
  }

  const errorMessage = asMessage(error?.message);
  if (
    errorMessage &&
    !/^Request failed with status code \d+$/.test(errorMessage)
  ) {
    return errorMessage;
  }

  return fallback;
}

/** Récupère le status HTTP si dispo (utile pour des comportements conditionnels). */
export function getApiStatus(err: unknown): number | undefined {
  return asApiError(err)?.response?.status;
}
