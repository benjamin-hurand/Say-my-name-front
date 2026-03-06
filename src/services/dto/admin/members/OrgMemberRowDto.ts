// src/services/dto/admin/members/OrgMemberRowDto.ts

import { OrgRole } from "../../../../models/tenants/TenantMembership";

/**
 * Statut synthétique d'un membre dans un espace.
 * Aligné avec l'enum MemberStatus côté backend.
 */
export type MemberStatus = "ACTIVE" | "INVITED";

/**
 * Projection utilisée par la page AdminMembers.
 * Alignée sur OrgMemberRowDto côté backend.
 */
export interface OrgMemberRow {
  userId: number;
  displayName: string;
  email: string | null;
  role: OrgRole;
  personId: number | null;
  personLabel: string | null;
  status: MemberStatus;
  joinedAt: string; // ISO-8601
}
