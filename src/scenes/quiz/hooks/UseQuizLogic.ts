import { useState, useEffect, useCallback } from 'react';
import { GameOptions } from '../../../models/commons/Game/GameOptions/GameOptions.model';
import { repetitionPatterns, SpacedRepetitionData } from '../../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { QuizEntry, QuizEntryWithRepetition } from '../../../models/commons/Game/QuizEntry';
import { QuizHistoryEntry } from '../../../models/commons/Game/QuizHistoryEntry';
import { PersonAttribute } from '../../../models/commons/PersonAttribute';
import { getPersonAttributesById } from '../../../services/business/persons/person.service';
import { getQuizList } from '../../../services/business/quiz/quiz.service';
import { ReducedGameOptionsDto } from '../../../services/dto/ReducedGameOptionsDto';
import { toReducedGameOptionsDto } from '../../../services/dto/ReducedGameOptionsDtoMapper';
import { notifyWarning, notifyError, notifySuccess } from '../../../services/notification/toast.service';

/** 
 * Paramètres d'entrée du hook. 
 * On reçoit ici un GameOptions complet (avec gameMode, filters, etc.), 
 * tel que préparé depuis le context ou la page parente.
 */
interface UseQuizLogicParams {
  gameOptions: GameOptions; 
}

export function useQuizLogic({ gameOptions }: UseQuizLogicParams) {

  // ─────────────────────────────────────────────────────────────────────────────
  //  ÉTATS
  // ─────────────────────────────────────────────────────────────────────────────

  // Info de chargement + liste récupérée
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [fetchedQuizList, setFetchedQuizList] = useState<QuizEntryWithRepetition[]>([]);
  const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);

  // Historique (pour gérer le fait qu’on réinsère les items en fonction des erreurs)
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);

  // Question en cours (photo, answer, etc.)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [personId, setPersonId] = useState<number | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');

  // ─────────────────────────────────────────────────────────────────────────────
  //  FONCTIONS UTILITAIRES
  // ─────────────────────────────────────────────────────────────────────────────

  /** Normalize un texte (accents, majuscules, typos si besoin) */
  function normalizeText(text: string, typosFriendly: boolean): string {
    // Remove accents + toLowerCase
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Si on veut être “typo friendly”, on applique quelques remplacements:
    if (typosFriendly) {
      text = text
        .replace(/y/gi, 'i')
        .replace(/h/gi, '')
        .replace(/pt/gi, 't')
        .replace(/sz/gi, 's')
        .replace(/([a-z])\1+/gi, '$1')      // ex: “heeeellooo” => “helo”
        .replace(/e+$/gi, '')               // remove trailing 'e'
        .replace(/[^a-z]/gi, '')            // remove non-alpha
        .replace(/au/gi, 'o')
        .replace(/ck/gi, 'k')
        .replace(/qu/gi, 'k')
        .replace(/que/gi, 'k')
        .replace(/en/gi, 'an')
        .replace(/c/gi, 'k')
        .trim()
        .replace(/\s+/g, ' ');

      // Simplifications supplémentaires (ex: “ein” => “in”, “gue” => “g”)
      text = text
        .replace(/(ein|ain|in)/gi, 'in')
        .replace(/gue/gi, 'g');
    }
    return text;
  }

  /** Met à jour la structure de répétition espacée (interval, easinessFactor, etc.) */
  function updateRepetitionData(
    currentData: SpacedRepetitionData | null,
    quality: number
  ): SpacedRepetitionData {
    const rp = gameOptions.repetitionPattern ?? repetitionPatterns.never;
    
    // Valeurs par défaut si jamais “currentData” est null
    const data = currentData || {
      totalRepetitionCount: 0,
      correctRepetitionCount: 0,
      easinessFactor: rp.initialEasinessFactor,
      interval: rp.initialInterval,
    };

    const newTotalRepetitionCount = data.totalRepetitionCount + 1;

    // Si la qualité < 3 => “mauvaise réponse”
    if (quality < 3) {
      return {
        totalRepetitionCount: newTotalRepetitionCount,
        correctRepetitionCount: 0,
        easinessFactor: rp.initialEasinessFactor,
        interval: rp.initialInterval,
      };
    } else {
      const newCorrectRepetitionCount = data.correctRepetitionCount + 1;
      // première bonne réponse => interval = -1 => plus de réapparition
      if (newTotalRepetitionCount === 1) {
        return {
          totalRepetitionCount: newTotalRepetitionCount,
          correctRepetitionCount: newCorrectRepetitionCount,
          easinessFactor: data.easinessFactor,
          interval: -1,
        };
      }

      let newInterval: number;
      // si c’est la 2eme fois qu’on voit la question (ex: secondInterval)
      if (newCorrectRepetitionCount === 1) {
        // ex: 2eme question => on applique un “secondInterval”
        newInterval = rp.secondInterval;
      } else {
        // on fait croître l’interval en fonction de l’easinessFactor
        newInterval = Math.round(data.interval * data.easinessFactor);
      }

      // mise à jour du easinessFactor
      let newEasinessFactor = data.easinessFactor - 0.8 + 0.28 * quality - 0.02 * quality * quality;
      if (newEasinessFactor < 1.3) newEasinessFactor = 1.3;

      return {
        totalRepetitionCount: newTotalRepetitionCount,
        correctRepetitionCount: newCorrectRepetitionCount,
        easinessFactor: newEasinessFactor,
        interval: newInterval,
      };
    }
  }

  /** Récupère les attributs d’une personne pour la correction */
  const fetchPersonAttributes = async (personId: number): Promise<PersonAttribute[]> => {
    try {
      return await getPersonAttributesById(personId);
    } catch (error) {
      console.error('Error fetching person attributes:', error);
      throw error;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  MÉTHODES PRINCIPALES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Récupération initiale de la liste du Quiz, en tenant compte des 
   * filtres/tris du gameOptions + initialisation repetitionData
   */
  const fetchQuizList = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasFetched(false);

      // Si pas de mode, on n’appelle pas le service
      if (!gameOptions.gameMode) {
        // ex: on peut ne pas fetcher si le mode n’est pas encore choisi
        setFetchedQuizList([]);
        setBackupQuizList([]);
        setIsLoading(false);
        setHasFetched(true);
        return;
      }

      // Transforme gameOptions en un DTO compréhensible pour l’API
      const reducedGameOptionsDto: ReducedGameOptionsDto = toReducedGameOptionsDto(gameOptions);

      // Appel API
      const quizList: QuizEntry[] = await getQuizList(reducedGameOptionsDto);

      if (quizList.length === 0) {
        notifyWarning("Aucun résultat trouvé pour les options sélectionnées. Veuillez ajuster vos filtres.");
        setFetchedQuizList([]);
        setBackupQuizList([]);
        setHasFetched(true);
        return;
      }

      // Enrichir chaque entrée avec la répétition espacée initiale
      const rp = gameOptions.repetitionPattern ?? repetitionPatterns.never;
      const enrichedQuizList: QuizEntryWithRepetition[] = quizList.map((qe) => ({
        ...qe,
        repetitionData: {
          totalRepetitionCount: 0,
          correctRepetitionCount: 0,
          easinessFactor: rp.initialEasinessFactor,
          interval: rp.initialInterval,
        },
      }));

      setBackupQuizList(enrichedQuizList);
      setFetchedQuizList(enrichedQuizList);
      setHasFetched(true);

    } catch (error) {
      notifyError('Error fetching quiz list: ' + error);
    } finally {
      setIsLoading(false);
    }
  }, [gameOptions]);

  /**
   * Met à jour la question en cours à partir du premier élément de fetchedQuizList
   */
  const fetchQuiz = useCallback(() => {
    if (fetchedQuizList.length === 0) {
      setPhotoUrl(null);
      setPersonId(null);
      setInitials(null);
      setAnswer('');
      return;
    }
    // on prend la première question
    const firstEntry = fetchedQuizList[0];
    setPhotoUrl(firstEntry.photoUrl);
    setPersonId(firstEntry.personId);
    setInitials(firstEntry.initials);
    setAnswer('');
  }, [fetchedQuizList]);

  /** 
   * Déclenché quand on veut valider la réponse (on clique sur "Submit", ou Enter).
   */
  const validateAnswer = useCallback(async () => {
    if (!photoUrl || !personId || !gameOptions.gameMode) {
      notifyError('Pas de photo ou pas de mode défini.');
      return;
    }
    try {
      // Récupère attributs + normalise la réponse
      const personAttributes: PersonAttribute[] = await fetchPersonAttributes(personId);

      const typosFriendly = gameOptions.typosFriendly ?? false;
      const userParts = answer
        .split(' ')
        .map((part) => normalizeText(part, typosFriendly))
        .sort();

      // On récupère tous les attributs “ciblés” par le mode (ex: si on veut le prénom, la date, etc.)
      const correctAnswers: string[] = personAttributes
        .filter((pa) =>
          gameOptions.gameMode!.attributes.some((ga) => ga.attribute.id === pa.attribute.id)
        )
        .map((pa) => pa.value);

      // On normalise aussi les “vraies” réponses
      const correctParts = correctAnswers
        .flatMap((ans) => ans.split(' '))
        .map((part) => normalizeText(part, typosFriendly))
        .sort();

      // On évalue si l’utilisateur a bon, selon l’opérateur
      let match = false;
      if (gameOptions.gameMode.operator === 'AND') {
        // ex: toutes les parties doivent correspondre (façon stricte)
        match = JSON.stringify(userParts) === JSON.stringify(correctParts);
      } else {
        // ex: 'OR' => si une partie correspond, on valide
        match = userParts.some((part) => correctParts.includes(part));
      }

      // On calcule la “quality” pour la répétition espacée
      const quality = match ? 5 : 0;

      // On récupère la répétitionData actuelle
      const currentRepetitionData = fetchedQuizList[0].repetitionData;
      const updatedRepetitionData = updateRepetitionData(currentRepetitionData, quality);

      // On met à jour l’historique (quizHistory)
      if (currentRepetitionData.totalRepetitionCount === 0) {
        // première fois qu’on la voit
        setQuizHistory((prev) => [
          ...prev,
          {
            photoUrl: photoUrl,
            personId: personId,
            initials: initials || '',
            correct: match,
            repetitionData: updatedRepetitionData,
          },
        ]);
      } else {
        // on met à jour la repetitionData dans l’historique existant
        setQuizHistory((prev) =>
          prev.map((entry) =>
            entry.personId === personId
              ? { ...entry, repetitionData: updatedRepetitionData }
              : entry
          )
        );
      }

      // Si c’est faux ou si c’est juste mais la carte doit encore être revue (interval != -1), on réinsère
      if (((match && updatedRepetitionData.totalRepetitionCount > 1) || !match)
         && updatedRepetitionData.interval !== -1) {
        // On calcule la position d’insertion => updatedRepetitionData.interval
        const insertionIndex = Math.min(
          updatedRepetitionData.interval,
          fetchedQuizList.length - 1
        );

        // On modifie la liste => on enlève l’élément 0, on l’insère plus loin
        setFetchedQuizList((prevList) => {
          const [first, ...rest] = prevList;
          // on insère 'first' (mis à jour) à insertionIndex
          const newItem: QuizEntryWithRepetition = {
            ...first,
            repetitionData: updatedRepetitionData,
          };
          rest.splice(insertionIndex, 0, newItem);
          return rest;
        });
        setHasFetched(true);
      } else {
        // sinon, on passe à la question suivante => on “pop” le premier
        setFetchedQuizList((prevList) => prevList.slice(1));
        setHasFetched(true);
      }

      // Notifs
      if (match) {
        notifySuccess('Bien joué!');
      } else {
        notifyWarning(`Mauvaise réponse! Les attributs corrects: ${correctAnswers.join(', ')}`);
      }

    } catch (error) {
      notifyError('Error validating answer: ' + error);
    }
  }, [answer, fetchedQuizList, gameOptions, photoUrl, personId, initials]);

  /**
   * Redémarre la liste en cas de changement de repetitionPattern:
   * (ex: si l’utilisateur modifie la pattern, on doit réinitialiser 
   *  backupQuizList, la replacer dans fetchedQuizList, etc.)
   */
  const handleRepetitionPatternChanged = useCallback(() => {
    // Sécurité: si on n’a pas de backupList, on ne fait rien
    if (!backupQuizList.length) return;
    const rp = gameOptions.repetitionPattern ?? repetitionPatterns.never;

    // On recrée un backup avec la nouvelle config de repetition
    const newBackup: QuizEntryWithRepetition[] = backupQuizList.map((prev) => ({
      ...prev,
      repetitionData: {
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: rp.initialEasinessFactor,
        interval: rp.initialInterval,
      },
    }));

    setBackupQuizList(newBackup);

    // Reconstruire la fetchedQuizList en tenant compte de l’historique
    let baseList = newBackup.slice(quizHistory.length);

    // On réinsère éventuellement les cartes mal répondues
    if (rp.initialInterval !== -1) {
      quizHistory.forEach((historyEntry) => {
        if (!historyEntry.correct) {
          const newInterval = rp.initialInterval;
          // Met à jour l’interval dans l’historique, si besoin
          historyEntry.repetitionData.interval = newInterval;
          const insertionIndex = Math.min(newInterval, baseList.length);
          baseList.splice(insertionIndex, 0, {
            ...historyEntry,
          } as QuizEntryWithRepetition);
        }
      });
    }
    setFetchedQuizList(baseList);
    setHasFetched(true);
    notifySuccess('The repetition pattern has been updated.');
  }, [backupQuizList, quizHistory, gameOptions]);

  // ─────────────────────────────────────────────────────────────────────────────
  //  EFFETS (initialisation, mise à jour quand options changent)
  // ─────────────────────────────────────────────────────────────────────────────

  // 1) Charger la liste quand gameOptions change
  useEffect(() => {
    // On réinitialise l’historique
    setQuizHistory([]);
    fetchQuizList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Surveiller ce qui dans gameOptions doit déclencher un refetch
    gameOptions.gameMode,
    gameOptions.filters,
    gameOptions.sortBy,
    // etc.
  ]);

  // 2) Mettre à jour la question courante quand fetchedQuizList change
  useEffect(() => {
    fetchQuiz();
  }, [fetchedQuizList, fetchQuiz]);

  // 3) Recalculer la liste quand le repetitionPattern change (ex: si l’utilisateur le modifie)
  useEffect(() => {
    handleRepetitionPatternChanged();
  }, [gameOptions.repetitionPattern, handleRepetitionPatternChanged]);

  // ─────────────────────────────────────────────────────────────────────────────
  //  MÉTHODES & STATES RETOURNÉS PAR LE HOOK
  // ─────────────────────────────────────────────────────────────────────────────

  /** Mise à jour du champ de saisie “Answer” */
  function handleAnswerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAnswer(e.target.value);
  }

  return {
    // Données d’affichage
    isLoading,
    hasFetched,
    photoUrl,
    initials,
    answer,

    // Liste & Historique — si tu veux les exploiter hors du composant
    fetchedQuizList,
    quizHistory,

    // Actions
    handleAnswerChange,
    validateAnswer,
  };
}
