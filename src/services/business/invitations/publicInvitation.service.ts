import { PersonDto } from "../../../models/commons/PersonDto";
import API from "../../api/apiUtils";

// ---- Types (autonomes pour ce service) ----
export type InvitationType = "EMAIL" | "LINK" | "CODE";

export interface InvitationPreviewResponse {
  id: number | null;
  type: InvitationType;
  label: string | null;
  note: string | null;
  role: string | null;
  email: string | null;
  person: PersonDto | null;
  maxUses: number | null;
  usesCount: number;
  expired: boolean;
  revoked: boolean;
  expiresAt: string | null; // ISO datetime
}

export interface InvitationResponse {
  id: number;
  type: InvitationType;
  label?: string | null;
  note?: string | null;
  constraintsJson?: string | null;

  role?: string | null;
  email?: string | null;
  personId?: number | null;

  maxUses?: number | null;
  usesCount: number;
  expiresAt?: string | null;
  revokedAt?: string | null;

  createdByUserId?: number | null;
  createdAt?: string | null;
  acceptedByUserId?: number | null;
  acceptedAt?: string | null;
  lastUsedAt?: string | null;

  // public: en général le backend ne renvoie pas usages ici
  usages?: never;
}

export interface AcceptInvitationRequest {
  token: string;
  pin?: string | null;
  personId?: number | null;
}

// ---- Endpoints inline (pas de constants partagées) ----
// NB: votre API util est censé préfixer par /api
const PUBLIC_BASE = "/invitations";
const PREVIEW_PATH = `${PUBLIC_BASE}/preview`;
const ACCEPT_PATH = `${PUBLIC_BASE}/accept`;

/**
 * Prévisualise une invitation via le token (publique, non authentifié).
 */
export const previewInvitation = async (
  token: string
): Promise<InvitationPreviewResponse> => {
  const res = await API.get<InvitationPreviewResponse>(PREVIEW_PATH, {
    params: { token },
  });
  return res.data;
};

/**
 * Accepte une invitation (authentifié).
 */
export const acceptInvitation = async (
  payload: AcceptInvitationRequest
): Promise<InvitationResponse> => {
  const res = await API.post<InvitationResponse>(ACCEPT_PATH, payload);
  return res.data;
};
