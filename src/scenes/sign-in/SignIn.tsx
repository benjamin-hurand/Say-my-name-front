import * as React from 'react';
import { NavigateFunction, useNavigate, useSearchParams } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { AuthResponse, login as loginAPI, loginWithGoogle } from '../../services/security/Auth.service'; 
import axios from 'axios';
import { Alert, IconButton } from '@mui/material';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { notifySuccess } from '../../services/notification/toast.service';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import { FooterAuth } from '../../components/layout/components/footer/Footer_auth';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SignIn() {
  const { theme, changeColor, randomizeColor } = useThemeColorContext();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
	const navigate: NavigateFunction = useNavigate();
  const handleInputChange = () => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  React.useEffect(() => {
    if (theme === 'dark') {
      changeColor('#ffffff');
    } else {
      changeColor('#000000');
    }
  }, [theme, changeColor]);

  const handleTogglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSuccess = async (googleResponse: CredentialResponse) => {
    console.log('Login Success:', googleResponse);
    if (!googleResponse.credential) {
      setErrorMessage('Google login failed: No credential received.');
      console.error('Google login failed: No credential received.');
      return;
    }

    try {
      const apiResponse: AuthResponse = await loginWithGoogle(googleResponse);
      console.log("Response back after google:", apiResponse);
      login(apiResponse.bearerToken, {
        id: apiResponse.userId,
        username: apiResponse.username,
        email: apiResponse.email,
        roles: apiResponse.roles,
        srsAlgorithm: apiResponse.srsAlgorithm
      });
      notifySuccess('Successfully connected.');
      console.log('Successfully connected with Google:', apiResponse);
      randomizeColor();
      navigate('/');
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
      const response: AuthResponse = await loginAPI({
        identifier: data.get('identifier') as string,
        password: data.get('password') as string,
      });
      login(response.bearerToken, {
        id: response.userId,
        username: response.username,
        email: response.email,
        roles: response.roles,
        srsAlgorithm: response.srsAlgorithm
      });
      notifySuccess('Successfully connected.');
      randomizeColor();
      navigate('/');
    } catch (error) {
      let message = 'An error occurred. Please try again.';
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        if (statusCode === 401) {
          message = 'Authentication failed: Incorrect email or password.';
        } else if (statusCode === 500) {
          message = 'Server error. Please try again later.';
        } else if (statusCode === 418) { // Handle the 418 I_AM_A_TEAPOT status code
          message = 'Email not verified. Please check your inbox for a verification link.';
        }
      } else {
        message = 'Please check your network and try again.';
      }
      setErrorMessage(message);
      console.error('Failed to login', error);
    }
  };

  return (
    <Container component="main" maxWidth="xs" style={{ border: "3px", borderColor: '#ffffff' }}>
      <CssBaseline />
      <Box
        sx={{
          marginTop: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
         <Avatar
         className="auth"
          sx={{
            m: 1,
            }}
        >
            <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" className="title">
          Log in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            onChange={handleInputChange}
            margin="normal"
            fullWidth
            id="identifier"
            label="Email or Username"
            name="identifier"
            autoComplete="email"
            autoFocus
          />
          <TextField
            onChange={handleInputChange}
            margin="dense"
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  sx={{ color: '#ffffff90', boxShadow: 'none' }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
            {errorMessage && (
              <div id="errorMessage">
                <Alert severity="error" sx={{ bgcolor: '#362424', color: 'rgb(255, 187, 0)', boxShadow: '0 0 1px #a50000, 0 0 2px #a50000, 0 0 3px #a50000, 0 0 4px #a50000', border: '1px solid #a50000' }}>
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
            sx={{ my: 2 }}
          >
            Sign In
          </Button>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
            or
          </Typography>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            type="standard"
            theme={theme === "dark" ? "outline" : "filled_black"}
            size="large"
            text="signin_with"
            shape="rectangular"
            logo_alignment="center"
            width="10000"
            locale="en"
            useOneTap={false}
            cancel_on_tap_outside={true}
            auto_select={true}
            ux_mode="popup"
            context="signin"
            itp_support={true}
            use_fedcm_for_prompt={true}
          />
          <Grid container sx={{ mt: 2 }}>
            <Grid item xs>
            </Grid>
            <Grid item>
              <a
                onClick={() => navigate("/signup")}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                Don't have an account? Sign Up
              </a>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <FooterAuth />
    </Container>
  );
}
