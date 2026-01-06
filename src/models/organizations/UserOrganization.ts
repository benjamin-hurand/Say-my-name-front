import { Organization } from "./Organization";

export type OrgRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

export const formatRole = (r?: OrgRole | null) =>
  !r ? "" : `[${r}]`;

export interface UserOrganization {
    organization: Organization;
    role: OrgRole;
}