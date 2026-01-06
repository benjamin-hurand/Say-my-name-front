// src/scenes/sign-up/VerifyEmailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ContentCopy, CheckCircle } from "@mui/icons-material";
import axios from "axios";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { notifySuccess } from "../../services/notification/toast.service";
import { FooterAuth } from "../../components/layout/components/footer/Footer_auth";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";

import {
  confirmRegisterEmail,
  resendRegisterEmail,
  AuthResponseDto,
  RegisterClassicResponse,
} from "../../services/security/Auth.service";
import { EmailVerificationKind } from "../../services/dto/auth/EmailVerificationDtos";

const PENDING_INVITATION_KEY = "invitation.pendingToken";
const REGISTER_VERIFY_CONTEXT_KEY = "auth.register.verifyContext";

type VerifyEmailLocationState = {
  email?: string;
  verificationId?: string;
  ttlMinutes?: number | null;
};

type PersistedVerifyContext = {
  email: string;
  verificationId: string;
  ttlMinutes?: number | null;
};

function redirectAfterAuth(navigate: (path: string) => void) {
  try {
    const pendingToken = sessionStorage.getItem(PENDING_INVITATION_KEY);
    if (pendingToken) {
      sessionStorage.removeItem(PENDING_INVITATION_KEY);
      navigate(`/invitation?token=${encodeURIComponent(pendingToken)}`);
    } else {
      navigate("/");
    }
  } catch {
    navigate("/");
  }
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

function readPersistedVerifyContext(): PersistedVerifyContext | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_VERIFY_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedVerifyContext;
    if (!parsed?.email || !parsed?.verificationId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function VerifyEmailPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { theme, changeColor } = useThemeColorContext();
  const { login } = useAuth();

  // Theming cohérent
  useEffect(() => {
    changeColor(theme === "dark" ? "#ffffff" : "#000000");
  }, [theme, changeColor]);

  // 1) state depuis navigate(...)
  const state = (location.state || {}) as VerifyEmailLocationState;

  // 2) query params (si tu veux supporter un lien type /verify-email?email=...&verificationId=...)
  const qpEmail = searchParams.get("email") ?? undefined;
  const qpVerificationId = searchParams.get("verificationId") ?? undefined;

  // 3) fallback sessionStorage (en cas de refresh)
  const persisted = readPersistedVerifyContext();

  const email = (state.email ?? qpEmail ?? persisted?.email ?? "").trim();
  const verificationId = (state.verificationId ?? qpVerificationId ?? persisted?.verificationId ?? "").trim();

  // ttlMinutes: priorité state > persisted (car venant de register)
  const ttlMinutes = state.ttlMinutes ?? persisted?.ttlMinutes ?? null;

  // UI state
  const [code, setCode] = useState("");
  const [errorGlobal, setErrorGlobal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Cooldown resend : aligné avec ton backend (30s)
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const missingCritical = !email || !verificationId;

  const canConfirm = useMemo(() => {
    return (
      !missingCritical &&
      !isSubmitting &&
      code.length === 6 &&
      /^\d{6}$/.test(code)
    );
  }, [missingCritical, isSubmitting, code]);

  const onCodeChange = (v: string) => {
    const digits = onlyDigits(v).slice(0, 6);
    setCode(digits);
    setErrorGlobal("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      notifySuccess("Code copied.");
    } catch {
      // ignore
    }
  };

  const handleConfirm = async () => {
    setErrorGlobal("");
    if (!canConfirm) return;

    try {
      setIsSubmitting(true);

      // ✅ Nouveau payload : plus de userId
      const auth: AuthResponseDto = await confirmRegisterEmail({
        email,
        verificationId,
        code,
      });

      login(auth);
      notifySuccess("Email verified. Welcome!");
      redirectAfterAuth(navigate);
    } catch (error: unknown) {
      let message = "Verification failed. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const sc = error.response.status;
        if (sc === 400) message = "Invalid code or invalid request.";
        else if (sc === 403) message = "This verification is not allowed.";
        else if (sc === 404) message = "Verification challenge not found.";
        else if (sc === 410) message = "This code has expired. Please request a new one.";
        else if (sc === 429) message = "Too many attempts. Please wait and try again.";
      }

      setErrorGlobal(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorGlobal("");
    if (missingCritical) return;
    if (cooldown > 0) return;

    try {
      setIsResending(true);

      // ✅ Nouveau payload : plus de userId
      const res: RegisterClassicResponse = await resendRegisterEmail({
        email,
        verificationId,
      });

      // Si le backend renvoie un nouveau verificationId (selon ta policy),
      // on doit l’adopter côté front.
      if (res?.verificationKind === ("OTP" as EmailVerificationKind) && res?.verificationId) {
        // Mettre à jour le persisted context pour rester cohérent en cas de refresh
        try {
          const next = {
            email: res.email ?? email,
            verificationId: res.verificationId,
            ttlMinutes: res.ttlMinutes ?? ttlMinutes,
          };
          sessionStorage.setItem(REGISTER_VERIFY_CONTEXT_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }

      notifySuccess("A new code has been sent.");
      setCooldown(30);
    } catch (error: unknown) {
      let message = "Unable to resend code. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const sc = error.response.status;
        if (sc === 410) message = "Challenge expired. Please restart signup.";
        else if (sc === 429) message = "Please wait before resending.";
      }

      setErrorGlobal(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar sx={{ m: 1 }}>
          <LockOutlinedIcon />
        </Avatar>

        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
          Verify your email
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2, textAlign: "center" }}>
          Enter the 6-digit code sent to:
          <br />
          <strong>{email || "your email"}</strong>
        </Typography>

        {ttlMinutes ? (
          <Alert severity="info" sx={{ width: "100%", mb: 2 }}>
            The code expires in about {ttlMinutes} minutes.
          </Alert>
        ) : null}

        {missingCritical && (
          <Alert severity="warning" sx={{ width: "100%", mb: 2 }}>
            This verification page is missing some information.
            <br />
            Please restart the signup flow from the sign up page.
          </Alert>
        )}

        <Divider sx={{ my: 2, width: "100%", opacity: 0.5 }} />

        <Box sx={{ width: "100%" }}>
          <TextField
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            margin="normal"
            fullWidth
            label="Verification code"
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 6,
              style: { letterSpacing: "0.35em", fontSize: 18, textAlign: "center" as const },
            }}
            helperText="6 digits"
            disabled={missingCritical}
            InputProps={{
              endAdornment:
                code.length === 6 ? (
                  <Tooltip title="Looks good">
                    <CheckCircle color="success" />
                  </Tooltip>
                ) : (
                  <Tooltip title="Copy code">
                    <IconButton onClick={handleCopy} edge="end" disabled={!code}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
            }}
          />

          {errorGlobal && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorGlobal}
            </Alert>
          )}

          <Button fullWidth variant="contained" sx={{ mt: 2 }} disabled={!canConfirm} onClick={handleConfirm}>
            {isSubmitting ? <CircularProgress size={22} /> : "Confirm and sign in"}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            disabled={missingCritical || isResending || cooldown > 0}
            onClick={handleResend}
          >
            {isResending ? (
              <CircularProgress size={18} />
            ) : cooldown > 0 ? (
              `Resend code (${cooldown}s)`
            ) : (
              "Resend code"
            )}
          </Button>

          <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate("/signup")}>
            Back to sign up
          </Button>

          <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => navigate("/signin")}>
            I already have an account, go to sign in
          </Button>
        </Box>
      </Box>

      <FooterAuth />
    </Container>
  );
}
