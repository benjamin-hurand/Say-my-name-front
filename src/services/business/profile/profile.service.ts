// services/business/profile/profile.service.ts

import API from "../../api/apiUtils";
import { ProfileResponseDto } from "../../dto/ProfileResponseDto";
import { AttributeChanges } from "../../../models/commons/Profile/AttributesChanges";
import { AttributeValuesResponseDto } from "../../../models/commons/PersonAttribute";

const PROFILE_ENDPOINT = "/profile";

/** Récupère tout le profil (person + stats…) */
export async function getProfile(): Promise<ProfileResponseDto> {
  const res = await API.get<ProfileResponseDto>(PROFILE_ENDPOINT);
  return res.data;
}

/**
 * Écritures canoniques (bulk) + renvoie l'état normalisé de l'attribut ciblé.
 * Le back déduit la Person depuis l'utilisateur courant.
 */
export async function saveAttributeChanges(
  _personId: number, // ignoré
  attributeId: number,
  changes: AttributeChanges
): Promise<AttributeValuesResponseDto> {
  const { data } = await API.post<AttributeValuesResponseDto>(
    `${PROFILE_ENDPOINT}/attributes/${attributeId}/bulk`,
    changes
  );
  return data;
}
