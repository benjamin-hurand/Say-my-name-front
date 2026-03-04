import { PersonDto } from "../../../../models/commons/PersonDto";
import { OrgRole } from "../../../../models/tenants/UserTenant";

/** Doit refléter com.saymyname.core.model.enums.InvitationType */
export type InvitationType = "EMAIL" | "SELF_SERVICE";

/** Mirror de com.saymyname.webapp.dto.invitation.InvitationUsageDto */
export type InvitationUsageDto = {
  id: number;
  invitationId: number;
  userId: number | null;
  personId: number | null;
  /** ISO-8601 string (LocalDateTime côté Java) */
  usedAt: string;
  userAgent: string | null;
};

/** Mirror de com.saymyname.webapp.dto.invitation.InvitationDto */
export type InvitationDto = {
  id: number;
  type: InvitationType;
  pinRequired: boolean;

  label: string | null;
  note: string | null;
  /** JSON sérialisé éventuel (clé/valeurs business) */
  constraintsJson: string | null;

  role: OrgRole | null;
  email: string | null;
  personId: number | null;

  maxUses: number | null;
  usesCount: number;

  /** ISO-8601 strings (LocalDateTime côté Java) */
  expiresAt: string | null;
  revokedAt: string | null;

  createdByUserId: number | null;
  createdAt: string; // non-null côté back

  acceptedByUserId: number | null;
  acceptedAt: string | null;

  lastUsedAt: string | null;

  usages: InvitationUsageDto[];
};

/** Mirror de com.saymyname.webapp.dto.invitation.InvitationPreviewDto */
export type InvitationPreviewDto = {
  id: number;
  type: InvitationType;
  pinRequired: boolean;

  label: string | null;
  note: string | null;

  role: OrgRole | null;
  email: string | null;
  person: PersonDto | null;

  maxUses: number | null;
  usesCount: number;

  /** Dérivés côté back */
  expired: boolean;
  revoked: boolean;

  /** ISO-8601 string (LocalDateTime côté Java) */
  expiresAt: string | null;
};

/** Mirror de com.saymyname.webapp.dto.invitation.CreateInvitationRequestDto */
export type CreateInvitationRequestDto = {
  type: InvitationType;

  label?: string | null;
  note?: string | null;
  /** JSON sérialisé ; tu peux aussi envoyer un objet et le stringifier côté service */
  constraintsJson?: string | null;

  role?: OrgRole | null;
  email?: string | null;
  /** Invitation nominative éventuelle */
  personId?: number | null;

  /** ISO-8601 string (LocalDateTime côté Java) */
  expiresAt?: string | null;
  /** null = illimité */
  maxUses?: number | null;

  /** Requis par le back */
  rawToken: string;
  /** Optionnel */
  rawPin?: string | null;
};

/* -----------------------
   Helpers optionnels
   ---------------------- */
export function isInvitationExpired(
  expiresAt: string | null,
  now = new Date()
): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < now.getTime();
}

export function isInvitationRevoked(revokedAt: string | null): boolean {
  return !!revokedAt;
}

export function isInvitationAccepted(acceptedAt: string | null): boolean {
  return !!acceptedAt;
}

/* -----------------------
   Constraints JSON
   ---------------------- */

/**
 * Mode d’expiration pour les liens de groupe.
 * Aligné avec ce que tu utilises côté front dans AdminMembers
 * (GroupInviteExpiryMode).
 */
export type GroupExpiryMode = "HOURS_24" | "DAYS_7" | "DAYS_30" | "DAYS_90";

export type InvitationConstraintsPayload = {
  /** "PERSONAL" = nominative, "GROUP" = auto-inscription / lien de groupe */
  kind?: "PERSONAL" | "GROUP";

  /** Si true : on pourra exiger que l'e-mail du user match inv.email */
  requireEmailMatch?: boolean;

  /** Si true : on pourra exiger que la Person liée à l'usage == personId de l'invitation */
  requirePersonMatch?: boolean;

  /** Déjà utilisé dans InvitationEventsHandler pour l’e-mail */
  locale?: string;

  /** Message personnalisé dans l'e-mail */
  message?: string | null;

  /**
   * Rôle par défaut pour les comptes créés via un lien de groupe.
   * Exemple : VIEWER, EDITOR, ADMIN.
   */
  defaultRole?: OrgRole;

  /**
   * Mode d’expiration du lien de groupe.
   * Interprété côté back (ou ignoré si non fourni).
   */
  expiryMode?: GroupExpiryMode;
};

/** Helper générique pour sérialiser les contraintes */
export function buildConstraintsJson(
  payload?: InvitationConstraintsPayload | null
): string | null {
  if (!payload) return null;
  return JSON.stringify(payload);
}
