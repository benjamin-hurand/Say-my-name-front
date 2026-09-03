export const PERSON_DISPLAY_NAME_FALLBACK = "Nom indisponible";

export function getPersonDisplayName(
  person: { displayName?: unknown } | null | undefined,
  fallback = PERSON_DISPLAY_NAME_FALLBACK,
): string {
  const value = person?.displayName == null ? "" : String(person.displayName).trim();
  return value || fallback;
}

export function getPersonInitials(
  person: { displayName?: unknown } | null | undefined,
): string {
  const name = getPersonDisplayName(person, "");
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase() ?? "")
    .join("") || "?";
}
