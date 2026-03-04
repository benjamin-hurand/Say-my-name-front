import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, CssBaseline, Box, Avatar, Typography, TextField, Button, Alert, IconButton
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { requestPasswordReset } from '../../services/security/Auth.service';
import { notifySuccess } from '../../services/notification/toast.service';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme, changeColor } = useThemeColorContext();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    changeColor(theme === 'dark' ? '#ffffff' : '#000000');
  }, [theme, changeColor]);

  const handleBack = () => {
    // Retour à la page précédente si possible, sinon vers la page de login
    if (window.history.length > 1) navigate(-1);
    else navigate('/signin'); // ajuste si ta route de connexion est différente
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setDone(true);
      notifySuccess('If an account exists, an email has been sent.');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />

      {/* Barre de retour */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <IconButton aria-label="Back" onClick={handleBack}>
          <ArrowBackIosNewIcon />
        </IconButton>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1 }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" className="title" sx={{ mb: 1 }}>
          Forgot your password?
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, opacity: 0.85, textAlign: 'center' }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </Typography>

        <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {done ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                If an account exists, an email has been sent.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 1 }}
                onClick={() => navigate('/signin')} // CTA direct vers login
              >
                Back to sign in
              </Button>
            </>
          ) : (
            <>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
              />
              <Button
                disabled={submitting}
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </Button>

              {/* Lien bas de page pour revenir si l'utilisateur change d'avis */}
              <Button
                onClick={() => navigate('/signin')}
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
              >
                Back to sign in
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
}
