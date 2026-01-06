// src/services/security/Auth.service.ts
import { CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import API from "../api/apiUtils";
import { UserOrganizationDto } from "../dto/organization/UserOrganizationDto";
import { EmailVerificationKind } from "../dto/auth/EmailVerificationDtos";

// =====================
// Types
// =====================

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  displayName: string;
  email: string;
  password: string;
}

/** DTO renvoyé par /api/auth/session */
export interface SessionDto {
  publicUserId: string | null;
  displayName: string | null;
  isAdmin: boolean;
  organizations: UserOrganizationDto[];
  emails: string[];
}

/** DTO renvoyé par /api/auth/login, /api/auth/refresh, etc. */
export interface AuthResponseDto {
  accessToken: string;
  session: SessionDto;
}

// ---------------------
// Register Classic (OTP)
// ---------------------

export interface RegisterClassicResponse {
  email: string | null;
  alreadyVerified: boolean;
  verificationKind: EmailVerificationKind;
  verificationId: string | null;
  ttlMinutes: number | null;
}

export interface ConfirmRegisterEmailRequest {
  email: string;
  verificationId: string;
  code: string;
}

export interface ResendRegisterEmailRequest {
  email: string;
  verificationId: string;
}

// ---------------------
// Google
// ---------------------

export interface RegisterGoogleRequestDto {
  credential: string;
  clientId: string;
}

// =====================
// Helpers
// =====================

const extractAxiosStatus = (error: unknown): number => {
  if (axios.isAxiosError(error)) {
    return error.response?.status ?? 500;
  }
  return 500;
};

const getGoogleClientIdOrThrow = (clientId?: string): string => {
  const cid =
    clientId ??
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ??
    (process.env as any)?.REACT_APP_GOOGLE_CLIENT_ID;

  if (!cid) {
    throw new Error(
      "Google clientId is missing (VITE_GOOGLE_CLIENT_ID / REACT_APP_GOOGLE_CLIENT_ID)."
    );
  }
  return cid;
};

// =====================
// Auth classique
// =====================

export const login = async (credentials: LoginCredentials): Promise<AuthResponseDto> => {
  const response = await API.post<AuthResponseDto>("/auth/login", credentials);
  return response.data;
};

/**
 * Logout côté serveur : révoque le refresh token (cookie) et clear cookies.
 */
export const logoutServer = async (): Promise<void> => {
  // Si ton back exige un body JSON (consumes=application/json), envoie {} :
  await API.post("/auth/logout", {});
};

// =====================
// Register classique (OTP)
// =====================

export const register = async (credentials: SignupCredentials): Promise<RegisterClassicResponse> => {
  const response = await API.post<RegisterClassicResponse>("/auth/register", credentials);
  return response.data;
};

export const confirmRegisterEmail = async (
  payload: ConfirmRegisterEmailRequest
): Promise<AuthResponseDto> => {
  const response = await API.post<AuthResponseDto>("/auth/register/confirm", payload);
  return response.data;
};

export const resendRegisterEmail = async (
  payload: ResendRegisterEmailRequest
): Promise<RegisterClassicResponse> => {
  const response = await API.post<RegisterClassicResponse>("/auth/register/resend", payload);
  return response.data;
};

// =====================
// Register / Login Google
// =====================

export const registerWithGoogle = async (
  credentials: CredentialResponse,
  clientId?: string
): Promise<AuthResponseDto> => {
  if (!credentials?.credential) {
    throw new Error("No credential received from Google.");
  }

  const cid = getGoogleClientIdOrThrow(clientId);

  const payload: RegisterGoogleRequestDto = {
    credential: credentials.credential,
    clientId: cid,
  };

  const response = await API.post<AuthResponseDto>("/auth/google/register", payload);
  return response.data;
};

export const loginWithGoogle = async (
  credentials: CredentialResponse,
  clientId?: string
): Promise<AuthResponseDto> => {
  if (!credentials?.credential) {
    throw new Error("No credential received from Google.");
  }

  const cid = getGoogleClientIdOrThrow(clientId);

  const payload: RegisterGoogleRequestDto = {
    credential: credentials.credential,
    clientId: cid,
  };

  const response = await API.post<AuthResponseDto>("/auth/google/login", payload);
  return response.data;
};

export const silentGoogleSignIn = (): Promise<CredentialResponse> => {
  return new Promise((resolve, reject) => {
    const client = (window as any).google?.accounts.oauth2.initTokenClient({
      client_id: getGoogleClientIdOrThrow(),
      scope: "profile email",
      callback: (response: CredentialResponse) => {
        if (!response.credential) reject(new Error("No credential received from Google."));
        else resolve(response);
      },
    });

    try {
      client.requestAccessToken({ prompt: "none" });
    } catch (error) {
      reject(error);
    }
  });
};

// =====================
// Refresh / Session
// =====================

/**
 * POST /api/auth/refresh
 * - refresh token via cookie HttpOnly
 * - réponse = AuthResponseDto (accessToken + session)
 */
export const refreshAccessToken = async (): Promise<AuthResponseDto> => {
  // Si ton back exige consumes=application/json, envoie {} :
  const response = await API.post<AuthResponseDto>("/auth/refresh", {});
  return response.data;
};

/**
 * GET /api/auth/session
 * - réponse = SessionDto (sans accessToken)
 */
export const getSession = async (): Promise<SessionDto> => {
  const response = await API.get<SessionDto>("/auth/session");
  return response.data;
};

// =====================
// Forgot / Reset Password
// =====================

export const requestPasswordReset = async (email: string): Promise<void> => {
  await API.post("/auth/forgot-password", { email });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await API.post("/auth/reset-password", { token, newPassword });
};

// =====================
// Helpers "safe"
// =====================

export const registerSafe = async (
  credentials: SignupCredentials
): Promise<{ ok: true; data: RegisterClassicResponse } | { ok: false; status: number }> => {
  try {
    const data = await register(credentials);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, status: extractAxiosStatus(e) };
  }
};

export const confirmRegisterEmailSafe = async (
  payload: ConfirmRegisterEmailRequest
): Promise<{ ok: true; data: AuthResponseDto } | { ok: false; status: number }> => {
  try {
    const data = await confirmRegisterEmail(payload);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, status: extractAxiosStatus(e) };
  }
};

export const resendRegisterEmailSafe = async (
  payload: ResendRegisterEmailRequest
): Promise<{ ok: true; data: RegisterClassicResponse } | { ok: false; status: number }> => {
  try {
    const data = await resendRegisterEmail(payload);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, status: extractAxiosStatus(e) };
  }
};
