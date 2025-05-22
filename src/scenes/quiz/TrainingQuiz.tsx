import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizOptions } from '../../contexts/QuizOptionsContext';
import { useQuizSession } from '../../contexts/QuizSessionContext';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';
import { repetitionPatterns, SpacedRepetitionData } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { QuizEntry, QuizEntryWithRepetition } from '../../models/commons/Game/QuizEntry';
import { QuizHistoryEntry } from '../../models/commons/Game/QuizHistoryEntry';
import { PersonAttribute, ResultAttr } from '../../models/commons/PersonAttribute';
import { getPersonAttributesById } from '../../services/business/persons/person.service';
import { getQuizList } from '../../services/business/quiz/quiz.service';
import { normalizeText } from '../../services/business/utils/NormalizedAnswer';
import { ReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDto';
import { toReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDtoMapper';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import QuizDisplay from './QuizDisplay';

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
    setUncheckedNewSession
  } = useQuizSession();

  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [personId, setPersonId] = useState<number | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [helpUsed, setHelpUsed] = useState<boolean>(false);

  // en haut du component
  const [isResultMode, setIsResultMode] = useState(false)
  const [resultMessage, setResultMessage] = useState<string>('')
  const [resultAttrs, setResultAttrs] = useState<ResultAttr[]>([])


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
    if (isResultMode) return;
    if (!quizList || quizList.length === 0) {
      setPhotoUrl(null);
      setPersonId(null);
      setInitials(null);
      setHelpUsed(false);
      setCurrentRepetitionData({
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
        interval: selectedRepetitionPattern.initialInterval
      });
      setAnswer('');
      return;
    }
    const current = quizList[0];
    setPhotoUrl(current.photoUrl);
    setPersonId(current.personId);
    setInitials(current.initials);
    setHelpUsed(false);
    setCurrentRepetitionData(current.repetitionData);
    setAnswer('');
  }, [quizList, isResultMode]);

  // Handle answer validation
  const validateAnswer = useCallback(async () => {
    // 0. Pré-conditions
    if (!photoUrl || personId == null || !selectedMode) {
      notifyError('No photo or mode defined');
      return;
    }

    try {
      // 1. Charger les attributs de la personne et normaliser la réponse
      const personAttrs = await getPersonAttributesById(personId);
      const typos = selectedHelps.typosFriendly;
      const normAnswer = answer
        .split(' ')
        .map(p => normalizeText(p, typos))
        .filter(p => p)    // on enlève les chaînes vides
        .sort();

      // 2. Déterminer quels attributs étaient ciblés par le quiz
      const targetIds = selectedMode.attributes.map(a => a.attribute.id);

      // 3. Calculer le résultat global (match AND vs OR)
      const correctVals = personAttrs
        .filter(pa => targetIds.includes(pa.attribute.id))
        .map(pa => pa.value);
      const normCorrect = correctVals
        .map(v => v.split(' ').map(p => normalizeText(p, typos)))
        .flat()
        .sort();

      const match = selectedMode.operator === 'AND'
        ? JSON.stringify(normAnswer) === JSON.stringify(normCorrect)
        : normAnswer.some(p => normCorrect.includes(p));

      // 4. Mettre à jour les données de répétition (Spaced Repetition)
      const quality = match ? 5 : 0;
      const updatedRep = updateRepetitionData(currentRepetitionData, quality);

      // 5. Enregistrer dans l'historique
      setQuizHistory(prev => {
        const exists = prev.find(e => e.personId === personId);
        const entry = {
          photoUrl,
          personId,
          initials: initials!,
          isCorrect: match,
          repetitionData: updatedRep
        } as QuizHistoryEntry;

        return exists
          ? prev.map(e => e.personId === personId ? { ...e, ...entry } : e)
          : [...prev, entry];
      });

      // 6. Réinjecter ou retirer de la file selon spaced repetition
      setQuizList(prev => {
        const [currentQ, ...rest] = prev;
        if (
          updatedRep.correctRepetitionCount < MAX_CORRECT_REPETITIONS &&
          ((match && updatedRep.totalRepetitionCount > 1) || !match) &&
          updatedRep.interval !== -1
        ) {
          // Réinsertion à l'index défini par l'intervalle
          const idx = Math.min(updatedRep.interval, rest.length);
          rest.splice(idx, 0, { ...currentQ, repetitionData: updatedRep });
          return rest;
        } else {
          // On enlève simplement l'élément courant
          return rest;
        }
      });

      // 7. Préparer le message de résultat
      setResultMessage(
        match
          ? (helpUsed
              ? 'Et sans aide ?😉'
              : 'BRAVO !')
          : 'Oops ! 💪'
      );

      // 8. Construire la liste complète des attributs pour l'affichage
      const allAttrs: ResultAttr[] = personAttrs.map(pa => {
        const isTarget = targetIds.includes(pa.attribute.id);
        let isCorrect = true;

        if (isTarget) {
          // Normaliser chaque sous-partie de la valeur
          const normValParts = pa.value
            .split(' ')
            .map(p => normalizeText(p, typos));

          // AND = toutes les parties doivent être présentes, OR = au moins une
          isCorrect = selectedMode.operator === 'AND'
            ? normValParts.every(p => normAnswer.includes(p))
            : normValParts.some(p => normAnswer.includes(p));
        }

        return {
          attribute: pa.attribute,
          value: pa.value,
          isTarget,
          isCorrect
        };
      });

      setResultAttrs(allAttrs);

      // 9. Passer en mode résultat (flip + affichage)
      setIsResultMode(true);
    }
    catch (err) {
      notifyError('Error validating answer: ' + err);
    }
  }, [
    answer,
    photoUrl,
    personId,
    selectedMode,
    selectedHelps,
    currentRepetitionData,
    helpUsed,
    updateRepetitionData,
    setQuizHistory,
    setQuizList
  ]);
  
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

  const handleNext = useCallback(() => {
    setResultAttrs([]);
    setResultMessage('');
    setIsResultMode(false);
  }, []);


  const openQuizOptions = () => navigate('/training/options', { replace: true });

  return (
    <QuizDisplay
      // 0. Theme
      color={color}
      
      // 1. Progress
      //TODO elapsed, progress
      
      // 2. Photo
      photoUrl={photoUrl}
      hasFetched={hasFetched}
      isLoading={isLoading}

      // 3. Badges
      // TODO: poolBadge, difficultyBadge

      // 4. Help
      useHelp={async () => {
              if (personId == null) return [];
              setHelpUsed(true);
              console.log('helpused');
              const attrs: PersonAttribute[] =
                await getPersonAttributesById(personId);
              return attrs
            }}

      // 5. Initials
      initials={initials}
      showInitials={selectedHelps.initialGiven}

      // 6. User Answer
      answer={answer}
      handleAnswerChange={e => setAnswer(e.target.value)}
      validateAnswer={validateAnswer}

      // 7. Results
      isResultMode={isResultMode}
      resultMessage={resultMessage}
      resultAttributes={resultAttrs}
      onNext={handleNext}
      
      // 8. Options
      openQuizOptions={openQuizOptions}

      // 9. End Of Quiz
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
      fromChallenge={!!reviewList}
      goBackToChallenge={() => {
        if (!!reviewList) {
          navigate(`/challenges`)
        }
      }}
    />
  );
};

export default TrainingQuiz;
