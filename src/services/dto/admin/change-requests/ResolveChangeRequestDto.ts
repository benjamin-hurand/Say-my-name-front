import { ResolveChangeRequestItemDto } from "./ResolveChangeRequestItemDto";

/**
 * Miroir de com.saymyname.webapp.dto.admin.ResolveChangeRequestDto
 * decisions peut être vide mais jamais null.
 */
export interface ResolveChangeRequestDto {
  /** Optionnel – note globale */
  resolutionComment?: string | null;
  decisions: ResolveChangeRequestItemDto[];
}
