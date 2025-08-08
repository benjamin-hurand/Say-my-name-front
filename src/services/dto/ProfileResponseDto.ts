import { Profile } from "../../models/commons/Profile";

/**
 * DTO de la réponse du profil de l'utilisateur connecté.
 * Pour l'instant, ne contient que la Person associée.
 * À enrichir ultérieurement avec d'autres propriétés (stats, préférences, historique, etc.).
 */
export interface ProfileResponseDto {
  person: Profile | null;
}
