// src/services/business/leaderboard/leaderboard.service.ts

import API from "../../api/apiUtils";

// -----------------------------
// DTOs (alignés avec ton back)
// -----------------------------

export type LeaderboardEntryDto = {
  userId: number;
  displayName: string;
  xp: number;
  rank: number;
  lastEventAt: string | null; // ISO
};

export type LeaderboardResponseDto = {
  generatedAt: string; // ISO
  entries: LeaderboardEntryDto[];
  myUserId?: number;
  myRank?: number;
  myXp?: number;
};

export type XpEventDto = {
  id: number;
  eventKey: string;
  sourceType: string | null;
  sourceId: number | null;
  deltaXp: number; // delta_xp
  createdAt: string; // ISO
};

export type XpHistoryResponseDto = {
  userId: number;
  generatedAt: string; // ISO
  nextBefore: string | null; // ISO createdAt cursor
  nextBeforeId: number | null; // id tie-break cursor
  events: XpEventDto[];
};

// -----------------------------
// Endpoint
// -----------------------------
const LEADERBOARD_ENDPOINT = "/leaderboard";

/**
 * GET /api/leaderboard?limit=50
 * Renvoie:
 * - top entries
 * - infos "me" (myRank/myXp) si dispo
 */
export async function getLeaderboardTop(
  limit: number = 50
): Promise<LeaderboardResponseDto> {
  const { data } = await API.get<LeaderboardResponseDto>(LEADERBOARD_ENDPOINT, {
    params: { limit },
  });
  return data;
}

/**
 * GET /api/leaderboard/me
 * Renvoie l'entrée du user courant (ou rank=0/xp=0 si aucun event)
 */
export async function getMyLeaderboardEntry(): Promise<LeaderboardEntryDto> {
  const { data } = await API.get<LeaderboardEntryDto>(
    `${LEADERBOARD_ENDPOINT}/me`
  );
  return data;
}

/**
 * GET /api/leaderboard/me/events
 * Pagination cursor:
 * - before: ISO datetime (createdAt)
 * - beforeId: id (tie-break)
 *
 * Exemple:
 * page1: getMyXpHistory({ limit: 50 })
 * page2: getMyXpHistory({ limit: 50, before: page1.nextBefore, beforeId: page1.nextBeforeId })
 */
export type GetMyXpHistoryParams = {
  limit?: number; // default 50, max 200 côté back
  before?: string; // ISO datetime
  beforeId?: number; // tie-break
};

export async function getMyXpHistory(
  params: GetMyXpHistoryParams = {}
): Promise<XpHistoryResponseDto> {
  const { limit = 50, before, beforeId } = params;

  const { data } = await API.get<XpHistoryResponseDto>(
    `${LEADERBOARD_ENDPOINT}/me/events`,
    {
      params: {
        limit,
        ...(before ? { before } : {}),
        ...(beforeId != null ? { beforeId } : {}),
      },
    }
  );

  return data;
}

/**
 * Helper pratique pour pagination cursor:
 * - passe directement la réponse précédente
 */
export async function getMyXpHistoryNext(
  prev: XpHistoryResponseDto,
  limit: number = 50
): Promise<XpHistoryResponseDto> {
  if (!prev.nextBefore || prev.nextBeforeId == null) {
    // plus de page suivante
    return {
      userId: prev.userId,
      generatedAt: new Date().toISOString(),
      nextBefore: null,
      nextBeforeId: null,
      events: [],
    };
  }

  return getMyXpHistory({
    limit,
    before: prev.nextBefore,
    beforeId: prev.nextBeforeId,
  });
}
