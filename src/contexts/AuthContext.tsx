import React, { createContext, useState, useEffect, useContext } from "react";
import { loginWithGoogle, silentGoogleSignIn, verifyToken as verifyTokenApi } from "../services/security/Auth.service";
import { User } from "../models/commons/User";
import { CredentialResponse } from "@react-oauth/google";

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

   // Fonction de vérification du token auprès du backend
   const verifyTokenn = async (currentToken: string) => {
    try {
      // Remplacez '/api/verify-token' par l’endpoint réel de vérification
      await verifyTokenApi(currentToken);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Fonction pour tenter une auto-reconnexion avec Google
  const autoReconnectWithGoogle = async () => {
    try {
      // On suppose ici que vous avez configuré Google Identity Services
      // et que vous disposez d'une fonction utilitaire pour tenter une reconnexion silencieuse.
      // Par exemple, en utilisant « prompt: 'none' » ou le One Tap de Google.
      const googleResponse: CredentialResponse = await silentGoogleSignIn();
      if (googleResponse?.credential) {
        // On utilise ici votre service existant (loginWithGoogle) pour récupérer les infos utilisateur
        const apiResponse = await loginWithGoogle(googleResponse);
        // Stockage du token et des infos utilisateur dans le context et le localStorage
        login(apiResponse.bearerToken, {
          id: apiResponse.userId, // en fonction de la réponse de votre API
          username: apiResponse.username,
          email: apiResponse.email,
          roles: apiResponse.roles,
          srsAlgorithm: apiResponse.srsAlgorithm, // Assurez-vous que votre API renvoie cette info
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-reconnexion avec Google échouée:", error);
      return false;
    }
  };

  // Effet au montage pour vérifier la validité du token
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        const valid = await verifyTokenn(token);
        if (!valid) {
          // Si le token n'est plus valide, tentez l'auto-reconnexion via Google
          const reconnected = await autoReconnectWithGoogle();
          if (!reconnected) {
            // Si l'auto-reconnexion échoue, déconnectez l'utilisateur
            logout();
          }
        }
      }
    };

    checkSession();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
