export type OrgRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

export const formatRole = (r?: OrgRole | null) =>
  !r ? "" : `[${r}]`;

export interface UserOrganization {
    tenantId: number;
    organizationKey: string;
    organizationName: string;
    role: OrgRole;
    createdAt: Date;
}