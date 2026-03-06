import { OrgRole } from "../tenants/TenantMembership";

export interface User {
  publicId: string;
  displayName: string;
  primaryEmail: string;            // le back en envoie toujours une (primaire)
  emails: UserEmailDto[];
  srsAlgorithm: SrsAlgorithm;
  roles: string;                   // ex: "ROLE_USER,ROLE_ADMIN"
  active: boolean;
  tenantRole: OrgRole;       // rôle dans l'orga courante
}

export interface UserEmailDto {
  id: number;
  email: string;
  primary: boolean;
  loginAllowed: boolean;
  recoveryAllowed: boolean;
  verifiedAt: string | null;
  addedAt: string | null;
  recoveryEligibleAt: string | null;
  updatedAt: string | null;
}

export enum SrsAlgorithm {
  SM2  = 'SM2',
  PFA  = 'PFA',
  FSRS = 'FSRS',
}