import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext'; // Ajuster le path si besoin
import { User } from '../models/commons/User';
import { ProfileResponseDto } from '../services/dto/ProfileResponseDto';
import { getProfile } from '../services/business/profile/profile.service';
import { Profile } from '../models/commons/Profile';

interface ProfileContextProps {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextProps>({
  user: null,
  profile: null,
  loading: false,
  error: null,
  refreshProfile: async () => {},
});

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!token || !user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const profile: ProfileResponseDto = await getProfile();
      setProfile(profile.person);
      setError(null);
    } catch (err) {
      // En cas d'erreur API (token invalide, pas de profil, etc.)
      setProfile(null);
      setError(err as Error);
      // Optionnel : logout() si err indique un problème d'authent
      // if ((err as any).response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [token, isAuthenticated, user]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <ProfileContext.Provider value={{ user, profile, loading, error, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextProps => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext;
