// src/contexts/ChallengeAttemptContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import {
  ChallengeEvaluationDto,
  CreatedChallengeAttemptDto,
} from "../services/dto/ChallengeAttemptDto";
import { getChallengeAttempt } from "../services/business/challenges/challenge.service";
import { ChallengeHistoryEntry } from "../models/commons/Game/QuizHistoryEntry";
import { ChallengeCardDto } from "../services/dto/ChallengeCardDto";

interface AttemptContextType {
  challengeCardDto: ChallengeCardDto | null;
  setChallengeCardDto: React.Dispatch<React.SetStateAction<ChallengeCardDto | null>>;
  attempt: CreatedChallengeAttemptDto | null;
  history: ChallengeHistoryEntry[];
  evaluationResults: ChallengeEvaluationDto | null;
  setEvaluationResults: React.Dispatch<React.SetStateAction<ChallengeEvaluationDto | null>>;
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
  const [challengeCardDto, setChallengeCardDto] = useState<ChallengeCardDto | null>(
    null
  );
  
  const [attempt, setAttempt] = useState<CreatedChallengeAttemptDto | null>(
    null
  );
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);

  const [evaluationResults, setEvaluationResults] = useState<ChallengeEvaluationDto | null>(null);

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
        challengeCardDto,
        setChallengeCardDto,
        attempt,
        history,
        evaluationResults,
        setEvaluationResults,
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
