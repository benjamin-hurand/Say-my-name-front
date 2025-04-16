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
  
  
  interface AttemptContextType {
    attempt: CreatedChallengeAttemptDto | null;
    setCurrentAttempt: (attempt: CreatedChallengeAttemptDto) => void;
    loadAttempt: (id: number) => Promise<void>;
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
  
    const loadAttempt = useCallback(async (id: number) => {
      try {
        const data = await getChallengeAttempt(id);
        setAttempt(data);
      } catch (e) {
        console.error("Erreur fetching attempt via service:", e);
      }
    }, []);

    const setCurrentAttempt = useCallback(
        (dto: CreatedChallengeAttemptDto) => setAttempt(dto),
        []
      );
  
    return (
      <AttemptContext.Provider value={{ attempt, setCurrentAttempt, loadAttempt }}>
        {children}
      </AttemptContext.Provider>
    );
  };
  