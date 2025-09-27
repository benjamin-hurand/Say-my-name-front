export type GamePopulationScope = 'ALL' | 'FOLLOWED' | 'UNFOLLOWED';

export const populationScopes: Record<GamePopulationScope, { label: string }> = {
  ALL:        { label: 'Everyone' },
  FOLLOWED:   { label: 'Followed only' },
  UNFOLLOWED: { label: 'Not followed' },
};
