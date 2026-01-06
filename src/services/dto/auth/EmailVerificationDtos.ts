// src/services/dto/auth/emailVerificationDtos.ts

import { UserEmailDto } from "../../../models/commons/User";

// ✅ Copie "front-safe" de l'enum backend (JSON => string)
export type EmailVerificationKind = "OTP" | "NONE";

// -------------------- Requests --------------------

export interface AddEmailRequestDto {
  email: string;
  makePrimaryNow?: boolean | null;
}

export interface ConfirmEmailVerificationRequestDto {
  email: string;
  verificationId: string; // UUID string
  code: string;
}

export interface ResendEmailVerificationRequestDto {
  email: string;
  verificationId: string; // UUID string
}

// -------------------- Responses --------------------

export interface AddEmailResponseDto {
  email: string;
  alreadyAttached: boolean;
  alreadyVerified: boolean;
  verificationKind: EmailVerificationKind;
  verificationId: string | null; // null si alreadyVerified
  ttlMinutes: number | null; // null si alreadyVerified
}

export interface ConfirmEmailVerificationResponseDto {
  email: UserEmailDto;
  primaryChanged: boolean;
}
