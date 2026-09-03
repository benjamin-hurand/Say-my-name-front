// src/services/dto/person/search/PersonCardDtos.ts
export interface PersonAttributeExtraDto {
  attributeId: number;
  value: string;
  displayOrder: number | null;
}

export interface BasePersonCardDto {
  idPerson: number;
  displayName: string;
  photoSmallUrl: string | null;
  photoLargeUrl: string | null;
  primaryAttributes: PersonAttributeExtraDto[];
  extraAttributes: PersonAttributeExtraDto[];
}

export type UserPersonCardDto = BasePersonCardDto & {
  followed: boolean;
  hasPendingChangeRequests?: never; // empêche l’usage involontaire
};

export type AdminPersonCardDto = BasePersonCardDto & {
  emailStatus: EmailStatus;
  hasPendingChangeRequests: boolean;
  followed?: never;
};

// le type pour representer cet enum java: public enum EmailStatus { NONE, HAS, PRIMARY, PRIMARY_VERIFIED}
export type EmailStatus = "NONE" | "HAS" | "PRIMARY" | "PRIMARY_VERIFIED";

// Cas où un admin veut les deux infos (rare mais possible)
export type FullPersonCardDto = BasePersonCardDto & {
  followed: boolean;
  hasPendingChangeRequests: boolean;
};

// Union pratique pour les composants génériques
export type PersonCardDto =
  | UserPersonCardDto
  | AdminPersonCardDto
  | FullPersonCardDto;

export const isUserCard = (p: PersonCardDto): p is UserPersonCardDto =>
  (p as any).followed !== undefined;

export const isAdminCard = (p: PersonCardDto): p is AdminPersonCardDto =>
  (p as any).hasPendingChangeRequests !== undefined;

export interface PersonCardStub {
  idPerson: number;
  displayName: string;
  photoSmallUrl?: string | null;
  photoLargeUrl?: string | null;
}
