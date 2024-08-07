import React, { useState, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { generate, register, registerWithGoogle, checkUsernameAvailability } from '../../services/security/Auth.service';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CircularProgress from '@mui/material/CircularProgress';
import { Visibility, VisibilityOff, AutoAwesome } from '@mui/icons-material';
import { notifySuccess } from '../../services/notification/toast.service';
import { Divider } from '@mui/material';
import { FooterAuth } from '../../components/layout/components/footer/Footer_auth';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';

export default function SignUp(): JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [usernameFocused, setUsernameFocused] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorMessagePassword, setErrorMessagePassword] = useState<string>('');
  const [errorMessageUsername, setErrorMessageUsername] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<'initial' | 'valid' | 'invalid' | 'checking'>('initial');
  const [emailStatus, setEmailStatus] = useState<'initial' | 'valid' | 'invalid' | 'checking'>('initial');
  const [passwordStatus, setPasswordStatus] = useState<'initial' | 'valid' | 'invalid' | 'checking'>('initial');
  const [showEmailPasswordFields, setShowEmailPasswordFields] = useState<boolean>(false);
  const [showButtons, setShowButtons] = useState<boolean>(false);
  const navigate = useNavigate();
  const { theme, changeColor, randomizeColor } = useThemeColorContext();

  React.useEffect(() => {
    if (theme === 'dark') {
      changeColor('#ffffff');
    } else {
      changeColor('#000000');
    }
  }, [theme, changeColor]);

  function isValidUsername(username: string): boolean {
    const validUsernameRegex = /^[a-zA-Z0-9-]{3,24}$/;
    return validUsernameRegex.test(username) && !username.endsWith('-');
  }

  function isValidEmail(email: string): boolean {
    const validEmailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return validEmailRegex.test(email);
  }

  function isValidPassword(password: string): boolean {
    const validRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return validRegex.test(password);
  }

  const handleUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setErrorMessageUsername('');
    setUsernameStatus('checking');
    debounceCheckUsername(newUsername);
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setErrorMessage('');
    setEmailStatus('checking');
    debounceCheckEmail(newEmail);
  };

  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setErrorMessagePassword('');
    setPasswordStatus('checking');
    debounceCheckPassword(newPassword);
  };

  const handleUsernameFocus = () => setUsernameFocused(true);
  const handleUsernameBlur = () => setUsernameFocused(false);

  const handleEmailFocus = () => setEmailFocused(true);
  const handleEmailBlur = () => setEmailFocused(false);

  const handlePasswordFocus = () => setPasswordFocused(true);
  const handlePasswordBlur = () => setPasswordFocused(false);

  const handleTogglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (emailStatus !== 'valid') {
      setErrorMessage('Invalid email format. Please enter a valid email address.');
      return;
    }

    if (passwordStatus !== 'valid') {
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
      notifySuccess("Successfully connected.");
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
      console.error('Failed to login with google', error);
    }
  };

  const handleError = () => {
    console.error('Login Failed:');
  };

  // Debounce function to delay the API call
  const debounceCheckUsername = useCallback(debounce(async (username: string) => {
    if (!isValidUsername(username)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    try {
      const isAvailable = await checkUsernameAvailability(username);
      setUsernameStatus(isAvailable ? 'valid' : 'invalid');
      setShowButtons(isAvailable); // Show buttons if username is valid
    } catch (error) {
      console.error('Failed to check username availability:', error);
      setUsernameStatus('invalid');
      setShowButtons(false); // Hide buttons if there's an error
    }
  }, 500), []);

  const debounceCheckEmail = useCallback(debounce((email: string) => {
    if (!isValidEmail(email)) {
      setEmailStatus('invalid');
      return;
    }
    setEmailStatus('valid');
  }, 500), []);

  const debounceCheckPassword = useCallback(debounce((password: string) => {
    if (!isValidPassword(password)) {
      setPasswordStatus('invalid');
      return;
    }
    setPasswordStatus('valid');
  }, 500), []);

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1}}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" className='title'>
          Create an account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            value={username}
            onInput={handleUsernameInput}
            onFocus={handleUsernameFocus}
            onBlur={handleUsernameBlur}
            error={!!errorMessageUsername}
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            InputProps={{
              endAdornment: (
                <>
                  {usernameStatus === 'checking' && <CircularProgress size={24} />}
                  <Tooltip title="Generate a new random username">
                    <IconButton sx={{ color: 'white' }} onClick={async () => {
                      const newUsername = await generate('english');
                      setUsername(newUsername);
                      setErrorMessageUsername('');
                      setUsernameStatus('valid');
                      setShowButtons(true);
                    }}>
                      <AutoAwesome />
                    </IconButton>
                  </Tooltip>
                  {usernameStatus === 'valid' && <CheckCircleIcon style={{ color: 'green' }} />}
                  {usernameStatus === 'invalid' && <ErrorIcon style={{ color: 'red' }} />}
                </>
              )
            }}
          />
          {usernameFocused && (
            <Box sx={{ color: 'white', fontSize: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', color: username.length >= 3 && username.length <= 24 ? 'green' : 'red' }}>
                <CheckCircleIcon style={{ display: 'flex', alignItems: 'center', color: username.length >= 3 && username.length <= 24 ? 'green' : 'red' }} /> 3-24 characters
              </span>
              <span style={{ display: 'flex', alignItems: 'center', color: /^[a-zA-Z0-9-]*$/.test(username) ? 'green' : 'red' }}>
                <CheckCircleIcon style={{ display: 'flex', alignItems: 'center', color: /^[a-zA-Z0-9-]*$/.test(username) ? 'green' : 'red' }} /> Letters, numbers, and hyphens
              </span>
              <span style={{ display: 'flex', alignItems: 'center', color: !username.endsWith('-') ? 'green' : 'red' }}>
                <CheckCircleIcon style={{ display: 'flex', alignItems: 'center', color: !username.endsWith('-') ? 'green' : 'red' }} /> Cannot end with a hyphen
              </span>
            </Box>
          )}
          {errorMessageUsername && (
            <Alert severity="error" sx={{ bgcolor: '#362424', color: 'rgb(255, 187, 0)', boxShadow: '0 0 1px #a50000, 0 0 2px #a50000, 0 0 3px #a50000, 0 0 4px #a50000', border: '1px solid #a50000' }}>
              <Typography color="error">
                {errorMessageUsername}
              </Typography>
            </Alert>
          )}

          {showButtons && (
            <>
              <Divider sx={{ my: 2, width: '100%', bgcolor: 'gray' }} /> {/* Personnalisez le style selon vos besoins */}
              {!showEmailPasswordFields && (
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  className="signup-outlined-button"
                  onClick={() => setShowEmailPasswordFields(true)}
                >
                  Continue with email & password
                </Button>
              )}

              {showEmailPasswordFields && (
                <>
                  <TextField
                    value={email}
                    onInput={handleEmailInput}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    error={!!errorMessage}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    InputProps={{
                      endAdornment: (
                        <>
                          {emailStatus === 'checking' && <CircularProgress size={24} />}
                          {emailStatus === 'valid' && <CheckCircleIcon style={{ color: 'green' }} />}
                          {emailStatus === 'invalid' && <ErrorIcon style={{ color: 'red' }} />}
                        </>
                      )
                    }}
                  />
                  {emailFocused && (
                    <Box sx={{ color: 'white', fontSize: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: isValidEmail(email) ? 'green' : 'red' }}>
                        <CheckCircleIcon style={{ color: isValidEmail(email) ? 'green' : 'red' }} /> Valid email format
                      </span>
                    </Box>
                  )}
                  {errorMessage && (
                    <Alert severity="error" sx={{ bgcolor: '#362424', color: 'rgb(255, 187, 0)', boxShadow: '0 0 1px #a50000, 0 0 2px #a50000, 0 0 3px #a50000, 0 0 4px #a50000', border: '1px solid #a50000' }}>
                      <Typography color="error">
                        {errorMessage}
                      </Typography>
                    </Alert>
                  )}
                  <TextField
                    value={password}
                    onInput={handlePasswordInput}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    error={!!errorMessagePassword}
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <>
                          <IconButton
                            onClick={handleTogglePasswordVisibility}
                            sx={{ color: '#ffffff90' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                          {passwordStatus === 'valid' && <CheckCircleIcon style={{ color: 'green' }} />}
                          {passwordStatus === 'invalid' && <ErrorIcon style={{ color: 'red' }} />}
                        </>
                      )
                    }}
                  />
                  {passwordFocused && (
                    <Box sx={{ color: 'white', fontSize: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: password.length >= 8 ? 'green' : 'red' }}>
                        <CheckCircleIcon style={{ color: password.length >= 8 ? 'green' : 'red' }} /> 8 characters
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', color: /[A-Z]/.test(password) ? 'green' : 'red' }}>
                        <CheckCircleIcon style={{ color: /[A-Z]/.test(password) ? 'green' : 'red' }} /> 1 uppercase
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', color: /[a-z]/.test(password) ? 'green' : 'red' }}>
                        <CheckCircleIcon style={{ color: /[a-z]/.test(password) ? 'green' : 'red' }} /> 1 lowercase
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', color: /\d/.test(password) ? 'green' : 'red' }}>
                        <CheckCircleIcon style={{ color: /\d/.test(password) ? 'green' : 'red' }} /> 1 number
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', color: /[@$!%*?&]/.test(password) ? 'green' : 'red' }}>
                        <CheckCircleIcon style={{ color: /[@$!%*?&]/.test(password) ? 'green' : 'red' }} /> 1 special character
                      </span>
                    </Box>
                  )}
                  {errorMessagePassword && (
                    <Alert severity="error" sx={{ bgcolor: '#362424', color: 'rgb(255, 187, 0)', boxShadow: '0 0 1px #a50000, 0 0 2px #a50000, 0 0 3px #a50000, 0 0 4px #a50000', border: '1px solid #a50000' }}>
                      <Typography color="error">
                        {errorMessagePassword}
                      </Typography>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Create an account
                  </Button>
                </>
              )}
              <Typography variant="body1" sx={{ my: 1, textAlign: 'center' }}>
                or
              </Typography>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                type="standard"
                theme={theme === "dark" ? "outline" : "filled_black"}
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="center"
                width="10000"
                locale="en"
                useOneTap={false}
                cancel_on_tap_outside={true}
                auto_select={false}
                ux_mode="popup"
                context="signup"
                itp_support={true}
                use_fedcm_for_prompt={true}
              />
            </>
          )}
          <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
            <Grid item>
              <a
                onClick={() => navigate("/signin")}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                Already have an account? Sign In
              </a>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <FooterAuth />
    </Container>
  );
}

// Debounce function to delay API calls
function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

