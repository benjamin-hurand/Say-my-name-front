import { Tenant } from "./Tenant";

export type OrgRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

export const formatRole = (r?: OrgRole | null) =>
  !r ? "" : `[${r}]`;

export interface UserTenant {
    tenant: Tenant;
    role: OrgRole;
}