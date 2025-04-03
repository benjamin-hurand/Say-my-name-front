import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ChallengeFilters, initialFilters } from '../scenes/challenges/menu/components/FilterAndSortBar.types';
import { getUserPerformances, UserPerformanceDto } from '../services/business/challenges/userPerformance.service';

interface ChallengesContextType {
  filters: ChallengeFilters;
  setFilters: (filters: ChallengeFilters) => void;
  performances: UserPerformanceDto[];
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export const ChallengesProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);
  const [performances, setPerformances] = useState<UserPerformanceDto[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getUserPerformances();
        setPerformances(fetched);
      } catch (error) {
        console.error("Erreur récupération des performances :", error);
      }
    })();
  }, []);

  return (
    <ChallengesContext.Provider value={{ filters, setFilters, performances }}>
      {children}
    </ChallengesContext.Provider>
  );
};

export const useChallenges = () => {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error("useChallenges must be used within a ChallengesProvider");
  }
  return context;
};
