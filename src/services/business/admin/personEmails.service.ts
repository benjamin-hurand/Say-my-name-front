// src/services/business/admin/personEmailAdmin.service.ts
import API from "../../api/apiUtils";
import { CreatePersonEmailRequestDto, PersonEmailDto, UpdatePersonEmailRequestDto } from "../../dto/person/admin/PersonEmailDto";

const ADMIN_ENDPOINT = "/admin";

// --- API

export async function listPersonEmails(personId: number): Promise<PersonEmailDto[]> {
  const { data } = await API.get<PersonEmailDto[]>(`${ADMIN_ENDPOINT}/persons/${personId}/emails`);
  return data;
}

export async function createPersonEmail(
  personId: number,
  payload: CreatePersonEmailRequestDto
): Promise<PersonEmailDto> {
  const { data } = await API.post<PersonEmailDto>(`${ADMIN_ENDPOINT}/persons/${personId}/emails`, payload);
  return data;
}

export async function updatePersonEmail(
  personId: number,
  emailId: number,
  payload: UpdatePersonEmailRequestDto
): Promise<PersonEmailDto> {
  const { data } = await API.put<PersonEmailDto>(`${ADMIN_ENDPOINT}/persons/${personId}/emails/${emailId}`, payload);
  return data;
}

export async function deletePersonEmail(personId: number, emailId: number): Promise<void> {
  await API.delete(`${ADMIN_ENDPOINT}/persons/${personId}/emails/${emailId}`);
}

export async function setPrimaryEmail(personId: number, emailId: number): Promise<void> {
  await API.post(`${ADMIN_ENDPOINT}/persons/${personId}/emails/${emailId}/primary`);
}

export async function markVerifiedEmail(personId: number, emailId: number): Promise<void> {
  await API.post(`${ADMIN_ENDPOINT}/persons/${personId}/emails/${emailId}/verify`);
}

export async function markBouncedEmail(personId: number, emailId: number): Promise<void> {
  await API.post(`${ADMIN_ENDPOINT}/persons/${personId}/emails/${emailId}/bounce`);
}

// Optionnel : helper pour (dé)activer via update
export async function toggleActiveEmail(personId: number, emailId: number, active: boolean): Promise<PersonEmailDto> {
  return updatePersonEmail(personId, emailId, { active });
}

// Lookup doublon e-mail actif dans l’orga courante
export async function checkDuplicateEmailInOrg(email: string): Promise<{ exists: boolean; personId?: number }> {
  const { data } = await API.get<{ exists: boolean; personId?: number }>(
    `${ADMIN_ENDPOINT}/emails/exists`,
    { params: { email } }
  );
  return data;
}
