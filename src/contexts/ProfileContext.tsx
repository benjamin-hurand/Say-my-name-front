import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { User } from '../models/commons/User';
import { ProfileResponseDto } from '../services/dto/ProfileResponseDto';
import { getProfile } from '../services/business/profile/profile.service';
import { Profile } from '../models/commons/Profile';
import { ChangeRequestSummary } from '../models/commons/Profile/ChangeRequest';

interface ProfileContextProps {
  user: User | null;
  profile: Profile | null;
  changeRequests: ChangeRequestSummary[];                       // ← NEW
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setChangeRequests: React.Dispatch<React.SetStateAction<ChangeRequestSummary[]>>; // ← NEW
}

const ProfileContext = createContext<ProfileContextProps>({
  user: null,
  profile: null,
  changeRequests: [],            // ← NEW
  loading: true,
  error: null,
  refreshProfile: async () => {},
  setProfile: () => {},
  setChangeRequests: () => {},   // ← NEW
});

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestSummary[]>([]); // ← NEW
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!token || !isAuthenticated) {
      setProfile(null);
      setChangeRequests([]);     // ← reset CR si non auth
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res: ProfileResponseDto = await getProfile();
      setProfile(res.person ?? null);
      setChangeRequests(res.changeRequests ?? []); // ← NEW
      setError(null);
    } catch (err) {
      setProfile(null);
      setChangeRequests([]);     // ← éviter un état sale
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
    <ProfileContext.Provider
      value={{
        user,
        profile,
        changeRequests,      // ← NEW
        loading,
        error,
        refreshProfile,
        setProfile,
        setChangeRequests,   // ← NEW
      }}
    >
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
