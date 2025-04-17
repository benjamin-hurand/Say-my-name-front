// src/contexts/ChallengeAttemptContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import {
  CreatedChallengeAttemptDto,
} from "../services/dto/ChallengeAttemptDto";
import { getChallengeAttempt } from "../services/business/challenges/challenge.service";
import { ChallengeHistoryEntry } from "../models/commons/Game/QuizHistoryEntry";

interface AttemptContextType {
  attempt: CreatedChallengeAttemptDto | null;
  history: ChallengeHistoryEntry[];
  setCurrentAttempt: (attempt: CreatedChallengeAttemptDto) => void;
  loadAttempt: (id: number) => Promise<void>;
  addHistoryEntry: (entry: ChallengeHistoryEntry) => void;
  resetHistory: () => void;
}

const AttemptContext = createContext<AttemptContextType | undefined>(
  undefined
);

export const useAttempt = (): AttemptContextType => {
  const ctx = useContext(AttemptContext);
  if (!ctx)
    throw new Error("useAttempt must be used within ChallengeAttemptProvider");
  return ctx;
};

export const ChallengeAttemptProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [attempt, setAttempt] = useState<CreatedChallengeAttemptDto | null>(
    null
  );
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);

  const loadAttempt = useCallback(async (id: number) => {
    try {
      const data = await getChallengeAttempt(id);
      setAttempt(data);
      setHistory([]);        // on efface l’historique proprement
    } catch (e) {
      console.error("Erreur fetching attempt via service:", e);
    }
  }, []);

  const setCurrentAttempt = useCallback(
    (dto: CreatedChallengeAttemptDto) => {
      setAttempt(dto);
      setHistory([]);
    },
    []
  );

  const addHistoryEntry = useCallback(
    (entry: ChallengeHistoryEntry) => {
      setHistory((h) => [...h, entry]);
    },
    []
  );

  const resetHistory = useCallback(() => setHistory([]), []);

  return (
    <AttemptContext.Provider
      value={{
        attempt,
        history,
        setCurrentAttempt,
        loadAttempt,
        addHistoryEntry,
        resetHistory,
      }}
    >
      {children}
    </AttemptContext.Provider>
  );
};
