import * as React from 'react';
import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, IconButton, LinearProgress, Box, Typography
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { changePassword } from '../../../services/security/Auth.service';
import { notifySuccess } from '../../../services/notification/toast.service';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

const MIN_LEN = 12;

export default function ChangePasswordDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth(); // doit exister dans ton AuthContext, sinon fallback localStorage
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const strength = Math.min(100, Math.round((next.length / 18) * 100));

  const validate = (): string | null => {
    if (!current) return 'Please enter your current password.';
    if (next.length < MIN_LEN) return `New password must be at least ${MIN_LEN} characters.`;
    if (next !== confirm) return 'Passwords do not match.';
    if (next === current) return 'New password must be different from the current one.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    try {
      await changePassword(current, next);
      notifySuccess('Password updated. Please sign in again.');
      // Invalidation côté back via passwordVersion → on déconnecte côté front
      if (logout) logout();
      else localStorage.removeItem('token');
      onClose();
      navigate('/login');
    } catch (ex: any) {
      // Tentative de message précis
      if (ex?.response?.status === 403) {
        setError('Current password is incorrect.');
      } else if (ex?.response?.status === 400) {
        setError(ex.response.data?.message || 'Password policy not met.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetStateAndClose = () => {
    setCurrent(''); setNext(''); setConfirm('');
    setShowCurrent(false); setShowNext(false); setShowConfirm(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={resetStateAndClose} fullWidth maxWidth="xs">
      <DialogTitle>Change password</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
            After changing your password, you&apos;ll be logged out for security.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            margin="dense"
            fullWidth
            label="Current password"
            type={showCurrent ? 'text' : 'password'}
            value={current}
            onChange={(e) => { setCurrent(e.target.value); if (error) setError(''); }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowCurrent(v => !v)} edge="end">
                  {showCurrent ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          <TextField
            margin="dense"
            fullWidth
            label="New password"
            type={showNext ? 'text' : 'password'}
            value={next}
            onChange={(e) => { setNext(e.target.value); if (error) setError(''); }}
            helperText={`Minimum ${MIN_LEN} characters`}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowNext(v => !v)} edge="end">
                  {showNext ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          <LinearProgress variant="determinate" value={strength} sx={{ mt: 0.5, mb: 1 }} />

          <TextField
            margin="dense"
            fullWidth
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (error) setError(''); }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowConfirm(v => !v)} edge="end">
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={resetStateAndClose} disabled={submitting} variant="text">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} variant="contained">
            {submitting ? 'Saving…' : 'Update'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
