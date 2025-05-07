import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import { repetitionPatterns, SpacedRepetitionData } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';
import { getQuizList } from '../../services/business/quiz/quiz.service';
import { QuizEntry, QuizEntryWithRepetition } from '../../models/commons/Game/QuizEntry';
import { getPersonAttributesById } from '../../services/business/persons/person.service';
import QuizDisplay from './QuizDisplay';
import { ReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDto';
import { toReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDtoMapper';
import { useQuizOptions } from '../../contexts/QuizOptionsContext';
import { useQuizSession } from '../../contexts/QuizSessionContext';
import { normalizeText } from '../../services/business/utils/NormalizedAnswer';
import { QuizHistoryEntry } from '../../models/commons/Game/QuizHistoryEntry';
import { set } from 'date-fns';

interface QuizProps {}

// Nombre maximal de bonnes répétitions avant suppression
const MAX_CORRECT_REPETITIONS = 3;

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
    resetSession,
    uncheckedNewSession,
    setUncheckedNewSession
  } = useQuizSession();

  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [personId, setPersonId] = useState<number | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');

  const {
    modes,
    filters,
    availableFilters,
    selectedMode,
    setSelectedMode,
    selectedFilters,
    setSelectedFilters,
    selectedSortingMethods,
    setSelectedSortingMethods,
    selectedRepetitionPattern,
    setSelectedRepetitionPattern,
    selectedHelps,
    setSelectedHelps,
    setHasUncheckedCriticalChanges,
    hasUncheckedCriticalChanges
  } = useQuizOptions();

  const [currentRepetitionData, setCurrentRepetitionData] = useState<SpacedRepetitionData>({
    totalRepetitionCount: 0,
    correctRepetitionCount: 0,
    easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
    interval: repetitionPatterns.optimal.initialInterval
  });

  // Handle repetition pattern changes
  useEffect(() => {
    if (backupQuizList.length === 0) return;

    // 1) Reset backup list data
    const resetList = backupQuizList.map(item => ({
      ...item,
      repetitionData: {
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
        interval: selectedRepetitionPattern.initialInterval
      }
    }));
    setBackupQuizList(resetList);

    // 2) Build baseList excluding already attempted
    const baseList = resetList.slice(quizHistory.length);
    const newQuizList: QuizEntryWithRepetition[] = [...baseList];

    // 3) Reinsert incorrect history items
    if (selectedRepetitionPattern.initialInterval !== -1) {
      quizHistory.forEach(historyEntry => {
        if (!historyEntry.isCorrect) {
          const insertionIndex =
            selectedRepetitionPattern.initialInterval < newQuizList.length
              ? selectedRepetitionPattern.initialInterval
              : newQuizList.length;
          newQuizList.splice(insertionIndex, 0, {
            ...historyEntry,
            repetitionData: {
              ...historyEntry.repetitionData,
              interval: selectedRepetitionPattern.initialInterval
            }
          });
        }
      });
    }

    setQuizList(newQuizList);
    setHasFetched(true);
    notifySuccess(
      'The repetition pattern has been updated. The frequency of repetitions might have been modified.'
    );
  }, [selectedRepetitionPattern]);

  // Fetch and session-init logic
  const fetchList = useCallback(async () => {
    console.log('TrainingQuiz: fetchList', selectedMode, selectedFilters, selectedSortingMethods);
    setIsLoading(true);
    if (!selectedMode) {
      setSelectedMode(modes[0]);
      setSelectedRepetitionPattern(repetitionPatterns.optimal);
      setSelectedHelps({ initialGiven: true, typosFriendly: true });
      setSelectedFilters([]);
      setSelectedSortingMethods([]);
    };
    try {
      const options: GameOptions = {
        id: Date.now(),
        gameMode: selectedMode ?? modes[0],
        filters: selectedFilters ?? [],
        sortBy: selectedSortingMethods ?? [],
        repetitionPattern: selectedRepetitionPattern ?? repetitionPatterns.optimal,
        initialGiven: selectedHelps.initialGiven,
        typosFriendly: selectedHelps.typosFriendly
      };
      const dto: ReducedGameOptionsDto = toReducedGameOptionsDto(options);
      const entries: QuizEntry[] = await getQuizList(dto);

      if (entries.length === 0) {
        notifyWarning('Aucun résultat trouvé pour les options sélectionnées.');
        setQuizList([]);
      } else {
        const enriched = entries.map(e => ({
          ...e,
          repetitionData: {
            totalRepetitionCount: 0,
            correctRepetitionCount: 0,
            easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
            interval: selectedRepetitionPattern.initialInterval
          }
        }));
        setQuizList(enriched);
        setBackupQuizList(enriched);

        setSessionOptions({
          mode: selectedMode,
          filters: selectedFilters,
          sorts: selectedSortingMethods,
          repetitionPattern: selectedRepetitionPattern,
          helps: { typosFriendly: selectedHelps.typosFriendly, initialGiven: selectedHelps.initialGiven }
        });
      }
    } catch (error) {
      notifyError('Erreur lors du chargement du quiz : ' + error);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [selectedMode, selectedFilters, selectedSortingMethods, selectedRepetitionPattern, selectedHelps]);

  // Handle INIT (from challenge: reviewList / from menu: fetchList / from options: hasUncheckedCriticalChanges)
  useEffect(() => {
    console.log('TrainingQuiz: init');
    if (reviewList.length > 0 && sessionOptions && uncheckedNewSession) {
      console.log('reviewList');
      setSelectedRepetitionPattern(repetitionPatterns.optimal);
      setSelectedMode(sessionOptions.mode);
      setSelectedFilters(sessionOptions.filters);
      setSelectedHelps(sessionOptions.helps);

      const filtered = reviewList.filter(e => e.repetitionData.correctRepetitionCount === 0);
      setQuizList(filtered);
      setBackupQuizList(filtered);

      const historyEntries: QuizHistoryEntry[] = reviewList.map(e => ({
        photoUrl: e.photoUrl,
        personId: e.personId,
        initials: e.initials,
        isCorrect: e.repetitionData.correctRepetitionCount > 0,
        repetitionData: e.repetitionData
      }));
      setQuizHistory(historyEntries);
      setUncheckedNewSession(false);

      setHasFetched(true);
      setIsLoading(false);
    } else if (hasUncheckedCriticalChanges) {
      setHasUncheckedCriticalChanges(false);
      fetchList();
    } else if (!quizList || quizList.length === 0) {
      if (quizHistory.length > 0) {
        console.log('quizHistory no fetchlist');
        setHasFetched(true);
        setIsLoading(false);
        return;
      }
      console.log('nolist normal fetchlist');
      fetchList();
    } else {
      console.log('nolist no fetchlist');
      setHasFetched(true);
      setIsLoading(false);
    }
  }, []);

  // Update current question
  useEffect(() => {
    if (!quizList || quizList.length === 0) {
      setPhotoUrl(null);
      setPersonId(null);
      setInitials(null);
      setCurrentRepetitionData({
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
        interval: selectedRepetitionPattern.initialInterval
      });
      setAnswer('');
      return;
    }
    console.log('Updating current question...', JSON.stringify(quizList));
    const current = quizList[0];
    setPhotoUrl(current.photoUrl);
    setPersonId(current.personId);
    setInitials(current.initials);
    setCurrentRepetitionData(current.repetitionData);
    setAnswer('');
  }, [quizList]);

  // Handle answer validation
  const validateAnswer = useCallback(async () => {
    if (!photoUrl || !personId || !selectedMode) {
      notifyError('No photo or mode defined');
      return;
    }
    try {
      const personAttrs = await getPersonAttributesById(personId);
      const typos = selectedHelps.typosFriendly;
      const normAnswer = answer.split(' ').map(p => normalizeText(p, typos)).sort();
      const correctVals = personAttrs
        .filter(pa => selectedMode.attributes.some(a => a.attribute.id === pa.attribute.id))
        .map(pa => pa.value);
      const normCorrect = correctVals.map(v => v.split(' ').map(p => normalizeText(p, typos))).flat().sort();

      const match = selectedMode.operator === 'AND'
        ? JSON.stringify(normAnswer) === JSON.stringify(normCorrect)
        : normAnswer.some(p => normCorrect.includes(p));

      const quality = match ? 5 : 0;
      const updated = updateRepetitionData(currentRepetitionData, quality);

      setQuizHistory(prev => {
        const exists = prev.find(e => e.personId === personId);
        if (!exists) return [...prev, { photoUrl, personId, initials: initials!, isCorrect: match, repetitionData: updated }];
        return prev.map(e => e.personId === personId ? { ...e, repetitionData: updated, isCorrect: match } : e);
      });

      if (updated.correctRepetitionCount < MAX_CORRECT_REPETITIONS && ((match && updated.totalRepetitionCount > 1) || !match) && updated.interval !== -1) {
        setQuizList(prev => {
          const currentQ = prev[0];
          const rest = prev.slice(1);
          const idx = updated.interval < rest.length ? updated.interval : rest.length;
          rest.splice(idx, 0, { ...currentQ, repetitionData: updated });
          return rest;
        });
      } else {
        setQuizList(prev => prev.slice(1));
      }

      match ? notifySuccess('Bien joué') : notifyWarning(`Erreur, réponse: ${correctVals.join(' ')} vs ${answer}`);
    } catch (err) {
      notifyError('Error validating answer: ' + err);
    }
  }, [answer, photoUrl, personId, selectedMode, selectedHelps, currentRepetitionData, quizList]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') validateAnswer(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [validateAnswer]);

  function updateRepetitionData(
    data: SpacedRepetitionData | null,
    quality: number
  ): SpacedRepetitionData {
    const d = data || { totalRepetitionCount: 0, correctRepetitionCount: 0, easinessFactor: selectedRepetitionPattern.initialEasinessFactor, interval: selectedRepetitionPattern.initialInterval };
    const newTotal = d.totalRepetitionCount + 1;
    if (quality < 3) {
      return { totalRepetitionCount: newTotal, correctRepetitionCount: 0, easinessFactor: selectedRepetitionPattern.initialEasinessFactor, interval: selectedRepetitionPattern.initialInterval };
    }
    const newCorrect = d.correctRepetitionCount + 1;
    if (newTotal === 1) {
      return { totalRepetitionCount: newTotal, correctRepetitionCount: newCorrect, easinessFactor: d.easinessFactor, interval: -1 };
    }
    const newInterval = newCorrect === 1
      ? selectedRepetitionPattern.secondInterval
      : Math.round(d.interval * d.easinessFactor);
    let newEz = d.easinessFactor - 0.8 + 0.28 * quality - 0.02 * quality * quality;
    if (newEz < 1.3) newEz = 1.3;
    return { totalRepetitionCount: newTotal, correctRepetitionCount: newCorrect, easinessFactor: newEz, interval: newInterval };
  }

  const goBackToMenu = () => navigate('/', { replace: true });
  const openQuizOptions = () => navigate('/training/options', { replace: true });

  return (
    <QuizDisplay
      color={color}
      photoUrl={photoUrl}
      initials={initials}
      showInitials={selectedHelps.initialGiven}
      answer={answer}
      handleAnswerChange={e => setAnswer(e.target.value)}
      validateAnswer={validateAnswer}
      openQuizOptions={openQuizOptions}
      goBackToMenu={goBackToMenu}
      isLoading={isLoading}
      hasFetched={hasFetched}
      onRetry={() => {
        fetchList();
      }}
      onCreateChallenge={() => {
        // Naviguer vers la création de challenge, par ex.
        // To do : passer le gamemode et les filtres en context session
        console.log('selectedFilters', selectedFilters);
        setSessionOptions({
          mode: selectedMode,
          filters: selectedFilters,
          sorts: selectedSortingMethods,
          repetitionPattern: selectedRepetitionPattern,
          helps: { typosFriendly: selectedHelps.typosFriendly, initialGiven: selectedHelps.initialGiven }
        });
        navigate("/challenges/new", {
          state: { onBack: "/training" }
        });
      }}
      hasHistory={quizHistory.length > 0}
    />
  );
};

export default TrainingQuiz;
