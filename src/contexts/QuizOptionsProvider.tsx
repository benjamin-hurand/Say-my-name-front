import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Attribute } from '../models/commons/Attribute';
import { GameFilter } from '../models/commons/Game/GameOptions/GameFilter.model';
import { GameSortBy } from '../models/commons/Game/GameOptions/GameSortBy.model';
import { GameRepetitionPattern, repetitionPatterns } from '../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameMode } from '../models/commons/Game/GameMode/GameMode.model';
import { getFilters } from '../services/business/attributes/attribute.service';
import { getSorts } from '../services/business/attributes/attribute.service';
import { getGameModes } from '../services/business/gamemodes/gameMode.service';

interface QuizOptionsContextType {
  // Modes
  modesList: GameMode[];
  setModesList: React.Dispatch<React.SetStateAction<GameMode[]>>;
  tempSelectedMode: GameMode | null;
  setTempSelectedMode: React.Dispatch<React.SetStateAction<GameMode | null>>;
  selectedMode: GameMode | null;
  setSelectedMode: React.Dispatch<React.SetStateAction<GameMode | null>>;
  // Filters
  filters: Attribute[];
  setFilters: React.Dispatch<React.SetStateAction<Attribute[]>>;
  availableFilters: Attribute[];
  selectedFilters: GameFilter[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<GameFilter[]>>;
  tempSelectedFilters: GameFilter[];
  setTempSelectedFilters: React.Dispatch<React.SetStateAction<GameFilter[]>>;
  // Sorting methods
  sorts: Attribute[];
  setSorts: React.Dispatch<React.SetStateAction<Attribute[]>>;
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
  // Modes
  const [modesList, setModesList] = useState<GameMode[]>([]);
  const [tempSelectedMode, setTempSelectedMode] = useState<GameMode | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<Attribute[]>([]); 
  const [selectedFilters, setSelectedFilters] = useState<GameFilter[]>([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState<GameFilter[]>([]);
  const availableFilters: Attribute[] = useMemo(() => {
      return filters.filter(attr => 
        !tempSelectedFilters.some(selected => selected.attribute.id === attr.id)
      );
    }, [filters, tempSelectedFilters]);
  
  // Sorting methods
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [selectedSortingMethods, setSelectedSortingMethods] = useState<GameSortBy[]>([]);
  const [tempSelectedSortingMethods, setTempSelectedSortingMethods] = useState<GameSortBy[]>([]);
  const availableSorts: Attribute[] = useMemo(() => {
      return sorts.filter(attr => 
        !tempSelectedSortingMethods.some(selected => selected.attribute.id === attr.id)
      );
    }, [sorts, tempSelectedSortingMethods]);
  
  // Repetition options
  const [selectedRepetitionPattern, setSelectedRepetitionPattern] = useState<GameRepetitionPattern>(repetitionPatterns.never);
  
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
  
  // Helps
  const [selectedHelps, setSelectedHelps] = useState<{ [key: string]: boolean }>({
    typosFriendly: false,
    initialGiven: false,
  });
  const [tempSelectedHelps, setTempSelectedHelps] = useState<{ [key: string]: boolean }>({
    typosFriendly: false,
    initialGiven: false,
  });
  
  // For edit modals
  const [editingFilter, setEditingFilter] = useState<GameFilter | undefined>(undefined);
  const [editingSort, setEditingSort] = useState<GameSortBy | undefined>(undefined);
  
  // Fetch des données lors du montage du provider
  useEffect(() => {
    (async () => {
      try {
        const fetchedFilters: Attribute[] = await getFilters();
        setFilters(fetchedFilters);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    })();
  }, []);
  
  useEffect(() => {
    (async () => {
      try {
        const fetchedSorts: Attribute[] = await getSorts();
        setSorts(fetchedSorts);
      } catch (error) {
        console.error('Error fetching sorts:', error);
      }
    })();
  }, []);
  
  useEffect(() => {
    (async () => {
      try {
        const fetchedModes: GameMode[] = await getGameModes();
        setModesList(fetchedModes);
        if (fetchedModes.length > 0) {
          setSelectedMode(fetchedModes[0]);
          setTempSelectedMode(fetchedModes[0]);
        }
      } catch (error) {
        console.error('Error fetching game modes:', error);
      }
    })();
  }, []);
  
  return (
    <QuizOptionsContext.Provider
      value={{
        modesList,
        setModesList,
        tempSelectedMode,
        setTempSelectedMode,
        selectedMode,
        setSelectedMode,
        filters,
        setFilters,
        availableFilters,
        selectedFilters,
        setSelectedFilters,
        tempSelectedFilters,
        setTempSelectedFilters,
        sorts,
        setSorts,
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
