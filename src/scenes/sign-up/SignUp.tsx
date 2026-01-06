// src/scenes/sign-up/SignUp.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  Alert,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Visibility, VisibilityOff, CheckCircle } from "@mui/icons-material";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import { NavigateFunction, useNavigate, useSearchParams } from "react-router-dom";

import {
  register,
  registerWithGoogle,
  AuthResponseDto,
  RegisterClassicResponse,
} from "../../services/security/Auth.service";
import { notifySuccess } from "../../services/notification/toast.service";
import { FooterAuth } from "../../components/layout/components/footer/Footer_auth";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import { useAuth } from "../../contexts/AuthContext";
import { EmailVerificationKind } from "../../services/dto/auth/EmailVerificationDtos";

const PENDING_INVITATION_KEY = "invitation.pendingToken";

// Fallback sessionStorage pour la page OTP (si refresh, retour arrière, etc.)
const REGISTER_VERIFY_CONTEXT_KEY = "auth.register.verifyContext";

type VerifyEmailNavState = {
  email: string;
  verificationId: string;
  ttlMinutes?: number | null;
};

function redirectAfterAuth(navigate: NavigateFunction) {
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

// --- helpers ---
const debounce = <T extends unknown[]>(fn: (...args: T) => void, wait: number) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const isValidEmail = (email: string) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/i.test(email);

const isValidPassword = (password: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/.test(password);

/** Autorise lettres/chiffres/espace/._-' — 2..50 chars */
const isValidDisplayName = (name: string) =>
  /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ._\-']{2,50}$/.test(name.trim());

/** Déduit un displayName depuis l'email (partie locale) */
const suggestDisplayNameFromEmail = (email: string) => {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  if (!local) return "";
  const pretty = local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);
  return pretty
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
};

export default function SignUp(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { theme, changeColor, randomizeColor } = useThemeColorContext();
  const { login } = useAuth();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation/UI state
  const [emailStatus, setEmailStatus] = useState<"initial" | "valid" | "invalid" | "checking">("initial");
  const [passwordStatus, setPasswordStatus] = useState<"initial" | "valid" | "invalid" | "checking">("initial");
  const [displayNameStatus, setDisplayNameStatus] = useState<"initial" | "valid" | "invalid">("initial");

  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorGlobal, setErrorGlobal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingInvitation, setHasPendingInvitation] = useState(false);

  // Theming (comme avant)
  useEffect(() => {
    changeColor(theme === "dark" ? "#ffffff" : "#000000");
  }, [theme, changeColor]);

  // Contexte d'invitation éventuel (depuis /signup?token=...)
  useEffect(() => {
    if (token) {
      try {
        sessionStorage.setItem(PENDING_INVITATION_KEY, token);
      } catch {
        /* ignore */
      }
    }

    try {
      const stored = sessionStorage.getItem(PENDING_INVITATION_KEY);
      setHasPendingInvitation(!!(token || stored));
    } catch {
      setHasPendingInvitation(!!token);
    }
  }, [token]);

  // Live validations (debounced)
  const debounceCheckEmail = useCallback(
    debounce((value: string) => {
      if (!value) {
        setEmailStatus("initial");
        setErrorEmail("");
        return;
      }
      if (!isValidEmail(value)) {
        setEmailStatus("invalid");
        setErrorEmail("Invalid email format");
      } else {
        setEmailStatus("valid");
        setErrorEmail("");
      }
    }, 300),
    []
  );

  const debounceCheckPassword = useCallback(
    debounce((value: string) => {
      if (!value) {
        setPasswordStatus("initial");
        setErrorPassword("");
        return;
      }
      if (!isValidPassword(value)) {
        setPasswordStatus("invalid");
        setErrorPassword("Min 8 chars, with upper, lower, number and special char.");
      } else {
        setPasswordStatus("valid");
        setErrorPassword("");
      }
    }, 300),
    []
  );

  // Handlers
  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEmail(v);
    setEmailStatus("checking");
    setErrorGlobal("");

    if (!displayName.trim()) {
      const suggestion = suggestDisplayNameFromEmail(v);
      if (suggestion) {
        setDisplayName(suggestion);
        setDisplayNameStatus(isValidDisplayName(suggestion) ? "valid" : "invalid");
      }
    }
    debounceCheckEmail(v);
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    setPasswordStatus("checking");
    setErrorGlobal("");
    debounceCheckPassword(v);
  };

  const onDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDisplayName(v);
    setDisplayNameStatus(v.trim() ? (isValidDisplayName(v) ? "valid" : "invalid") : "initial");
    setErrorGlobal("");
  };

  const togglePassword = () => setShowPassword((s) => !s);

  const canSubmit =
    displayNameStatus === "valid" && emailStatus === "valid" && passwordStatus === "valid" && !isSubmitting;

  const persistVerifyContext = (ctx: VerifyEmailNavState) => {
    try {
      sessionStorage.setItem(REGISTER_VERIFY_CONTEXT_KEY, JSON.stringify(ctx));
    } catch {
      /* ignore */
    }
  };

  const clearPersistedVerifyContext = () => {
    try {
      sessionStorage.removeItem(REGISTER_VERIFY_CONTEXT_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorGlobal("");

    if (!canSubmit) {
      if (displayNameStatus !== "valid") setErrorGlobal("Please provide a valid display name (2–50 chars).");
      else if (emailStatus !== "valid") setErrorGlobal("Please provide a valid email.");
      else if (passwordStatus !== "valid") setErrorGlobal("Please provide a stronger password.");
      return;
    }

    try {
      setIsSubmitting(true);
      clearPersistedVerifyContext();

      // ✅ Nouveau : RegisterClassicResponse plat (plus de res.userId, plus de res.challenge)
      const res: RegisterClassicResponse = await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });

      const kind: EmailVerificationKind | null | undefined = res?.verificationKind;

      // Si le backend indique NONE, on ne peut pas vérifier (cas edge)
      // On redirige vers signin avec message.
      if (kind === "NONE" || res?.alreadyVerified) {
        notifySuccess("Email already verified. You can sign in.");
        navigate("/signin");
        return;
      }

      // Flow normal: OTP
      if (kind !== "OTP") {
        setErrorGlobal("Registration created, but verification step could not be started. Please try again.");
        return;
      }

      if (!res?.email || !res?.verificationId) {
        setErrorGlobal("Registration created, but verification data is missing. Please try again.");
        return;
      }

      notifySuccess("Account created. Enter the verification code sent to your email.");

      const state: VerifyEmailNavState = {
        email: res.email,
        verificationId: res.verificationId,
        ttlMinutes: res.ttlMinutes ?? undefined,
      };

      // ✅ persist fallback for refresh
      persistVerifyContext(state);

      // ✅ route publique recommandée
      navigate("/signup/verify-email", { state });
    } catch (error: unknown) {
      let message = "Network or server error. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const sc = error.response.status;
        if (sc === 409) message = "An account already exists with this email.";
        else if (sc === 400) message = "Invalid registration data.";
        else if (sc === 429) message = "Too many attempts. Please wait and try again.";
      }

      setErrorGlobal(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google
  const handleGoogleSuccess = async (googleResponse: CredentialResponse) => {
    if (!googleResponse?.credential) {
      setErrorGlobal("Google login failed: No credential received.");
      return;
    }
    try {
      const apiResponse: AuthResponseDto = await registerWithGoogle(googleResponse);
      login(apiResponse);
      notifySuccess("Successfully connected.");
      randomizeColor();
      redirectAfterAuth(navigate);
    } catch (error) {
      let message = "An error occurred. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        const sc = error.response.status;
        if (sc === 401) message = "Google authentication failed.";
        else if (sc === 500) message = "Server error. Please try again later.";
      }
      setErrorGlobal(message);
    }
  };

  const handleGoogleError = () => setErrorGlobal("Google sign-in failed. Please try again.");

  // Password strength hint (simple)
  const passwordHints = [
    { ok: password.length >= 8, label: "8+ characters" },
    { ok: /[A-Z]/.test(password), label: "1 uppercase" },
    { ok: /[a-z]/.test(password), label: "1 lowercase" },
    { ok: /\d/.test(password), label: "1 number" },
    { ok: /[@$!%*?&.]/.test(password), label: "1 special (@$!%*?&.)" },
  ];

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar sx={{ m: 1 }}>
          <LockOutlinedIcon />
        </Avatar>

        <Typography component="h1" variant="h5" className="title" sx={{ mb: 1 }}>
          Create your account
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 2, textAlign: "center" }}>
          Pick a display name. You can change it later in your profile.
        </Typography>

        {hasPendingInvitation && (
          <Alert severity="info" sx={{ mb: 2, width: "100%" }}>
            You followed an invitation link. After confirming your email and logging in, we’ll bring you back to your
            invitation so you can join the organisation.
          </Alert>
        )}

        {/* --- CTA Google en premier --- */}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          type="standard"
          theme={theme === "dark" ? "outline" : "filled_black"}
          size="large"
          text="continue_with"
          shape="rectangular"
          logo_alignment="center"
          width="10000"
          locale="en"
          useOneTap={false}
          cancel_on_tap_outside
          ux_mode="popup"
          context="signup"
          itp_support
          use_fedcm_for_prompt
        />

        <Divider sx={{ my: 3, width: "100%", opacity: 0.5 }}>or</Divider>

        {/* --- Formulaire email / password / displayName --- */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0, width: "100%" }}>
          <TextField
            value={displayName}
            onChange={onDisplayNameChange}
            margin="normal"
            required
            fullWidth
            id="displayName"
            label="Display name"
            name="displayName"
            inputProps={{ maxLength: 50 }}
            helperText={
              displayNameStatus === "invalid"
                ? "2–50 chars. Letters, numbers, spaces, . _ - '"
                : "This is how people will see your name."
            }
            error={displayNameStatus === "invalid"}
            InputProps={{
              endAdornment:
                displayNameStatus === "valid" ? (
                  <Tooltip title="Looks good">
                    <CheckCircle color="success" />
                  </Tooltip>
                ) : null,
            }}
          />

          <TextField
            value={email}
            onChange={onEmailChange}
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            error={!!errorEmail}
            helperText={errorEmail || "We’ll send a confirmation code."}
            InputProps={{
              endAdornment:
                emailStatus === "checking" ? (
                  <CircularProgress size={22} />
                ) : emailStatus === "valid" ? (
                  <Tooltip title="Valid email">
                    <CheckCircle color="success" />
                  </Tooltip>
                ) : null,
            }}
          />

          <TextField
            value={password}
            onChange={onPasswordChange}
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="new-password"
            error={!!errorPassword}
            helperText={errorPassword || "Use a strong password."}
            InputProps={{
              endAdornment: (
                <>
                  <IconButton onClick={togglePassword} sx={{ color: "#ffffff90" }} aria-label="toggle password visibility">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  {passwordStatus === "valid" ? (
                    <Tooltip title="Strong enough">
                      <CheckCircle color="success" />
                    </Tooltip>
                  ) : null}
                </>
              ),
            }}
          />

          {password && (
            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1, fontSize: 12, opacity: 0.9 }}>
              {passwordHints.map((h, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CheckCircle fontSize="small" color={h.ok ? "success" : "disabled"} />
                  <span style={{ color: h.ok ? "inherit" : "rgba(255,255,255,0.6)" }}>{h.label}</span>
                </Box>
              ))}
            </Box>
          )}

          {errorGlobal && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorGlobal}
            </Alert>
          )}

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={!canSubmit}>
            {isSubmitting ? <CircularProgress size={22} /> : "Create account"}
          </Button>

          <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
            <Grid item>
              <a onClick={() => navigate("/signin")} style={{ textDecoration: "underline", cursor: "pointer" }}>
                Already have an account? Sign in
              </a>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <FooterAuth />
    </Container>
  );
}
