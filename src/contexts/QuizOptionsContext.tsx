import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Attribute } from '../models/commons/Attribute/Attribute';
import { GameFilter } from '../models/commons/Game/GameOptions/GameFilter.model';
import { GameSortBy } from '../models/commons/Game/GameOptions/GameSortBy.model';
import { GameRepetitionPattern, repetitionPatterns } from '../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameMode } from '../models/commons/Game/GameMode/GameMode.model';
import { useOrgData } from './OrgDataContext';
import { GamePopulationScope } from '../models/commons/Game/GameOptions/GamePopulationScope.model';


interface QuizOptionsContextType {
  // Critical changes
  hasCriticalChanges: boolean;
  hasUncheckedCriticalChanges: boolean;
  setHasUncheckedCriticalChanges: React.Dispatch<React.SetStateAction<boolean>>;
  // Population
  selectedPopulationScope: GamePopulationScope;
  setSelectedPopulationScope: React.Dispatch<React.SetStateAction<GamePopulationScope>>;
  tempSelectedPopulationScope: GamePopulationScope;
  setTempSelectedPopulationScope: React.Dispatch<React.SetStateAction<GamePopulationScope>>;
  // Modes
  modes: GameMode[];
  tempSelectedMode: GameMode | null;
  setTempSelectedMode: React.Dispatch<React.SetStateAction<GameMode | null>>;
  selectedMode: GameMode | null;
  setSelectedMode: React.Dispatch<React.SetStateAction<GameMode | null>>;
  // Filters
  filters: Attribute[];
  availableFilters: Attribute[];
  selectedFilters: GameFilter[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<GameFilter[]>>;
  tempSelectedFilters: GameFilter[];
  setTempSelectedFilters: React.Dispatch<React.SetStateAction<GameFilter[]>>;
  // Sorting methods
  sorts: Attribute[];
  availableSorts: Attribute[];
  selectedSortingMethods: GameSortBy[];
  setSelectedSortingMethods: React.Dispatch<React.SetStateAction<GameSortBy[]>>;
  tempSelectedSortingMethods: GameSortBy[];
  setTempSelectedSortingMethods: React.Dispatch<React.SetStateAction<GameSortBy[]>>;
  // Repetition options
  selectedRepetitionPattern: GameRepetitionPattern;
  setSelectedRepetitionPattern: React.Dispatch<React.SetStateAction<GameRepetitionPattern>>;
  tempSelectedRepetitionPattern: GameRepetitionPattern;
  setTempSelectedRepetitionPattern: React.Dispatch<React.SetStateAction<GameRepetitionPattern>>;
  repeatSettings: {
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  };
  setRepeatSettings: React.Dispatch<
    React.SetStateAction<{
      initialEasinessFactor: number;
      initialInterval: number;
      secondInterval: number;
    }>
  >;
  // Progress
  saveProgress: boolean;
  setSaveProgress: React.Dispatch<React.SetStateAction<boolean>>;
  // Helps and other options
  selectedHelps: { [key: string]: boolean };
  setSelectedHelps: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  tempSelectedHelps: { [key: string]: boolean };
  setTempSelectedHelps: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  // Pour la gestion des modales d'édition
  editingFilter?: GameFilter;
  setEditingFilter: (filter: GameFilter | undefined) => void;
  editingSort?: GameSortBy;
  setEditingSort: (sort: GameSortBy | undefined) => void;
}

const QuizOptionsContext = createContext<QuizOptionsContextType | undefined>(undefined);

export const QuizOptionsProvider = ({ children }: { children: ReactNode }) => {
  // Population
  const [selectedPopulationScope, setSelectedPopulationScope] = useState<GamePopulationScope>('ALL');
  const [tempSelectedPopulationScope, setTempSelectedPopulationScope] = useState<GamePopulationScope>('ALL');
  
  // Modes, filters, sorts
  const { filters, sorts, modes } = useOrgData();
  // Modes
  const [tempSelectedMode, setTempSelectedMode] = useState<GameMode | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  
  // Filters
  const [selectedFilters, setSelectedFilters] = useState<GameFilter[]>([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState<GameFilter[]>([]);
  const availableFilters: Attribute[] = useMemo(() => {
      return filters.filter(attr => 
        !tempSelectedFilters.some(selected => selected.attribute.id === attr.id)
      );
    }, [filters, tempSelectedFilters]);
  
  // Sorting methods
  const [selectedSortingMethods, setSelectedSortingMethods] = useState<GameSortBy[]>([]);
  const [tempSelectedSortingMethods, setTempSelectedSortingMethods] = useState<GameSortBy[]>([]);
  const availableSorts: Attribute[] = useMemo(() => {
      return sorts.filter(attr => 
        !tempSelectedSortingMethods.some(selected => selected.attribute.id === attr.id)
      );
    }, [sorts, tempSelectedSortingMethods]);
  
  // Repetition options
  const [selectedRepetitionPattern, setSelectedRepetitionPattern] = useState<GameRepetitionPattern>(repetitionPatterns.optimal);
  
  const [tempSelectedRepetitionPattern, setTempSelectedRepetitionPattern] = useState<GameRepetitionPattern>({
    patternName: 'never',
    initialEasinessFactor: 2.5,
    initialInterval: 1,
    secondInterval: 6,
  });
  const [repeatSettings, setRepeatSettings] = useState({
    initialEasinessFactor: 2.5,
    initialInterval: 1,
    secondInterval: 6,
  });

  // Enregistrement de la progression ou non
  const [saveProgress, setSaveProgress] = useState<boolean>(true);
  
  // Helps
  const [selectedHelps, setSelectedHelps] = useState<{ [key: string]: boolean }>({
    typosFriendly: true,
    initialGiven: true,
  });
  const [tempSelectedHelps, setTempSelectedHelps] = useState<{ [key: string]: boolean }>({
    typosFriendly: true,
    initialGiven: true,
  });
  
  // For edit modals
  const [editingFilter, setEditingFilter] = useState<GameFilter | undefined>(undefined);
  const [editingSort, setEditingSort] = useState<GameSortBy | undefined>(undefined);

  // Critical changes
  const hasCriticalChanges: boolean = useMemo(() => {
    return (
      tempSelectedPopulationScope !== selectedPopulationScope ||
      JSON.stringify(tempSelectedMode) !== JSON.stringify(selectedMode) ||
      JSON.stringify(tempSelectedFilters) !== JSON.stringify(selectedFilters) ||
      JSON.stringify(tempSelectedSortingMethods) !== JSON.stringify(selectedSortingMethods)
    );
  }, [
    tempSelectedPopulationScope,
    selectedPopulationScope,
    tempSelectedMode,
    selectedMode,
    tempSelectedFilters,
    selectedFilters,
    tempSelectedSortingMethods,
    selectedSortingMethods
  ]);

  // → State “sticky” qui passe à true une fois que hasCriticalChanges devient true
  const [hasUncheckedCriticalChanges, setHasUncheckedCriticalChanges] = useState(false);

  // → Dès qu’on détecte une première fois un changement, on colle le flag à true
  useEffect(() => {
    if (hasCriticalChanges) {
      setHasUncheckedCriticalChanges(true);
    }
  }, [hasCriticalChanges]);

  
  // Fetch des données lors du montage du provider
  useEffect(() => {
    setSelectedPopulationScope('ALL');
    setTempSelectedPopulationScope('ALL');
    setSelectedMode(modes[0]);
    setTempSelectedMode(modes[0]);
  }, [modes]);
  
  return (
    <QuizOptionsContext.Provider
      value={{
        selectedPopulationScope,
        setSelectedPopulationScope,
        tempSelectedPopulationScope,
        setTempSelectedPopulationScope,
        modes,
        hasCriticalChanges,
        hasUncheckedCriticalChanges,
        setHasUncheckedCriticalChanges,
        tempSelectedMode,
        setTempSelectedMode,
        selectedMode,
        setSelectedMode,
        filters,
        availableFilters,
        selectedFilters,
        setSelectedFilters,
        tempSelectedFilters,
        setTempSelectedFilters,
        sorts,
        availableSorts,
        selectedSortingMethods,
        setSelectedSortingMethods,
        tempSelectedSortingMethods,
        setTempSelectedSortingMethods,
        selectedRepetitionPattern,
        setSelectedRepetitionPattern,
        tempSelectedRepetitionPattern,
        setTempSelectedRepetitionPattern,
        repeatSettings,
        setRepeatSettings,
        saveProgress,
        setSaveProgress,
        selectedHelps,
        setSelectedHelps,
        tempSelectedHelps,
        setTempSelectedHelps,
        editingFilter,
        setEditingFilter,
        editingSort,
        setEditingSort
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
