
export type TenantKind = "ORG" | "PERSONAL";

export interface TenantDto {
  id: number;
  kind: TenantKind;
  key: string | null; // null pour les tenants personnels
  name: string | null; // null pour les tenants personnels
  active: boolean | null; // null pour les tenants personnels
  createdAt: string;
  updatedAt: string;
}