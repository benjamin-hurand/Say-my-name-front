// src/contexts/ProfileContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  ProfileResponseDto,
  ProfileOnboardingDto,
} from "../services/dto/ProfileResponseDto";
import { getProfile } from "../services/business/profile/profile.service";
import { PersonDto } from "../models/commons/PersonDto";
import { ChangeRequestSummary } from "../models/commons/Profile/ChangeRequest";
import { User } from "../models/commons/User";

interface ProfileContextProps {
  /** User du profil (dérivé de profileResponse.user) */
  user: User | null;

  /** XP courant du user (source de vérité UI) */
  xp: number;
  rank: number | null;
  lastXpEventAt: string | null;

  /** Person complète (profil “public” dans l’orga : photos, attributes…) */
  profile: PersonDto | null;

  /** Onboarding / capabilities : utile surtout quand profile == null */
  onboarding: ProfileOnboardingDto | null;

  /** Change Requests (en attente) */
  changeRequests: ChangeRequestSummary[];
  hasPendingChangeRequests: boolean;

  loading: boolean;
  error: Error | null;

  refreshProfile: () => Promise<void>;

  /** Helpers XP (optimistic) */
  setXp: (xp: number) => void;
  addXp: (delta: number) => void;

  setProfile: React.Dispatch<React.SetStateAction<PersonDto | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setOnboarding: React.Dispatch<
    React.SetStateAction<ProfileOnboardingDto | null>
  >;
  setChangeRequests: React.Dispatch<React.SetStateAction<ChangeRequestSummary[]>>;
}

const ProfileContext = createContext<ProfileContextProps>({
  user: null,
  xp: 0,
  rank: null,
  lastXpEventAt: null,
  profile: null,
  onboarding: null,
  changeRequests: [],
  hasPendingChangeRequests: false,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  setXp: () => {},
  addXp: () => {},
  setProfile: () => {},
  setUser: () => {},
  setOnboarding: () => {},
  setChangeRequests: () => {},
});

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [userState, setUser] = useState<User | null>(null);
  const [xp, setXpState] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);
  const [lastXpEventAt, setLastXpEventAt] = useState<string | null>(null);

  const [profile, setProfile] = useState<PersonDto | null>(null);
  const [onboarding, setOnboarding] = useState<ProfileOnboardingDto | null>(
    null
  );

  const [changeRequests, setChangeRequests] = useState<ChangeRequestSummary[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const resetStateUnauthed = useCallback(() => {
    setUser(null);
    setXpState(0);
    setRank(null);
    setLastXpEventAt(null);
    setProfile(null);
    setOnboarding(null);
    setChangeRequests([]);
    setLoading(false);
    setError(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      resetStateUnauthed();
      return;
    }

    setLoading(true);
    try {
      const res: ProfileResponseDto = await getProfile();

      // contrat stable
      setUser(res.user ?? null);
      setProfile(res.person ?? null);
      setChangeRequests(res.changeRequests ?? []);

      // onboarding : seulement utile si res.person == null, mais on reste défensif
      setOnboarding(res.person ? null : res.onboarding ?? null);

      // XP: on essaye de le récupérer si le backend le fournit quelque part
      // - si tu l’ajoutes plus tard, ça s’activera sans refacto
      const anyRes = res as any;
      const nextRankRaw = anyRes?.xpSummary?.rank ?? null;
      const nextRank =
        nextRankRaw != null && Number.isFinite(Number(nextRankRaw)) && Number(nextRankRaw) > 0
          ? Math.trunc(Number(nextRankRaw))
          : null;

      setRank(nextRank);

      const nextLast = anyRes?.xpSummary?.lastEventAt ?? null;
      setLastXpEventAt(typeof nextLast === "string" ? nextLast : null);
      // ✅ Source de vérité : xpSummary (si présent)
      const nextXpRaw =
        anyRes?.xpSummary?.xp ??
        anyRes?.user?.xp ??
        anyRes?.xp ??
        anyRes?.leaderboard?.myXp ??
        anyRes?.stats?.xp ??
        0;

      const nextXp =
        nextXpRaw != null && Number.isFinite(Number(nextXpRaw))
          ? Math.max(0, Math.trunc(Number(nextXpRaw)))
          : 0;

      setXpState(nextXp);


      setError(null);
    } catch (err) {
      // En cas d'erreur, on reset pour éviter d'afficher des infos stale
      setUser(null);
      setXpState(0);
      setProfile(null);
      setOnboarding(null);
      setChangeRequests([]);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, resetStateUnauthed]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const hasPendingChangeRequests = (changeRequests?.length ?? 0) > 0;

  // --- Helpers XP (optimistic) ---
  const setXp = useCallback((value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    setXpState(safe);
  }, []);

  const addXp = useCallback((delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    const d = Math.trunc(delta);
    setXpState((prev) => Math.max(0, prev + d));
  }, []);

  // Stabilité de ref si tu y tiens
  const user: User | null = useMemo(() => userState, [userState]);

  return (
    <ProfileContext.Provider
      value={{
        user,
        xp,
        rank,
        lastXpEventAt,
        profile,
        onboarding,
        changeRequests,
        hasPendingChangeRequests,
        loading,
        error,
        refreshProfile,
        setXp,
        addXp,
        setProfile,
        setUser,
        setOnboarding,
        setChangeRequests,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextProps => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export default ProfileContext;
