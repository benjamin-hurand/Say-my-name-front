import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { login, loginWithGoogle } from '../../services/security/Auth.service'; 
import axios from 'axios';
import { Alert } from '@mui/material';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { notifySuccess } from '../../services/notification/toast.service';
import './Signin.style.css'; // Import the custom CSS file

const defaultTheme = createTheme();

export default function SignIn() {
  const [errorMessage, setErrorMessage] = React.useState('');
  const navigate = useNavigate();
  const googleLoginRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = () => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSuccess = async (googleResponse: CredentialResponse) => {
    console.log('Login Success:', googleResponse);
    if (!googleResponse.credential) {
      setErrorMessage('Google login failed: No credential received.');
      console.error('Google login failed: No credential received.');
      return;
    }

    try {
      const apiResponse = await loginWithGoogle(googleResponse);
      console.log("Response back after google:", apiResponse);
      localStorage.setItem('token', apiResponse.jwt.bearer);
      localStorage.setItem('roles', apiResponse.roles); 
      localStorage.setItem('email', apiResponse.email); 
      localStorage.setItem('username', apiResponse.username); 
      notifySuccess('Successfully connected.');
      navigate('/home');
    } catch (error) {
      let message = 'An error occurred. Please try again.';
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        if (statusCode === 401) {
          message = 'Authentication failed: Incorrect Google.';
        } else if (statusCode === 500) {
          message = 'Server error. Please try again later.';
        }
      } else {
        message = 'Please check your network and try again.';
      }
      setErrorMessage(message);
      console.error('Failed to login with Google', error);
    }
  };

  const handleError = () => {
    console.error('Login Failed');
    setErrorMessage('Google login failed. Please try again.');
  };

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  React.useEffect(() => {
    if (token) {
      console.log('Token received:', token);
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const response = await login({
        identifier: data.get('identifier') as string,
        password: data.get('password') as string,
      });
      localStorage.setItem('token', response.jwt.bearer);
      localStorage.setItem('roles', response.roles);
      notifySuccess('Successfully connected.');
      navigate('/persons');
    } catch (error) {
      let message = 'An error occurred. Please try again.';
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        if (statusCode === 401) {
          message = 'Authentication failed: Incorrect email or password.';
        } else if (statusCode === 500) {
          message = 'Server error. Please try again later.';
        }
      } else {
        message = 'Please check your network and try again.';
      }
      setErrorMessage(message);
      console.error('Failed to login', error);
    }
  };

  const handleGoogleLoginClick = () => {

  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#242424', boxShadow: '0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff, 0 0 5px #ffffff' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" className="neon-text">
            Log in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              onChange={handleInputChange}
              margin="normal"
              required
              fullWidth
              id="identifier"
              label="Email or Username"
              name="identifier"
              autoComplete="email"
              autoFocus
              className="neon-textfield"
            />
            <TextField
              onChange={handleInputChange}
              margin="dense"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              className="neon-textfield"
            />
             {errorMessage && (
                <div id="errorMessage">
                  <Alert severity="error" className="neon-alert">
                    <Typography color="error">
                      {errorMessage}
                    </Typography>
                  </Alert>
                </div>
              )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              className="neon-button"
            >
              Sign In
            </Button>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              sx={{ mt: 2 , mb: 2 }}
              className="neon-button"
              onClick={handleGoogleLoginClick}
            >
              Sign In With Google
            </Button>
            <Grid container>
              <Grid item xs>
              </Grid>
              <Grid item>
              <a
                onClick={() => navigate("/signup")}
                style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer', marginTop: '100px'}}
              >
                Don't have an account? Sign Up
              </a>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <div ref={googleLoginRef} style={{ display: 'true' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </Container>
    </ThemeProvider>
  );
}
