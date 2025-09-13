import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, CssBaseline, Box, Avatar, Typography, TextField, Button, Alert, IconButton, LinearProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { resetPassword } from '../../services/security/Auth.service';
import { notifySuccess } from '../../services/notification/toast.service';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';

const MIN_LEN = 12;

export default function ResetPasswordPage() {
  const { theme, changeColor } = useThemeColorContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    changeColor(theme === 'dark' ? '#ffffff' : '#000000');
  }, [theme, changeColor]);

  const validate = (): string | null => {
    if (!token) return 'Missing or invalid reset token.';
    if (pwd.length < MIN_LEN) return `Password must be at least ${MIN_LEN} characters.`;
    if (pwd !== pwd2) return 'Passwords do not match.';
    return null;
    // (coté back: autres règles: ne pas contenir la partie locale de l'email, etc.)
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    try {
      await resetPassword(token, pwd);
      setDone(true);
      notifySuccess('Your password has been reset. You can now log in.');
      // Donne un souffle visuel puis redirige
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setError('This link is invalid or expired. Please request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  const strength = Math.min(100, Math.round((pwd.length / 18) * 100)); // simple gauge

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1 }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" className="title">
          Set a new password
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 2, opacity: 0.85, textAlign: 'center' }}>
          Choose a strong password (minimum {MIN_LEN} characters).
        </Typography>

        <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: '100%' }}>
          {!token && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Missing or invalid reset token. Please request a new link.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {done && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password changed successfully! Redirecting to login…
            </Alert>
          )}

          <TextField
            margin="normal"
            fullWidth
            id="password"
            name="password"
            label="New password"
            type={showPwd ? 'text' : 'password'}
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); if (error) setError(''); }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          <LinearProgress variant="determinate" value={strength} sx={{ mb: 1 }} />

          <TextField
            margin="normal"
            fullWidth
            id="password2"
            name="password2"
            label="Confirm new password"
            type={showPwd2 ? 'text' : 'password'}
            value={pwd2}
            onChange={(e) => { setPwd2(e.target.value); if (error) setError(''); }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPwd2((v) => !v)}>
                  {showPwd2 ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          <Button
            disabled={submitting || !token}
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
          >
            {submitting ? 'Saving…' : 'Update password'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
