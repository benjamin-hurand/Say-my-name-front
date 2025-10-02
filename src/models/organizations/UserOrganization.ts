import { Organization } from "./Organization";

export type OrgRole = "VIEWER" | "EDITOR" | "CLIENT_ADMIN";

export interface UserOrganization {
    organization: Organization;
    role: OrgRole;
}