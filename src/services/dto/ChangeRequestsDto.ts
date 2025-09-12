export type ChangeAction = "CREATE" | "UPDATE" | "DELETE";
export type ChangeStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

/** Item à soumettre dans une enveloppe (pas de reason ici côté requête). */
export interface SubmitChangeRequestItemDto {
  personAttributeId?: number;    // requis pour UPDATE/DELETE
  action: ChangeAction;          // CREATE | UPDATE | DELETE
  proposedValue?: string;        // requis pour CREATE/UPDATE
}

/** Payload pour POST /api/change-requests */
export interface SubmitChangeRequestDto {
  personId: number;                      // porté par l’enveloppe
  attributeId: number;
  requestReason: string;                 // motif global (obligatoire dans ton back)
  items: SubmitChangeRequestItemDto[];   // min 1 item
}

/** Payload d’édition d’une enveloppe (remplace l’intégralité des items). */
export type UpdateChangeRequestDto = {
  requestReason: string;                      // motif global (remplacé)
  items: SubmitChangeRequestItemDto[];        // liste complète: CREATE / UPDATE / DELETE
};

/** Réponse d’un item (retourné dans l’enveloppe) */
export interface ChangeRequestItemDto {
  id: number;
  changeRequestId: number;

  // Cible (aide UI)
  personId: number;
  attributeName: string | null;
  personAttributeId: number | null;

  action: ChangeAction;
  proposedValue: string | null;   // valeur normalisée côté back
}

/** Réponse de l’enveloppe après création / lecture */
export interface ChangeRequestDto {
  id: number;
  personId: number;
  requesterId: number;
  attributeId: number;

  status: ChangeStatus;
  createdAt: string;              // ISO
  updatedAt: string;              // ISO

  resolvedById: number | null;
  resolvedAt: string | null;
  resolutionComment: string | null;

  items: ChangeRequestItemDto[];
}
