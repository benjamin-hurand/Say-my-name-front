// src/services/business/subscription/subscriptions.service.ts
import API from "../../api/apiUtils";
import { PersonSearchRequestDto } from "../../dto/person/search/PersonSearchRequestDto";

/** Page générique */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

/** Abonnement utilisateur -> personne */
export type UserSubscriptionDto = {
  userId: number;
  personId: number;
  createdAt: string; // ISO
};

/** Réponse bulk “follow/unfollow par recherche” (miroir du contrôleur) */
export type BulkBySearchResultDto = {
  matched: number; // nb total de personnes correspondant aux critères
  acted: number;   // nb réellement affectés (insérés/supprimés)
  skipped: number; // déjà dans le bon état
  seconds: number; // durée indicative côté serveur
};

/** Réponse bulk par liste d'IDs (endpoint existant /bulk) */
export type BulkSubscribeResponseDto = {
  requested: number;
  inserted: number;
  alreadyExisting: number;
};

export type BulkUnsubscribeResponseDto = {
  requested: number;
  removed: number;
  notFoundOrAlready: number;
};

/* =======================
 *  Endpoints “simples”
 * ======================= */

/** Liste paginée des abonnements (objets complets) */
export async function listSubscriptions(page = 0, size = 50, sort = "createdAt,desc") {
  const { data } = await API.get<Page<UserSubscriptionDto>>(
    `/subscriptions?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`
  );
  return data;
}

/** Liste paginée des IDs suivis (optimisé Quiz) */
export async function listFollowedPersonIds(page = 0, size = 200) {
  const { data } = await API.get<Page<number>>(
    `/subscriptions/person-ids?page=${page}&size=${size}`
  );
  return data;
}

/** Compteur des suivis */
export async function countFollowed() {
  const { data } = await API.get<{ count: number }>(`/subscriptions/count`);
  return data.count;
}

/** Follow 1 personne */
export async function subscribeOne(personId: number) {
  await API.post<void>(`/subscriptions/${personId}`);
}

/** Unfollow 1 personne */
export async function unsubscribeOne(personId: number) {
  await API.delete<void>(`/subscriptions/${personId}`);
}

/** Follow en masse par liste d’IDs (idempotent) */
export async function bulkSubscribe(personIds: number[]) {
  const { data } = await API.post<BulkSubscribeResponseDto>(
    `/subscriptions/bulk/follow`,
    { personIds }
  );
  return data;
}

/** Unfollow en masse par liste d’IDs (idempotent) */
export async function bulkUnsubscribe(personIds: number[]) {
  const { data } = await API.post<BulkUnsubscribeResponseDto>(
    `/subscriptions/bulk/unfollow`,
    { personIds }
  );
  return data;
}

/* ==========================================
 *  NOUVEAUX endpoints : bulk par “recherche”
 * ========================================== */

/**
 * Suivre tous les résultats d’une recherche (idempotent).
 * Le backend ignore tri/pagination et force followedOnly=false pour agir sur TOUT l’ensemble.
 */
export async function bulkFollowBySearch(body: PersonSearchRequestDto) {
  const { data } = await API.post<BulkBySearchResultDto>(
    `/subscriptions/bulk/search/follow`,
    body
  );
  return data;
}

/**
 * Ne plus suivre tous les résultats d’une recherche (idempotent).
 * Ignore tri/pagination, agit sur l’ensemble.
 */
export async function bulkUnfollowBySearch(body: PersonSearchRequestDto) {
  const { data } = await API.post<BulkBySearchResultDto>(
    `/subscriptions/bulk/search/unfollow`,
    body
  );
  return data;
}
