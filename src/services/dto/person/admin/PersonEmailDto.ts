// src/services/dto/person/admin/PersonEmailDto.ts
// Miroirs des DTO Java :
// - com.saymyname.webapp.dto.person.CreatePersonEmailRequestDto
// - com.saymyname.webapp.dto.person.UpdatePersonEmailRequestDto
// - com.saymyname.webapp.dto.person.PersonEmailDto
// - com.saymyname.core.model.enums.EmailKind
// - com.saymyname.core.model.enums.EmailSourceKind

/** Mirror de com.saymyname.core.model.enums.EmailKind */
export type EmailKind = "WORK" | "PERSONAL" | "OTHER";

/** Mirror de com.saymyname.core.model.enums.EmailSourceKind */
export type EmailSourceKind = "IMPORT" | "MANUAL" | "SYNC";

/** Mirror de com.saymyname.webapp.dto.person.CreatePersonEmailRequestDto */
export type CreatePersonEmailRequestDto = {
  email: string;
  kind: EmailKind;                // non-null côté Java
  sourceKind: EmailSourceKind;    // non-null côté Java
  sourceLabel: string | null;     // String en Java -> accepter null/"" en TS
  primary: boolean | null;        // Boolean (nullable) en Java
};

/** Mirror de com.saymyname.webapp.dto.person.UpdatePersonEmailRequestDto */
export type UpdatePersonEmailRequestDto = {
  email?: string | null;
  kind?: EmailKind | null;
  sourceKind?: EmailSourceKind | null;
  sourceLabel?: string | null;
  primary?: boolean | null;
  active?: boolean | null;
};

/** Mirror de com.saymyname.webapp.dto.person.PersonEmailDto */
export type PersonEmailDto = {
  id: number;
  personId: number;
  email: string;
  kind: EmailKind;
  sourceKind: EmailSourceKind;
  sourceLabel: string | null;
  primary: boolean;
  active: boolean;

  /** LocalDateTime Java -> ISO string côté JSON */
  verifiedAt: string | null;
  bouncedAt: string | null;
  createdAt: string;   // non-null côté Java
  updatedAt: string;   // non-null côté Java
};

/* -----------------------
   (Optionnel) Helpers/UI
   ---------------------- */

export const EMAIL_KINDS: EmailKind[] = ["WORK", "PERSONAL", "OTHER"];
export const EMAIL_SOURCE_KINDS: EmailSourceKind[] = ["IMPORT", "MANUAL", "SYNC"];

/** Petit utilitaire pour parser une date ISO en Date (si non null) */
export function toDateOrNull(iso?: string | null): Date | null {
  return iso ? new Date(iso) : null;
}
