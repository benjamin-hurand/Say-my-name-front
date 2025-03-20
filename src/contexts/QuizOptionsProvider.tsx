// QuizOptionsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Attribute } from '../models/commons/Attribute';
import { GameFilter } from '../models/commons/Game/GameOptions/GameFilter.model';
import { GameRepetitionPattern } from '../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameSortBy } from '../models/commons/Game/GameOptions/GameSortBy.model';

interface QuizOptionsContextType {
  // Filters
  openFilterModal: boolean;
  setOpenFilterModal: (open: boolean) => void;
  availableFilters: Attribute[];
  setAvailableFilters: (filters: Attribute[]) => void;
  tempSelectedFilters: GameFilter[];
  setTempSelectedFilters: (filters: GameFilter[]) => void;
  // Sorting methods
  openSortModal: boolean;
  setOpenSortModal: (open: boolean) => void;
  availableSorts: Attribute[];
  setAvailableSorts: (sorts: Attribute[]) => void;
  tempSelectedSortingMethods: GameSortBy[];
  setTempSelectedSortingMethods: (sorts: GameSortBy[]) => void;
  // Repetition options
  tempSelectedRepetitionPattern: GameRepetitionPattern;
  setTempSelectedRepetitionPattern: (pattern: GameRepetitionPattern) => void;
  repeatSettings: {
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  };
  setRepeatSettings: (settings: {
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  }) => void;
  // Helps and other options
  tempSelectedHelps: { [key: string]: boolean };
  setTempSelectedHelps: (helps: { [key: string]: boolean }) => void;
  // Pour la gestion des modales d'édition
  editingFilter?: GameFilter;
  setEditingFilter: (filter: GameFilter | undefined) => void;
  editingSort?: GameSortBy;
  setEditingSort: (sort: GameSortBy | undefined) => void;
  // Détection des changements critiques
  hasCriticalChanges: boolean;
}

const QuizOptionsContext = createContext<QuizOptionsContextType | undefined>(undefined);

export const QuizOptionsProvider = ({ children }: { children: ReactNode }) => {
  // Initialisations (valeurs par défaut à adapter)
  const [openFilterModal, setOpenFilterModal] = useState<boolean>(false);
  const [availableFilters, setAvailableFilters] = useState<Attribute[]>([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState<GameFilter[]>([]);
  
  const [openSortModal, setOpenSortModal] = useState<boolean>(false);
  const [availableSorts, setAvailableSorts] = useState<Attribute[]>([]);
  const [tempSelectedSortingMethods, setTempSelectedSortingMethods] = useState<GameSortBy[]>([]);
  
  const [tempSelectedRepetitionPattern, setTempSelectedRepetitionPattern] = useState<GameRepetitionPattern>(
    // Par exemple, le pattern "never"
    { patternName: 'never', initialEasinessFactor: 2.5, initialInterval: 1, secondInterval: 6 }
  );
  const [repeatSettings, setRepeatSettings] = useState<{
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  }>({
    initialEasinessFactor: 2.5,
    initialInterval: 1,
    secondInterval: 6,
  });
  
  const [tempSelectedHelps, setTempSelectedHelps] = useState<{ [key: string]: boolean }>({
    typosFriendly: false,
    initialGiven: false,
  });
  
  const [editingFilter, setEditingFilter] = useState<GameFilter | undefined>(undefined);
  const [editingSort, setEditingSort] = useState<GameSortBy | undefined>(undefined);

  // Pour le calcul de "hasCriticalChanges", c'est à adapter en fonction de ta logique
  // Par exemple, si les options temporaires diffèrent des options validées
  const hasCriticalChanges = false; // À implémenter selon ta logique

  return (
    <QuizOptionsContext.Provider
      value={{
        openFilterModal,
        setOpenFilterModal,
        availableFilters,
        setAvailableFilters,
        tempSelectedFilters,
        setTempSelectedFilters,
        openSortModal,
        setOpenSortModal,
        availableSorts,
        setAvailableSorts,
        tempSelectedSortingMethods,
        setTempSelectedSortingMethods,
        tempSelectedRepetitionPattern,
        setTempSelectedRepetitionPattern,
        repeatSettings,
        setRepeatSettings,
        tempSelectedHelps,
        setTempSelectedHelps,
        editingFilter,
        setEditingFilter,
        editingSort,
        setEditingSort,
        hasCriticalChanges,
      }}
    >
      {children}
    </QuizOptionsContext.Provider>
  );
};

export const useQuizOptions = () => {
  const context = useContext(QuizOptionsContext);
  if (!context) {
    throw new Error("useQuizOptions must be used within a QuizOptionsProvider");
  }
  return context;
};
