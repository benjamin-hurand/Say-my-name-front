import { OrgRole } from "../../../models/tenants/UserTenant";

export interface UserTenantDto {
  tenantId: number;
  tenantKey: string;
  tenantName: string;
  role: OrgRole;
  createdAt: string; // ISO string, à parser si besoin en Date
}