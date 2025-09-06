// src/services/business/change-requests/changeRequests.service.ts
import API from "../../api/apiUtils";
import { SubmitChangeRequestRequest, ChangeRequestDto } from "../../dto/ChangeRequestsDto";


const BASE = "/change-requests";

/** Soumet une enveloppe avec un ou plusieurs items. Retourne l’enveloppe + items. */
export async function submitChangeRequest(
  payload: SubmitChangeRequestRequest
): Promise<ChangeRequestDto> {
  const { data } = await API.post<ChangeRequestDto>(BASE, payload);
  return data;
}

/** Annule toute l’enveloppe (et ses items PENDING) si l’utilisateur en est l’auteur. */
export async function cancelChangeRequest(changeRequestId: number): Promise<void> {
  await API.post<void>(`${BASE}/${changeRequestId}/cancel`);
}
