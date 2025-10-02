import { OrgRole } from "../../../models/organizations/UserOrganization";

export interface UserOrganizationDto {
  organizationId: number;
  organizationKey: string;
  organizationName: string;
  role: OrgRole;
  createdAt: string; // ISO string, à parser si besoin en Date
}