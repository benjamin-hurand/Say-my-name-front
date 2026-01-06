import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizOptions } from "../../contexts/QuizOptionsContext";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import { GameOptions } from "../../models/commons/Game/GameOptions/GameOptions.model";
import {
  repetitionPatterns,
  SpacedRepetitionData,
} from "../../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { QuizEntry, QuizEntryWithRepetition } from "../../models/commons/Game/QuizEntry";
import { QuizHistoryEntry } from "../../models/commons/Game/QuizHistoryEntry";
import { PersonAttributeLite, ResultAttr } from "../../models/commons/PersonAttribute";
import { getPersonAttributesById } from "../../services/business/persons/person.service";
import { submitResults } from "../../services/business/quiz/knowledge.service";
import { getQuizList } from "../../services/business/quiz/quiz.service";
import { normalizeText } from "../../services/business/utils/NormalizedAnswer";
import { KnowledgeResultDto } from "../../services/dto/KnowledgeResultDto";
import { ReducedGameOptionsDto } from "../../services/dto/ReducedGameOptionsDto";
import { toReducedGameOptionsDto } from "../../services/dto/ReducedGameOptionsDtoMapper";
import { notifyError, notifySuccess, notifyWarning } from "../../services/notification/toast.service";
import QuizDisplay from "./QuizDisplay";

interface QuizProps {}

// Nombre maximal de bonnes répétitions avant suppression
const MAX_CORRECT_REPETITIONS = 2;

export const TrainingQuiz: React.FC<QuizProps> = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();

  const {
    quizList,
    setQuizList,
    quizHistory,
    setQuizHistory,
    reviewList,
    sessionOptions,
    setSessionOptions,
    uncheckedNewSession,
    setUncheckedNewSession,
  } = useQuizSession();

  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [personId, setPersonId] = useState<number | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [helpUsed, setHelpUsed] = useState<boolean>(false);

  // result mode
  const [isResultMode, setIsResultMode] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [resultAttrs, setResultAttrs] = useState<ResultAttr[]>([]);

  const {
    selectedPopulationScope,
    setSelectedPopulationScope,
    modes,
    selectedMode,
    setSelectedMode,
    selectedFilters,
    setSelectedFilters,
    selectedSortingMethods,
    setSelectedSortingMethods,
    selectedRepetitionPattern,
    setSelectedRepetitionPattern,
    saveProgress,
    selectedHelps,
    setSelectedHelps,
    setHasUncheckedCriticalChanges,
    hasUncheckedCriticalChanges,
  } = useQuizOptions();

  const [currentRepetitionData, setCurrentRepetitionData] = useState<SpacedRepetitionData>({
    totalRepetitionCount: 0,
    correctRepetitionCount: 0,
    easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
    interval: repetitionPatterns.optimal.initialInterval,
  });

  // ----------------------------
  // Spaced Repetition helpers
  // ----------------------------
  function updateRepetitionData(data: SpacedRepetitionData | null, quality: number): SpacedRepetitionData {
    const pattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;
    const d =
      data || {
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: pattern.initialEasinessFactor,
        interval: pattern.initialInterval,
      };

    const newTotal = d.totalRepetitionCount + 1;

    if (quality < 3) {
      return {
        totalRepetitionCount: newTotal,
        correctRepetitionCount: 0,
        easinessFactor: pattern.initialEasinessFactor,
        interval: pattern.initialInterval,
      };
    }

    const newCorrect = d.correctRepetitionCount + 1;

    if (newTotal === 1) {
      return {
        totalRepetitionCount: newTotal,
        correctRepetitionCount: newCorrect,
        easinessFactor: d.easinessFactor,
        interval: -1,
      };
    }

    const newInterval =
      newCorrect === 1 ? pattern.secondInterval : Math.round(d.interval * d.easinessFactor);

    let newEz = d.easinessFactor - 0.8 + 0.28 * quality - 0.02 * quality * quality;
    if (newEz < 1.3) newEz = 1.3;

    return {
      totalRepetitionCount: newTotal,
      correctRepetitionCount: newCorrect,
      easinessFactor: newEz,
      interval: newInterval,
    };
  }

  // ----------------------------
  // Handle repetition pattern changes
  // ----------------------------
  useEffect(() => {
    if (backupQuizList.length === 0) return;

    const pattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;

    // 1) Reset backup list data
    const resetList = backupQuizList.map((item) => ({
      ...item,
      repetitionData: {
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: pattern.initialEasinessFactor,
        interval: pattern.initialInterval,
      },
    }));
    setBackupQuizList(resetList);

    // 2) Build baseList excluding already attempted
    const baseList = resetList.slice(quizHistory.length);
    const newQuizList: QuizEntryWithRepetition[] = [...baseList];

    // 3) Reinsert incorrect history items
    if (pattern.initialInterval !== -1) {
      quizHistory.forEach((historyEntry) => {
        if (!historyEntry.isCorrect) {
          const insertionIndex =
            pattern.initialInterval < newQuizList.length ? pattern.initialInterval : newQuizList.length;
          newQuizList.splice(insertionIndex, 0, {
            ...historyEntry,
            repetitionData: {
              ...historyEntry.repetitionData,
              interval: pattern.initialInterval,
            },
          });
        }
      });
    }

    setQuizList(newQuizList);
    setHasFetched(true);
    notifySuccess("The repetition pattern has been updated. The frequency of repetitions might have been modified.");
  }, [selectedRepetitionPattern]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------
  // Fetch list + session init
  // ----------------------------
  const fetchList = useCallback(async () => {
    setIsLoading(true);

    // Ensure defaults if user lands here without options
    if (!selectedMode || !modes || modes.length === 0) {
      setSelectedPopulationScope("ALL");
      if (modes && modes.length > 0) setSelectedMode(modes[0]);
      setSelectedRepetitionPattern(repetitionPatterns.optimal);
      setSelectedHelps({ initialGiven: true, typosFriendly: true });
      setSelectedFilters([]);
      setSelectedSortingMethods([]);
    }

    try {
      const effectiveMode = selectedMode ?? modes?.[0];
      if (!effectiveMode) {
        notifyError("No game mode available.");
        setQuizList([]);
        return;
      }

      const effectivePattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;
      const effectiveScope = selectedPopulationScope ?? "ALL";

      const options: GameOptions = {
        id: Date.now(),
        gameMode: effectiveMode,
        filters: selectedFilters ?? [],
        sortBy: selectedSortingMethods ?? [],
        populationScope: effectiveScope,
        repetitionPattern: effectivePattern,
        initialGiven: selectedHelps.initialGiven,
        typosFriendly: selectedHelps.typosFriendly,
      };

      const dto: ReducedGameOptionsDto = toReducedGameOptionsDto(options);
      const entries: QuizEntry[] = await getQuizList(dto);

      if (entries.length === 0) {
        notifyWarning("Aucun résultat trouvé pour les options sélectionnées.");
        setQuizList([]);
        setBackupQuizList([]);
      } else {
        const enriched: QuizEntryWithRepetition[] = entries.map((e) => ({
          ...e,
          repetitionData: {
            totalRepetitionCount: 0,
            correctRepetitionCount: 0,
            easinessFactor: effectivePattern.initialEasinessFactor,
            interval: effectivePattern.initialInterval,
          },
        }));
        setQuizList(enriched);
        setBackupQuizList(enriched);

        setSessionOptions({
          mode: effectiveMode,
          filters: selectedFilters ?? [],
          sorts: selectedSortingMethods ?? [],
          populationScope: effectiveScope,
          repetitionPattern: effectivePattern,
          helps: { typosFriendly: selectedHelps.typosFriendly, initialGiven: selectedHelps.initialGiven },
        });
      }
    } catch (error) {
      notifyError("Erreur lors du chargement du quiz : " + error);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [
    modes,
    selectedPopulationScope,
    selectedMode,
    selectedFilters,
    selectedSortingMethods,
    selectedRepetitionPattern,
    selectedHelps,
    setSelectedPopulationScope,
    setSelectedMode,
    setSelectedRepetitionPattern,
    setSelectedHelps,
    setSelectedFilters,
    setSelectedSortingMethods,
    setSessionOptions,
    setQuizList,
  ]);

  // ----------------------------
  // INIT logic:
  // - from "review session" : use reviewList + sessionOptions
  // - from options critical changes: refetch
  // - otherwise: fetch if empty
  // ----------------------------
  useEffect(() => {
    if (reviewList.length > 0 && sessionOptions && uncheckedNewSession) {
      // Treat reviewList as a generic "review mistakes" session.
      const pattern = repetitionPatterns.optimal;

      setSelectedRepetitionPattern(pattern);
      setSelectedPopulationScope(sessionOptions.populationScope);
      setSelectedMode(sessionOptions.mode);
      setSelectedFilters(sessionOptions.filters);
      setSelectedHelps(sessionOptions.helps);

      const filtered = reviewList.filter((e) => e.repetitionData.correctRepetitionCount === 0);
      setQuizList(filtered);
      setBackupQuizList(filtered);

      const historyEntries: QuizHistoryEntry[] = reviewList.map((e) => ({
        photoUrl: e.photoUrl,
        personId: e.personId,
        initials: e.initials,
        isCorrect: e.repetitionData.correctRepetitionCount > 0,
        repetitionData: e.repetitionData,
      }));

      setQuizHistory(historyEntries);
      setUncheckedNewSession(false);

      setHasFetched(true);
      setIsLoading(false);
      return;
    }

    if (hasUncheckedCriticalChanges) {
      setHasUncheckedCriticalChanges(false);
      fetchList();
      return;
    }

    if (!quizList || quizList.length === 0) {
      if (quizHistory.length > 0) {
        setHasFetched(true);
        setIsLoading(false);
        return;
      }
      fetchList();
      return;
    }

    setHasFetched(true);
    setIsLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------
  // Update current question
  // ----------------------------
  useEffect(() => {
    if (isResultMode) return;

    const pattern = selectedRepetitionPattern ?? repetitionPatterns.optimal;

    if (!quizList || quizList.length === 0) {
      setPhotoUrl(null);
      setPersonId(null);
      setInitials(null);
      setHelpUsed(false);
      setCurrentRepetitionData({
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: pattern.initialEasinessFactor,
        interval: pattern.initialInterval,
      });
      setAnswer("");
      return;
    }

    const current = quizList[0];
    setPhotoUrl(current.photoUrl);
    setPersonId(current.personId);
    setInitials(current.initials);
    setHelpUsed(false);
    setCurrentRepetitionData(current.repetitionData);
    setAnswer("");
  }, [quizList, isResultMode, selectedRepetitionPattern]);

  // ----------------------------
  // Validate answer
  // ----------------------------
  const validateAnswer = useCallback(async () => {
    if (!photoUrl || personId == null || !selectedMode) {
      notifyError("No photo or mode defined");
      return;
    }

    try {
      const personAttrs = await getPersonAttributesById(personId);
      const typos = selectedHelps.typosFriendly;

      const normAnswer = answer
        .split(" ")
        .map((p) => normalizeText(p, typos))
        .filter((p) => p)
        .sort();

      const targetIds = selectedMode.attributes.map((a) => a.attribute.id);

      const correctVals = personAttrs
        .filter((pa) => targetIds.includes(pa.attribute.id))
        .map((pa) => pa.value);

      const normCorrect = correctVals
        .map((v) => v.split(" ").map((p) => normalizeText(p, typos)))
        .flat()
        .sort();

      const match =
        selectedMode.operator === "AND"
          ? JSON.stringify(normAnswer) === JSON.stringify(normCorrect)
          : normAnswer.some((p) => normCorrect.includes(p));

      // If help was used, we consider it incorrect for SRS purposes
      const effectiveMatch = helpUsed ? false : match;

      const quality = effectiveMatch ? 5 : 0;
      const updatedRep = updateRepetitionData(currentRepetitionData, quality);

      // History
      setQuizHistory((prev) => {
        const exists = prev.find((e) => e.personId === personId);
        const entry: QuizHistoryEntry = {
          photoUrl,
          personId,
          initials: initials!,
          isCorrect: effectiveMatch,
          repetitionData: updatedRep,
        };

        return exists ? prev.map((e) => (e.personId === personId ? { ...e, ...entry } : e)) : [...prev, entry];
      });

      // Queue update (reinsert or drop)
      setQuizList((prev) => {
        const [currentQ, ...rest] = prev;
        if (
          updatedRep.correctRepetitionCount < MAX_CORRECT_REPETITIONS &&
          ((effectiveMatch && updatedRep.totalRepetitionCount > 1) || !effectiveMatch) &&
          updatedRep.interval !== -1
        ) {
          const idx = Math.min(updatedRep.interval, rest.length);
          rest.splice(idx, 0, { ...currentQ, repetitionData: updatedRep });
          return rest;
        }
        return rest;
      });

      // Result message
      setResultMessage(match ? (helpUsed ? "Et sans aide ?😉" : "BRAVO !") : "Oops ! 💪");

      // Result attrs display
      const allAttrs: ResultAttr[] = personAttrs.map((pa) => {
        const isTarget = targetIds.includes(pa.attribute.id);
        let isCorrect = true;

        if (isTarget) {
          const normValParts = pa.value.split(" ").map((p) => normalizeText(p, typos));
          isCorrect =
            selectedMode.operator === "AND"
              ? normValParts.every((p) => normAnswer.includes(p))
              : normValParts.some((p) => normAnswer.includes(p));
        }

        return { attribute: pa.attribute, value: pa.value, isTarget, isCorrect };
      });

      setIsResultMode(true);
      setResultAttrs(allAttrs);

      // Save progress
      if (saveProgress) {
        try {
          const payload: KnowledgeResultDto = {
            gameModeId: selectedMode.id,
            personId: personId,
            isCorrect: match,
            helpUsed,
          };
          await submitResults([payload]);
        } catch (err) {
          // Keep quiz UX smooth even if save fails
          console.error("Erreur sauvegarde progression:", err);
          notifyError("Impossible d’enregistrer votre progression.");
        }
      }
    } catch (err) {
      notifyError("Error validating answer: " + err);
    }
  }, [
    answer,
    photoUrl,
    personId,
    selectedMode,
    selectedHelps,
    helpUsed,
    initials,
    currentRepetitionData,
    saveProgress,
    setQuizHistory,
    setQuizList,
  ]);

  const handleNext = useCallback(() => {
    setResultAttrs([]);
    setResultMessage("");
    setIsResultMode(false);
  }, []);

  const openQuizOptions = () => navigate("/training/options", { replace: true });

  const fromReview = reviewList.length > 0;

  return (
    <QuizDisplay
      // 0. Theme
      color={color}
      // 1. Photo + loading
      photoUrl={photoUrl}
      hasFetched={hasFetched}
      isLoading={isLoading}
      // 2. Help
      useHelp={async () => {
        if (personId == null) return [];
        setHelpUsed(true);
        const attrs: PersonAttributeLite[] = await getPersonAttributesById(personId);
        return attrs;
      }}
      // 3. Initials
      initials={initials}
      showInitials={selectedHelps.initialGiven}
      // 4. User Answer
      answer={answer}
      handleAnswerChange={(e) => setAnswer(e.target.value)}
      validateAnswer={validateAnswer}
      // 5. Results
      isResultMode={isResultMode}
      resultMessage={resultMessage}
      resultAttributes={resultAttrs}
      onNext={handleNext}
      // 6. Options
      openQuizOptions={openQuizOptions}
      // 7. End Of Quiz
      onRetry={() => fetchList()}
      hasHistory={quizHistory.length > 0}
      // If QuizDisplay wants to show a “Back” button for review sessions, we keep a generic signal:
      fromReview={fromReview}
      goBackFromReview={() => {
        // V1: go back to menu or courses; choose your preferred landing.
        navigate("/menu");
      }}
    />
  );
};

export default TrainingQuiz;
