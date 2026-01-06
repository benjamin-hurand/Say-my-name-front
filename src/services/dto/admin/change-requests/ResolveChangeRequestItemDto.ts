import { ChangeResolutionDecision } from "./ChangeResolutionDecision";

export interface ResolveChangeRequestItemDto {
  itemId: number;
  decision: ChangeResolutionDecision; // APPROVE / REJECT
  /** Optionnel – note spécifique à l’item */
  resolutionComment?: string | null;
}
