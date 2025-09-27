import { CourseStatsDto } from "../CourseStatsDto";

// src/utils/statsFormat.ts
export const pct = (x: number, digits = 0) => `${x.toFixed(digits)}%`;
export const ratioToPct = (r: number, digits = 0) => pct(Math.max(0, Math.min(1, r)) * 100, digits);

export function summaryLines(s?: CourseStatsDto) {
  if (!s) return [];
  return [
    `Progression : ${s.progressPercent}% maîtrisé`,
    `Couverture : ${s.createdTotal}/${s.totalCandidates} vus (${ratioToPct(s.createdCoverageRatio)})`,
    `Reste à découvrir : ${s.remainingUnseen}`,
    `Activité : ${s.answersToday} réponses aujourd’hui (${s.totalAnswers} au total)`,
  ];
}
