// src/services/business/auth/authEmail.service.ts
import API from "../../api/apiUtils";
import { AddEmailRequestDto, AddEmailResponseDto, ConfirmEmailVerificationRequestDto, ConfirmEmailVerificationResponseDto, ResendEmailVerificationRequestDto } from "../../dto/auth/EmailVerificationDtos";

const AUTH_ENDPOINT = "/auth";

/**
 * Étape 1 : Demande d'ajout d'email (peut créer un challenge OTP, ou répondre alreadyVerified)
 * POST /api/auth/emails/add
 */
export async function requestAddEmail(dto: AddEmailRequestDto): Promise<AddEmailResponseDto> {
  const { data } = await API.post<AddEmailResponseDto>(`${AUTH_ENDPOINT}/emails/add`, dto);
  return normalizeAddEmailResponse(data);
}

/**
 * Étape 2 : Confirme l'OTP
 * POST /api/auth/emails/confirm
 */
export async function confirmAddEmail(dto: ConfirmEmailVerificationRequestDto): Promise<ConfirmEmailVerificationResponseDto> {
  const { data } = await API.post<ConfirmEmailVerificationResponseDto>(`${AUTH_ENDPOINT}/emails/confirm`, dto);
  return data;
}

/**
 * Étape 3 : Resend explicite (bouton "Renvoyer le code")
 * POST /api/auth/emails/resend
 *
 * Note: ton backend retourne AddEmailResponseDto (challenge info)
 */
export async function resendAddEmailOtp(dto: ResendEmailVerificationRequestDto): Promise<AddEmailResponseDto> {
  const { data } = await API.post<AddEmailResponseDto>(`${AUTH_ENDPOINT}/emails/resend`, dto);
  return normalizeAddEmailResponse(data);
}

/**
 * Helpers UX / robustesse
 */
export function isOtpChallenge(r: AddEmailResponseDto | null | undefined): boolean {
  return !!r && r.verificationKind === "OTP" && !!r.verificationId && !r.alreadyVerified;
}

export function isAlreadyVerified(r: AddEmailResponseDto | null | undefined): boolean {
  return !!r && r.alreadyVerified === true;
}

/**
 * Le backend expose UUID via java.util.UUID -> string côté JSON.
 * On normalise un peu pour éviter les null/undefined surprises.
 */
function normalizeAddEmailResponse(r: AddEmailResponseDto): AddEmailResponseDto {
  return {
    ...r,
    verificationId: r.verificationId ?? null,
    ttlMinutes: r.ttlMinutes ?? null,
  };
}
