import axios from 'axios';
import API from '../api/apiUtils';
import { CredentialResponse } from '@react-oauth/google';
import { SrsAlgorithm } from '../../models/commons/User';

interface LoginCredentials {
    identifier: string;
    password: string;
}

interface SignupCredentials {
    username: string;
    email: string;
    password: string;
}

export interface SignupGoogleCredentials {
    username: string;
    email: string;
    credential?: string;
    clientId?: string;
    select_by?: string;
}

export interface AuthResponse {
    bearerToken: string;
    userId: number;
    username: string;
    email: string;
    roles: string;
    srsAlgorithm: SrsAlgorithm;
}

// interface UserDetails {
//     email: string;
//     roles: string;
// }

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await API.post<AuthResponse>('/auth/login', credentials);
    return response.data;
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem('token');
};

export const register = async (credentials: SignupCredentials): Promise<number> => {
    try {
        const response = await API.post('/auth/register', credentials);
        return response.status;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                return error.response.status;
            }
            console.error('Error during registration:', error.message);
            return 500;
        }
        console.error('Unexpected error during registration:', error);
        return 500;  
    }
}

export const registerWithGoogle = async (credentials: CredentialResponse): Promise<AuthResponse> => {
    try {
        const response = await API.post('/auth/google/register', credentials);
        return response.data;
    } catch (error) {
        // Handle error appropriately here
        console.error("Error sending Google token:", error);
        throw error;
    }
}

export const loginWithGoogle = async (LoginGoogleDto: CredentialResponse): Promise<AuthResponse> => {
    
    try {
        const response = await API.post<AuthResponse>("/auth/google/login",LoginGoogleDto);
        return response.data;
    } catch (error) {
        // Handle error appropriately here
        console.error("Error sending Google token:", error);
        throw error;
    }
};

export const silentGoogleSignIn = (): Promise<CredentialResponse> => {
  return new Promise((resolve, reject) => {
    // Cette implémentation dépendra de la bibliothèque que vous utilisez.
    // Si vous utilisez @react-oauth/google, vous pouvez
    // essayer d'utiliser ses hooks ou méthodes en mode "silent".
    // Voici un pseudo-code :
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: 'profile email',
      callback: (response: CredentialResponse) => {
        if (!response.credential) {
          reject(new Error('No credential received from Google.'));
        } else {
          resolve(response);
        }
      }
    });

    // Demande un jeton sans afficher de popup
    try {
      client.requestAccessToken({ prompt: 'none' });
    } catch (error) {
      reject(error);
    }
  });
};

export const verifyToken = async (token: string): Promise<boolean> => {
    try {
        const response = await API.get<boolean>('/auth/verify-token', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // Ici, response.data correspond au booléen renvoyé par le backend
        return response.data;
    } catch (error) {
        console.error('Failed to verify token:', error);
        return false;
    }
};


export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
        const response = await API.get<boolean>(`/usernames/isavailable/${username}`);
        return response.data;
    } catch (error) {
        console.error('Failed to verify username availability');
        throw error;
    }
}

export const generate = async (lang: string): Promise<string> => {
    try {
        const response = await API.get(`/usernames/generate/${lang}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch username:', error);
        throw error;
    }
}

// === Forgot / Reset Password ===
export const requestPasswordReset = async (email: string): Promise<void> => {
  await API.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await API.post('/auth/reset-password', { token, newPassword });
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await API.post('/auth/change-password', { currentPassword, newPassword });
};
