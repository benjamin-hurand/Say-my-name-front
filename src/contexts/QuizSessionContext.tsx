// src/contexts/QuizSessionContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { QuizEntryWithRepetition } from "../models/commons/Game/QuizEntry";
import { QuizHistoryEntry } from "../models/commons/Game/QuizHistoryEntry";
import { GameFilter } from "../models/commons/Game/GameOptions/GameFilter.model";
import { GameSortBy } from "../models/commons/Game/GameOptions/GameSortBy.model";
import { GameRepetitionPattern } from "../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { GameMode } from "../models/commons/Game/GameMode/GameMode.model";
import { GamePopulationScope } from "../models/commons/Game/GameOptions/GamePopulationScope.model";

// Ce contexte gère l'exécution d'une session de quiz :
// - quizList : file active de questions (fetch normal OU session "review/free training")
// - quizHistory : historique des tentatives en cours
// - reviewList : liste initiale d'une session de révision (ex. depuis un cours / erreurs / replay)
// - sessionOptions : snapshot des QuizOptions au lancement
// - uncheckedNewSession : flag permettant à TrainingQuiz d'initialiser une fois une session "review"
export interface SessionOptions {
  mode: GameMode | null;
  filters: GameFilter[];
  sorts: GameSortBy[];
  populationScope: GamePopulationScope;
  repetitionPattern: GameRepetitionPattern;
  helps: { [key: string]: boolean };
}

export interface QuizSessionContextType {
  quizList: QuizEntryWithRepetition[];
  setQuizList: React.Dispatch<React.SetStateAction<QuizEntryWithRepetition[]>>;

  quizHistory: QuizHistoryEntry[];
  setQuizHistory: React.Dispatch<React.SetStateAction<QuizHistoryEntry[]>>;

  reviewList: QuizEntryWithRepetition[];
  setReviewList: React.Dispatch<React.SetStateAction<QuizEntryWithRepetition[]>>;

  sessionOptions: SessionOptions | null;
  setSessionOptions: React.Dispatch<React.SetStateAction<SessionOptions | null>>;

  uncheckedNewSession: boolean;
  setUncheckedNewSession: React.Dispatch<React.SetStateAction<boolean>>;

  resetSession: () => void;
}

const QuizSessionContext = createContext<QuizSessionContextType | undefined>(undefined);

export const QuizSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizList, setQuizList] = useState<QuizEntryWithRepetition[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
  const [reviewList, setReviewList] = useState<QuizEntryWithRepetition[]>([]);
  const [sessionOptions, setSessionOptions] = useState<SessionOptions | null>(null);
  const [uncheckedNewSession, setUncheckedNewSession] = useState<boolean>(false);

  // Remet la session à l'état initial (utile lorsqu'on change de mode/options,
  // ou lorsqu'on quitte complètement le quiz)
  const resetSession = () => {
    setQuizList([]);
    setQuizHistory([]);
    setReviewList([]);
    setSessionOptions(null);
    setUncheckedNewSession(false);
  };

  return (
    <QuizSessionContext.Provider
      value={{
        quizList,
        setQuizList,
        quizHistory,
        setQuizHistory,
        reviewList,
        setReviewList,
        sessionOptions,
        setSessionOptions,
        uncheckedNewSession,
        setUncheckedNewSession,
        resetSession,
      }}
    >
      {children}
    </QuizSessionContext.Provider>
  );
};

export const useQuizSession = (): QuizSessionContextType => {
  const context = useContext(QuizSessionContext);
  if (!context) {
    throw new Error("useQuizSession must be used within a QuizSessionProvider");
  }
  return context;
};
