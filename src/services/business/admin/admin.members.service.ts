// src/services/business/admin/admin.members.service.ts
import { OrgMemberRow } from "../../../models/tenants/AdminMembers";
import { OrgRole } from "../../../models/tenants/TenantMembership";
import API from "../../api/apiUtils";

const ADMIN_ENDPOINT = "/admin";

export interface ListAdminMembersParams {
  /** Recherche full-text côté back : param "search" */
  q?: string;
}

export async function listAdminMembers(
  params: ListAdminMembersParams = {}
): Promise<OrgMemberRow[]> {
  const search = new URLSearchParams();

  if (params.q) {
    search.set("search", params.q);
  }

  const queryString = search.toString();
  const url = `${ADMIN_ENDPOINT}/members${queryString ? `?${queryString}` : ""}`;

  const { data } = await API.get<OrgMemberRow[]>(url);
  return data;
}

// ---------------- New endpoints ----------------

export type ChangeRoleRequestDto = {
  role: OrgRole;
};

export async function changeMemberRole(
  targetUserId: number,
  role: OrgRole
): Promise<OrgMemberRow> {
  const url = `${ADMIN_ENDPOINT}/members/${targetUserId}/role`;
  const payload: ChangeRoleRequestDto = { role };

  const { data } = await API.patch<OrgMemberRow>(url, payload);
  return data;
}

export async function removeMember(targetUserId: number): Promise<void> {
  const url = `${ADMIN_ENDPOINT}/members/${targetUserId}`;
  await API.delete(url);
}

export type TransferOwnershipRequestDto = {
  newOwnerUserId: number;
};

export type TransferOwnershipResponseDto = {
  oldOwner: OrgMemberRow;
  newOwner: OrgMemberRow;
};

export async function transferOwnership(
  newOwnerUserId: number
): Promise<TransferOwnershipResponseDto> {
  const url = `${ADMIN_ENDPOINT}/members/transfer-ownership`;
  const payload: TransferOwnershipRequestDto = { newOwnerUserId };

  const { data } = await API.post<TransferOwnershipResponseDto>(url, payload);
  return data;
}
