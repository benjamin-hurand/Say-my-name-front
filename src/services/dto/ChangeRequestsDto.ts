// src/services/dto/change-requests.dto.ts
export type ChangeAction = "CREATE" | "UPDATE" | "DELETE";
export type ChangeStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

/** Item à soumettre dans une enveloppe (pas de personId ici). */
export interface SubmitChangeRequestItemRequest {
  action: ChangeAction;      // CREATE | UPDATE | DELETE
  reason: string;            // toujours requis
  // cible :
  attributeId?: number;      // requis pour CREATE
  personAttributeId?: number;// requis pour UPDATE/DELETE
  // valeur :
  proposedValue?: string;    // requis pour CREATE/UPDATE
}

/** Payload pour POST /api/change-requests (création d’une enveloppe avec N items) */
export interface SubmitChangeRequestRequest {
  personId: number;                              // porté par l’enveloppe
  items: SubmitChangeRequestItemRequest[];       // au moins 1 item
}

/** Réponse d’un item (retourné dans l’enveloppe) */
export interface ChangeRequestItemDto {
  id: number;
  changeRequestId: number;

  // Cible (aide UI)
  personId: number;
  attributeId: number | null;
  attributeName: string | null;
  personAttributeId: number | null;

  action: ChangeAction;
  proposedValue: string | null;   // valeur normalisée côté back
  reason: string;
}

/** Réponse de l’enveloppe après création / lecture */
export interface ChangeRequestDto {
  id: number;
  personId: number;
  requesterId: number;

  status: ChangeStatus;
  createdAt: string;              // ISO
  updatedAt: string;              // ISO

  resolvedById: number | null;
  resolvedAt: string | null;
  resolutionComment: string | null;

  items: ChangeRequestItemDto[];  // items créés (ou existants si réutilisation)
}
