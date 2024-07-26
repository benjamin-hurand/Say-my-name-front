import React, { useRef } from 'react';
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
import { generate, register, registerWithGoogle } from '../../services/security/Auth.service';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../sign-in/Signin.style.css'; // Import the custom CSS file

const defaultTheme = createTheme();

export default function SignUp(): JSX.Element {
  const [username, setUsername] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [errorMessagePassword, setErrorMessagePassword] = React.useState<string>('');
  const [errorMessageUsername, setErrorMessageUsername] = React.useState<string>('');
  const navigate = useNavigate();
  const googleLoginRef = useRef<HTMLDivElement>(null);

  // Generate a random username
  React.useEffect(() => {
    const fetchUsername = async () => {
      try {
        const initialUsername = await generate('english'); 
        setUsername(initialUsername);
      } catch (error) {
        console.error('Failed to fetch initial username:', error);
      }
    };

    fetchUsername();
  }, []);

  function isValidUsername(username: string): boolean {
    const validUsernameRegex = /^[a-zA-Z0-9-]{3,24}$/;
    return validUsernameRegex.test(username);
  }

  function isValidEmail(email: string): boolean {
    const validEmailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return validEmailRegex.test(email);
  }

  function isValidPassword(password: string): boolean {
    const validRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');
    return validRegex.test(password);
  }

  const handleUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (newUsername && isValidUsername(newUsername)) {
      setErrorMessageUsername('');
    }
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail && isValidEmail(newEmail)) {
      setErrorMessage('');
    }
  };

  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword && isValidPassword(newPassword)) {
      setErrorMessagePassword('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setErrorMessage('Invalid email format. Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setErrorMessagePassword('Password must contain at least 8 characters, including upper, lower, numbers, and special characters (@, $, !, %, *, ?, &).');
      return;
    }

    try {
      const response = await register({ username, email, password });
      switch (response) {
        case 201:
          alert('Registration successful! Check your email to confirm your account.');
          navigate('/');
          break;
        case 409:
          setErrorMessage('Email already exists.');
          break;
        default:
          setErrorMessage('Registration failed due to server error. Please contact us.');
      }
    } catch (error) {
      console.error('Failed to register:', error);
      setErrorMessage('Failed to register due to a network or server issue.');
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
      const apiResponse = await registerWithGoogle(googleResponse);
      console.log("Response back after google: ", apiResponse);
      localStorage.setItem('token', googleResponse.credential);
      localStorage.setItem('roles', "ROLE_USER"); // to be fetched from apis
      toast.success("Successfully connected.");
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
      console.error('Failed to login with google', error);
    }
  };

  const handleError = () => {
    console.error('Login Failed:');
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
            Create an account
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              value={username}
              onInput={handleUsernameInput}
              onBlur={() => username && !isValidUsername(username) && setErrorMessageUsername('Invalid username format. Please enter a valid username.')}
              error={!!errorMessageUsername}
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              className="neon-textfield"
            />
            {errorMessageUsername && (
              <Alert severity="error" className="neon-alert">
                <Typography color="error">
                  {errorMessageUsername}
                </Typography>
              </Alert>
            )}
            <TextField
              value={email}
              onInput={handleEmailInput}
              onBlur={() => email && !isValidEmail(email) && setErrorMessage('Invalid email format. Please enter a valid email address.')}
              error={!!errorMessage}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              className="neon-textfield"
            />
            {errorMessage && (
              <Alert severity="error" className="neon-alert">
                <Typography color="error">
                  {errorMessage}
                </Typography>
              </Alert>
            )}
            <TextField
              value={password}
              onInput={handlePasswordInput}
              onBlur={() => password && !isValidPassword(password) && setErrorMessagePassword('Password must contain at least 8 characters, including upper, lower, numbers, and special characters (@, $, !, %, *, ?, &).')}
              error={!!errorMessagePassword}
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              className="neon-textfield"
            />
            {errorMessagePassword && (
              <Alert severity="error" className="neon-alert">
                <Typography color="error">
                  {errorMessagePassword}
                </Typography>
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              className="neon-button"
            >
              Create an account
            </Button>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              sx={{ mt: 2, mb: 2 }}
              className="neon-button"
              onClick={() => {googleLoginRef.current?.click(); console.log("click")}}
            >
              Continue with Google
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <a
                  onClick={() => navigate("/signin")}
                  style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Already have an account? Sign In
                </a>
              </Grid>
            </Grid>
            <div className="google-login-container">
              <GoogleLogin 
                onSuccess={handleSuccess} 
                onError={handleError}
                useOneTap={true} // Optional, for one-tap login
                width="100%"
                size="large"
                theme="filled_black"
                shape="rectangular"
                text="continue_with"
                logo_alignment="left"
              />
            </div>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
