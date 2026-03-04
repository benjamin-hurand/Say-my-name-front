import React, { createContext, useContext, useEffect, ReactNode, useMemo, useState } from "react";

import { Attribute } from "../models/commons/Attribute/Attribute";
import { GameFilter } from "../models/commons/Game/GameOptions/GameFilter.model";
import { GameSortBy } from "../models/commons/Game/GameOptions/GameSortBy.model";
import { GameRepetitionPattern, repetitionPatterns } from "../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { GameMode } from "../models/commons/Game/GameMode/GameMode.model";
import { GamePopulationScope } from "../models/commons/Game/GameOptions/GamePopulationScope.model";

import { useOrgData } from "./OrgDataContext";
import { QuizPreferredFormat } from "../services/dto/quiz/QuizEnums";

export type QuizHelps = {
  typosFriendly: boolean;
  initialGiven: boolean;
};

interface QuizOptionsContextType {
  // Critical changes
  hasCriticalChanges: boolean;
  hasUncheckedCriticalChanges: boolean;
  setHasUncheckedCriticalChanges: React.Dispatch<React.SetStateAction<boolean>>;

  // Options fingerprint (for component remounting)
  optionsFingerprint: string;

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

  // Progress
  saveProgress: boolean;
  setSaveProgress: React.Dispatch<React.SetStateAction<boolean>>;

  // Helps
  selectedHelps: QuizHelps;
  setSelectedHelps: React.Dispatch<React.SetStateAction<QuizHelps>>;
  tempSelectedHelps: QuizHelps;
  setTempSelectedHelps: React.Dispatch<React.SetStateAction<QuizHelps>>;

  // Preferred Format
  selectedFormat: QuizPreferredFormat;
  setSelectedFormat: React.Dispatch<React.SetStateAction<QuizPreferredFormat>>;
  tempSelectedFormat: QuizPreferredFormat;
  setTempSelectedFormat: React.Dispatch<React.SetStateAction<QuizPreferredFormat>>;

  // For edit modals (optional)
  editingFilter?: GameFilter;
  setEditingFilter: (filter: GameFilter | undefined) => void;
  editingSort?: GameSortBy;
  setEditingSort: (sort: GameSortBy | undefined) => void;
}

const QuizOptionsContext = createContext<QuizOptionsContextType | undefined>(undefined);

export const QuizOptionsProvider = ({ children }: { children: ReactNode }) => {
  const { filters, sorts, modes } = useOrgData();

  // Population
  const [selectedPopulationScope, setSelectedPopulationScope] = useState<GamePopulationScope>("ALL");
  const [tempSelectedPopulationScope, setTempSelectedPopulationScope] = useState<GamePopulationScope>("ALL");

  // Modes
  const [tempSelectedMode, setTempSelectedMode] = useState<GameMode | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // Filters
  const [selectedFilters, setSelectedFilters] = useState<GameFilter[]>([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState<GameFilter[]>([]);

  const availableFilters: Attribute[] = useMemo(() => {
    return filters.filter((attr) => !tempSelectedFilters.some((selected) => selected.attribute.id === attr.id));
  }, [filters, tempSelectedFilters]);

  // Sorting
  const [selectedSortingMethods, setSelectedSortingMethods] = useState<GameSortBy[]>([]);
  const [tempSelectedSortingMethods, setTempSelectedSortingMethods] = useState<GameSortBy[]>([]);

  const availableSorts: Attribute[] = useMemo(() => {
    return sorts.filter((attr) => !tempSelectedSortingMethods.some((selected) => selected.attribute.id === attr.id));
  }, [sorts, tempSelectedSortingMethods]);

  // Repetition
  const [selectedRepetitionPattern, setSelectedRepetitionPattern] = useState<GameRepetitionPattern>(repetitionPatterns.optimal);
  const [tempSelectedRepetitionPattern, setTempSelectedRepetitionPattern] = useState<GameRepetitionPattern>(repetitionPatterns.optimal);

  // Progress saving
  const [saveProgress, setSaveProgress] = useState<boolean>(true);

  // Helps
  const [selectedHelps, setSelectedHelps] = useState<QuizHelps>({
    typosFriendly: true,
    initialGiven: true,
  });

  const [tempSelectedHelps, setTempSelectedHelps] = useState<QuizHelps>({
    typosFriendly: true,
    initialGiven: true,
  });

  // Preferred Format
  const [selectedFormat, setSelectedFormat] = useState<QuizPreferredFormat>("AUTO");
  const [tempSelectedFormat, setTempSelectedFormat] = useState<QuizPreferredFormat>("AUTO");

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
    selectedSortingMethods,
  ]);

  // Options fingerprint (for component remounting)
  // Changes when critical options are committed (Save in QuizOptions)
  const optionsFingerprint = useMemo(() => {
    const critical = {
      mode: selectedMode?.id ?? null,
      scope: selectedPopulationScope,
      filters: selectedFilters.map((f) => f.id).sort(),
      sorts: selectedSortingMethods.map((s) => s.id).sort(),
      format: selectedFormat,
    };
    return JSON.stringify(critical);
  }, [selectedMode, selectedPopulationScope, selectedFilters, selectedSortingMethods, selectedFormat]);

  const [hasUncheckedCriticalChanges, setHasUncheckedCriticalChanges] = useState(false);

  useEffect(() => {
    if (hasCriticalChanges) setHasUncheckedCriticalChanges(true);
  }, [hasCriticalChanges]);

  // Init mode default once modes are available
  useEffect(() => {
    if (!modes || modes.length === 0) return;

    // Only set if not already set (avoid wiping user selection when org data reloads)
    setSelectedPopulationScope((p) => p ?? "ALL");
    setTempSelectedPopulationScope((p) => p ?? "ALL");

    setSelectedMode((prev) => prev ?? modes[0]);
    setTempSelectedMode((prev) => prev ?? modes[0]);
  }, [modes]);

  return (
    <QuizOptionsContext.Provider
      value={{
        // critical
        hasCriticalChanges,
        hasUncheckedCriticalChanges,
        setHasUncheckedCriticalChanges,
        optionsFingerprint,

        // population
        selectedPopulationScope,
        setSelectedPopulationScope,
        tempSelectedPopulationScope,
        setTempSelectedPopulationScope,

        // modes
        modes,
        tempSelectedMode,
        setTempSelectedMode,
        selectedMode,
        setSelectedMode,

        // filters
        filters,
        availableFilters,
        selectedFilters,
        setSelectedFilters,
        tempSelectedFilters,
        setTempSelectedFilters,

        // sorts
        sorts,
        availableSorts,
        selectedSortingMethods,
        setSelectedSortingMethods,
        tempSelectedSortingMethods,
        setTempSelectedSortingMethods,

        // repetition
        selectedRepetitionPattern,
        setSelectedRepetitionPattern,
        tempSelectedRepetitionPattern,
        setTempSelectedRepetitionPattern,

        // progress
        saveProgress,
        setSaveProgress,

        // helps
        selectedHelps,
        setSelectedHelps,
        tempSelectedHelps,
        setTempSelectedHelps,

        // format
        selectedFormat,
        setSelectedFormat,
        tempSelectedFormat,
        setTempSelectedFormat,

        // edit modals
        editingFilter,
        setEditingFilter,
        editingSort,
        setEditingSort,
      }}
    >
      {children}
    </QuizOptionsContext.Provider>
  );
};

export const useQuizOptions = () => {
  const context = useContext(QuizOptionsContext);
  if (!context) throw new Error("useQuizOptions must be used within a QuizOptionsProvider");
  return context;
};
