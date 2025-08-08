// services/business/profile/profile.service.ts

import API from "../../api/apiUtils";
import { PersonAttribute } from "../../../models/commons/PersonAttribute";
import { ProfileResponseDto } from "../../dto/ProfileResponseDto";

const PROFILE_ENDPOINT = "/profile";

/** Récupère tout le profil (person + stats…) */
export async function getProfile(): Promise<ProfileResponseDto> {
  const res = await API.get<ProfileResponseDto>(PROFILE_ENDPOINT);
  return res.data;
}

/** Met à jour uniquement la photo */
export async function updatePhoto(form: FormData): Promise<ProfileResponseDto> {
  const res = await API.patch<ProfileResponseDto>(
    `${PROFILE_ENDPOINT}/photo`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

/** Met à jour un ou plusieurs attributs */
export async function updateAttributes(
  attributes: Pick<PersonAttribute, "id" | "value">[]
): Promise<ProfileResponseDto> {
  const res = await API.patch<ProfileResponseDto>(
    `${PROFILE_ENDPOINT}/attributes`,
    { attributes }
  );
  return res.data;
}

/** Met à jour le username et/ou l’email */
export async function updateAccount(
  username: string,
  email: string
): Promise<ProfileResponseDto> {
  const res = await API.patch<ProfileResponseDto>(
    PROFILE_ENDPOINT,
    { username, email }
  );
  return res.data;
}
