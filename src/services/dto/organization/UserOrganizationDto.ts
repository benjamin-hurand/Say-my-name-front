import { OrgRole } from "../../../models/organizations/UserOrganization";

export interface UserOrganizationDto {
  tenantId: number;
  organizationKey: string;
  organizationName: string;
  role: OrgRole;
  createdAt: string; // ISO string, à parser si besoin en Date
}