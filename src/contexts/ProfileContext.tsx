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
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

const ProfileContext = createContext<ProfileContextProps>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  setProfile: () => {},
});

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!token || !isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);                                      // <- remet à true avant chaque fetch
    try {
      const res: ProfileResponseDto = await getProfile();
      setProfile(res.person);
      console.log("Fetched profile:", res.person);
      setError(null);
    } catch (err) {
      setProfile(null);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token, isAuthenticated, user]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <ProfileContext.Provider value={{ user, profile, loading, error, refreshProfile, setProfile }}>
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
