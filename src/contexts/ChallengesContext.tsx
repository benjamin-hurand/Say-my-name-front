// ChallengesContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { ChallengeFilters, defaultFilters } from '../scenes/challenges/menu/components/FilterAndSortBar.types';

interface ChallengesContextType {
  filters: ChallengeFilters;
  setFilters: (filters: ChallengeFilters) => void;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export const ChallengesProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<ChallengeFilters>(defaultFilters);

  return (
    <ChallengesContext.Provider value={{ filters, setFilters }}>
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
