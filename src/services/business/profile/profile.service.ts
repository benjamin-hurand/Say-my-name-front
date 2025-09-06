// services/business/profile/profile.service.ts

import API from "../../api/apiUtils";
import { ProfileResponseDto } from "../../dto/ProfileResponseDto";
import { AttributeChanges } from "../../../models/commons/Profile/AttributesChanges";

const PROFILE_ENDPOINT = "/profile";

/** Récupère tout le profil (person + stats…) */
export async function getProfile(): Promise<ProfileResponseDto> {
  const res = await API.get<ProfileResponseDto>(PROFILE_ENDPOINT);
  return res.data;
}

/**
 * Écritures canonique (bulk) des changements multi-valeurs pour un attribut donné.
 * - Le back déduit la Person depuis l'utilisateur courant.
 * - Aucune tentative de fallback (polyfill) : l’endpoint bulk est la source de vérité.
 *
 * @param _personId (obsolète / ignoré) conservé pour compat éventuelle
 * @param attributeId identifiant de l’attribut ciblé
 * @param changes { create: [{value}], update: [{id,value}], delete: [{id}] }
 */
export async function saveAttributeChanges(
  _personId: number, // non utilisé (le back déduit depuis le principal)
  attributeId: number,
  changes: AttributeChanges
): Promise<void> {
  await API.post(`${PROFILE_ENDPOINT}/attributes/${attributeId}/bulk`, changes);
}
