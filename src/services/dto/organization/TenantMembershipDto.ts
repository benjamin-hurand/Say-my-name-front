import { OrgRole } from "../../../models/tenants/TenantMembership";
import { TenantDto } from "./TenantDto";

export interface TenantMembershipDto {
  role: OrgRole;
  createdAt: string;
  tenant: TenantDto;
}