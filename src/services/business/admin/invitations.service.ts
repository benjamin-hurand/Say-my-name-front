// src/services/business/admin/invitationAdmin.service.ts
import API from "../../api/apiUtils";
import { CreateInvitationRequestDto, InvitationDto } from "../../dto/person/admin/InvitationDto";

const ADMIN_ENDPOINT = "/admin";

// --- API

/** Liste toutes les invitations de le tenant courant (TenantContext). */
export async function listInvitations(): Promise<InvitationDto[]> {
  const { data } = await API.get<InvitationDto[]>(`${ADMIN_ENDPOINT}/invitations`);
  return data;
}

/** Récupère une invitation par id. */
export async function getInvitation(invitationId: number): Promise<InvitationDto> {
  const { data } = await API.get<InvitationDto>(`${ADMIN_ENDPOINT}/invitations/${invitationId}`);
  return data;
}

/** Crée une invitation (org déduite du contexte côté serveur). */
export async function createInvitation(payload: CreateInvitationRequestDto): Promise<InvitationDto> {
  const { data } = await API.post<InvitationDto>(`${ADMIN_ENDPOINT}/invitations`, payload);
  return data;
}

/** Révoque (annule) une invitation. Le backend renvoie l’invitation mise à jour. */
export async function revokeInvitation(invitationId: number): Promise<InvitationDto> {
  const { data } = await API.post<InvitationDto>(`${ADMIN_ENDPOINT}/invitations/${invitationId}/revoke`);
  return data;
}

/** Supprime définitivement une invitation. */
export async function deleteInvitation(invitationId: number): Promise<void> {
  await API.delete(`${ADMIN_ENDPOINT}/invitations/${invitationId}`);
}
