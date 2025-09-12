// src/services/business/change-requests/change-requests.service.ts
import API from "../../api/apiUtils";
import {
  SubmitChangeRequestDto,
  ChangeRequestDto,
  UpdateChangeRequestDto,
} from "../../dto/ChangeRequestsDto";

const BASE = "/change-requests";

/** Soumet une enveloppe avec un ou plusieurs items. Retourne l’enveloppe + items. */
export async function submitChangeRequest(
  payload: SubmitChangeRequestDto
): Promise<ChangeRequestDto> {
  const { data } = await API.post<ChangeRequestDto>(BASE, payload);
  return data;
}

/** Annule toute l’enveloppe (et ses items PENDING) si l’utilisateur en est l’auteur. */
export async function cancelChangeRequest(changeRequestId: number): Promise<void> {
  await API.post<void>(`${BASE}/${changeRequestId}/cancel`);
}

/**
 * Modifie une enveloppe existante (remplacement total des items).
 *
 * Règle front :
 * - Si payload.items est vide → on appelle directement l’API d’annulation.
 * - Sinon → on envoie un PUT classique.
 *
 * Hypothèse d’API: PUT /change-requests/{id}
 * - Sur CREATE => { action:"CREATE", attributeId, proposedValue }
 * - Sur UPDATE => { action:"UPDATE", personAttributeId, proposedValue }
 * - Sur DELETE => { action:"DELETE", personAttributeId }
 */
export async function updateChangeRequest(
  changeRequestId: number,
  payload: UpdateChangeRequestDto
): Promise<ChangeRequestDto | { cancelled: true }> {
  if (!payload.items || payload.items.length === 0) {
    await cancelChangeRequest(changeRequestId);
    return { cancelled: true as const };
  }

  const { data } = await API.put<ChangeRequestDto>(`${BASE}/${changeRequestId}`, payload);
  return data;
}
