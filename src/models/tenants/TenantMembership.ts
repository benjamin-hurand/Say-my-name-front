export type OrgRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

export const formatRole = (r?: OrgRole | null) =>
  !r ? "" : `[${r}]`;