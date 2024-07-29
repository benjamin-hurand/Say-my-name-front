import axios from 'axios';
import API from '../api/apiUtils';
import { CredentialResponse } from '@react-oauth/google';

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

interface AuthResponse {
    roles: string;
    jwt: {
        bearer: string;
    };
    username: string;
    email: string;
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
