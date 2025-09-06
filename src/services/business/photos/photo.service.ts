// src/services/business/photo/photo.service.ts
import API from "../../api/apiUtils";
import type { Photo } from "../../../models/commons/Photo";

const PERSONS_ENDPOINT = "/persons";
const PHOTOS_ENDPOINT = "/photos";

/**
 * Soumet une photo pour approbation (crée/remplace la PENDING d'une personne).
 * Envoie un FormData avec le champ "photo".
 */
export async function submitPhotoForApproval(
  personId: number,
  file: File | Blob
): Promise<Photo> {
  const form = new FormData();
  form.append("photo", file);

  const res = await API.post<Photo>(
    `${PERSONS_ENDPOINT}/${personId}/photos`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

/**
 * (Optionnel) Récupère une photo par id si ton API expose GET /photos/{id}.
 */
export async function getPhotoById(photoId: number): Promise<Photo> {
  const res = await API.get<Photo>(`${PHOTOS_ENDPOINT}/${photoId}`);
  return res.data;
}
