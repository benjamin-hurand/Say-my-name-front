import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import { repetitionPatterns, SpacedRepetitionData } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';
import { PersonAttribute } from '../../models/commons/PersonAttribute';
import { getQuizList } from '../../services/business/quiz/quiz.service';
import { QuizEntry, QuizEntryWithRepetition } from '../../models/commons/Game/QuizEntry';
import { getPersonAttributesById } from '../../services/business/persons/person.service';
import QuizDisplay from './QuizDisplay';
import { ReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDto';
import { toReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDtoMapper';
import { QuizHistoryEntry } from '../../models/commons/Game/QuizHistoryEntry';
import { useQuizOptions } from '../../contexts/QuizOptionsContext';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    // PAGE UTILS
    const navigate = useNavigate();
    const { color } = useThemeColorContext();

    // TOGGLE OPTIONS / QUIZ TAB

    // FULL QUIZ DATA
    const [hasFetched, setHasFetched] = useState<boolean>(false);
    const [fetchedQuizList, setFetchedQuizList] = useState<QuizEntryWithRepetition[]>([]);
    const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
    const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);
    
    // QUIZ 1 QUESTION
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [personId, setPersonId] = useState<number | null>(null);
    const [initials, setInitials] = useState<string | null>(null);
    const [answer, setAnswer] = useState<string>('');


    // OPTIONS
    // CONTEXT:
    const 
    {
      selectedMode,
      selectedFilters,
      selectedSortingMethods,
      selectedRepetitionPattern,
      selectedHelps,
    } = useQuizOptions();

    // REPETITIONS
    const [currentRepetitionData, setCurrentRepetitionData] = useState<SpacedRepetitionData>({
        totalRepetitionCount: 0,
        correctRepetitionCount: 0,
        easinessFactor: repetitionPatterns.never.initialEasinessFactor,
        interval: repetitionPatterns.never.initialInterval
    });

    // Repetition Pattern Changed
    useEffect(() => {
        if (backupQuizList.length === 0) return;
        // console.log('new selectedRepetitionPattern: ', JSON.stringify(selectedRepetitionPattern));
        const newBackupQuizList: QuizEntryWithRepetition[] = backupQuizList.map(prevAttrs => ({
            ...prevAttrs,
            repetitionData: {
                totalRepetitionCount: 0,
                correctRepetitionCount: 0,
                easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
                interval: selectedRepetitionPattern.initialInterval
            }
        }));
        setBackupQuizList(newBackupQuizList);

        // On va rétablir les repetitions depuis l'historique et backup list
        let baseList = newBackupQuizList.slice(quizHistory.length);
        
        // Si le nouveau pattern comprends un interval de répétition
        if (selectedRepetitionPattern.initialInterval !== -1) {
            // For each historical entry where the answer was wrong,
            quizHistory.forEach(historyEntry => {  
                // Pour chaque Entree historique, on modifie l'interval avec l'interval initial du pattern
                const newInterval: number = selectedRepetitionPattern.initialInterval;
                historyEntry.repetitionData.interval = newInterval;
                // Et on insert chaque entree historique fausse en tant que répétition dans quizList
                if (!historyEntry.correct) {
                    // Compute insertion index: if the interval exceeds the current baseList length, insert at the end.
                    const insertionIndex: number = newInterval < baseList.length ? selectedRepetitionPattern.initialInterval : baseList.length;
                    baseList.splice(insertionIndex, 0, {
                        ...historyEntry
                    });
                }
            });
        }
        // Update the fetched quiz list with this new list.
        setFetchedQuizList(baseList);
        setHasFetched(true);
        notifySuccess("The repetition pattern has been updated. The frequency of repetitions might have been modified.");
    }, [selectedRepetitionPattern]);

    // Some Critical options changed (as during initialization)
    useEffect(() => {
        const handler = setTimeout(() => {
            // console.log('Critical options were changed');
            setQuizHistory([]);
            fetchQuizList();
        }, 300);
        
        return () => clearTimeout(handler);
    }, [selectedMode, selectedFilters, selectedSortingMethods]);

    // FetchedQuizList changed: update question (photo, person, answer)
    useEffect(() => {
        if (fetchedQuizList.length === 0) {
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
        }
        // console.log("10 next entries: ", JSON.stringify(fetchedQuizList.slice(0,10)));
        fetchQuiz();
    }, [fetchedQuizList]);

    // INIT FULL QUIZ WITH OPTIONS
    const fetchQuizList = useCallback(async () => {
        try {
          // Ne rien faire tant que le mode n'est pas défini
          if (!selectedMode) return;
      
          setIsLoading(true);
          const gameOptions: GameOptions = {
            id: Date.now(),
            gameMode: selectedMode,
            filters: selectedFilters,
            sortBy: selectedSortingMethods,
            repetitionPattern: selectedRepetitionPattern,
            initialGiven: selectedHelps.initialGiven,
            typosFriendly: selectedHelps.typosFriendly,
          };
      
          const reducedGameOptionsDto: ReducedGameOptionsDto = toReducedGameOptionsDto(gameOptions);
          const quizList: QuizEntry[] = await getQuizList(reducedGameOptionsDto);
      
          if (quizList.length === 0) {
            notifyWarning("Aucun résultat trouvé pour les options sélectionnées. Veuillez ajuster vos filtres.");
            setFetchedQuizList([]);
            setHasFetched(true);
            return;
          }
      
          // Enrich each quiz entry with initial repetitionData from the current repetition pattern:
          const enrichedQuizList: QuizEntryWithRepetition[] = quizList.map(qe => ({
            ...qe,
            repetitionData: {
              totalRepetitionCount: 0,
              correctRepetitionCount: 0,
              easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
              interval: selectedRepetitionPattern.initialInterval,
            },
          }));
      
          // Save a backup copy as well as the working list:
          setBackupQuizList(enrichedQuizList);
          setFetchedQuizList(enrichedQuizList);
          setHasFetched(true);
        } catch (error) {
          console.error('Error fetching quiz list: ', error);
          // On ne notifie l'erreur que si l'on est sûr que ce n'est pas lié à l'absence de mode
          if (selectedMode) {
            notifyError('Error fetching quiz list: ' + error);
          }
        } finally {
          setIsLoading(false);
        }
      }, [selectedMode, selectedFilters, selectedSortingMethods, selectedRepetitionPattern, selectedHelps]);
      
    
    // INIT 1 QUESTION
    const fetchQuiz = useCallback(async () => {
        try {
            if (fetchedQuizList.length > 0) {
                setPhotoUrl(fetchedQuizList[0].photoUrl);
                setPersonId(fetchedQuizList[0].personId);
                setInitials(fetchedQuizList[0].initials);
                setCurrentRepetitionData(fetchedQuizList[0].repetitionData);
                setAnswer('');
            }
        } catch (error) {
            console.error('Error fetching quiz: ', error);
            notifyError('Error fetching quiz: ' + error);
        }
    }, [fetchedQuizList]);
  

    // HANDLING QUIZ ANSWER
    // HANDLE ANSWER INPUT
    const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    // CALLBACKS TO VALIDATE ANSWER WITH USER TRIGGERING VALIDATION
    const validateAnswer = useCallback(async () => {
        if (photoUrl && personId && selectedMode) {
          try {
            const personAttributes: PersonAttribute[] = await fetchPersonAttributes(personId);
            const typosFriendly = selectedHelps.typosFriendly;
            const normalizedAnswerParts: string[] = answer
              .split(' ')
              .map((part) => normalizeText(part, typosFriendly))
              .sort();
    
            const correctAnswers: string[] = personAttributes
              .filter((pa) =>
                selectedMode.attributes.some((ga) => ga.attribute.id === pa.attribute.id)
              )
              .map((pa) => pa.value);
    
            const normalizedCorrectAnswerParts = correctAnswers
              .map((ans) => ans.split(' ').map((part) => normalizeText(part, typosFriendly)))
              .flat()
              .sort();
    
            let match = false;
            if (selectedMode.operator === 'AND') {
              match = JSON.stringify(normalizedAnswerParts) === JSON.stringify(normalizedCorrectAnswerParts);
            } else if (selectedMode.operator === 'OR') {
              match = normalizedAnswerParts.some((part) => normalizedCorrectAnswerParts.includes(part));
            }
    
            // Determine quality (5 for correct, 0 for incorrect).
            // TO DO: Set quality to 5 when the lowerCased(userAnswer) === lowerCased(correctAnswer) and
            // and quality to 3 when the normalized answers are matching
            // and quality to 0 if not matching at all
            const quality = match ? 5 : 0;
            const updatedRepetitionData: SpacedRepetitionData = updateRepetitionData(currentRepetitionData, quality);
            // SAVE DANS L'HISTORIQUE :
            // SI c'est la première fois qu'on le rencontre, on l'ajoute
            // Sinon on modifie son repetitionData seulement
            if (currentRepetitionData.totalRepetitionCount === 0) {
                setQuizHistory(prevHistory => [
                  ...prevHistory,
                  {
                    photoUrl: photoUrl!,
                    personId: personId!,
                    initials: initials!,
                    correct: match,
                    repetitionData: updatedRepetitionData
                  }
                ]);
            } else {
                setQuizHistory(prevHistory =>
                    prevHistory.map(entry =>
                      entry.personId === personId
                        ? { ...entry, repetitionData: updatedRepetitionData }
                        : entry
                    )
                );
            }
            
            // FAIRE REPETER SI CA N'A PAS MATCHE DU PREMIER COUP et QUE L'INTERVAL N'EST PAS -1 
            if(((match && updatedRepetitionData.totalRepetitionCount > 1) || !match) && updatedRepetitionData.interval !== -1) {
                // console.log('On fait répéter car:' , match, currentRepetitionData.totalRepetitionCount, updatedRepetitionData.interval);
                const insertionIndex: number = updatedRepetitionData.interval < (fetchedQuizList.length-1) ? updatedRepetitionData.interval : (fetchedQuizList.length-1);
                setFetchedQuizList(prevList => {
                  const currentQuestion: QuizEntryWithRepetition = prevList[0];
                  const newList: QuizEntryWithRepetition[] = prevList.slice(1);
                  // Insert the updated current question into newList at the computed insertionIndex.
                  newList.splice(insertionIndex, 0, {
                    ...currentQuestion,
                    repetitionData: updatedRepetitionData
                  });
                  return newList;
                });
                setHasFetched(true);
            } else {
                // console.log('On fait PAS repeter car:' , match, currentRepetitionData.totalRepetitionCount, updatedRepetitionData.interval);
                setFetchedQuizList(prevList => prevList.slice(1));
                setHasFetched(true);
            }

            if (match) {
                notifySuccess('Bien joué');
            } else {
                notifyWarning(`Erreur: la réponse était ${correctAnswers.join(' ')} et vous avez répondu ${answer}`);
            }
              
          } catch (error) {
            console.error('Error validating answer:', error);
            notifyError('Error validating answer: ' + error);
          }
        } else {
          console.error('No photo available or game mode selected');
          notifyError('No photo available or game mode selected');
        }
      }, [answer, photoUrl, personId, selectedMode, selectedHelps, currentRepetitionData]);

    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            validateAnswer();
        }
    }, [validateAnswer]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);

    // GET CORRECTION
    const fetchPersonAttributes = async (personId: number): Promise<PersonAttribute[]> => {
        try {
            const fetchedPersonAttributes: PersonAttribute[] = await getPersonAttributesById(personId);
            return fetchedPersonAttributes;
        } catch (error) {
            console.error('Error fetching person:', error);
            throw error;
        }
    };
    
    // ALLOW TYPOS
    const normalizeText = (text: string, typosFriendly: boolean): string => {
        // Always remove accents and convert to lowercase
        text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .toLowerCase(); // Convert to lowercase
    
        // Apply full normalization only if typosFriendly is true
        if (typosFriendly) {
            text = text.replace(/y/gi, 'i') // Replace 'y' with 'i'
                .replace(/h/gi, '') // Remove silent 'h'
                .replace(/pt/gi, 't') // Simplify "pt" to "t"
                .replace(/sz/gi, 's') // Simplify "sz" to "s"
                .replace(/([a-z])\1+/gi, '$1') // Simplify 1 or more the same letters into 1 letter 
                .replace(/e+$/gi, '') // Remove trailing silent 'e'
                .replace(/[^a-z]/gi, '') // Remove non-alphabetic characters
                .replace(/au/gi, 'o') // Transform "au" to "o"
                .replace(/ck/gi, 'k') // Transform "ck" to "k"
                .replace(/qu/gi, 'k') // Transform "qu" to "k"
                .replace(/que/gi, 'k') // Transform "que" to "k"
                .replace(/en/gi, 'an') // Transform "que" to "k"
                .replace(/c/gi, 'k') // Transform "c" to "k"
                .trim() // Remove spaces at the beginning and end
                .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
    
            text = text.replace(/(ein|ain|in)/gi, 'in') // Transform "ein", "ain", and "in" to "in"
                .replace(/gue/gi, 'g'); // Transform "gue" to "g"
        }
    
        return text;
    }; 

    // CALCULATE REPETITIONS
    const updateRepetitionData = (
        currentData: SpacedRepetitionData | null,
        quality: number
      ): SpacedRepetitionData => {
        const data = currentData || {
            totalRepetitionCount: 0,
            correctRepetitionCount: 0,
            easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
            interval: selectedRepetitionPattern.initialInterval
        };
        const newTotalRepetitionCount: number = data.totalRepetitionCount + 1;
        if (quality < 3) {
            // Reset for low quality answers
            return {
                totalRepetitionCount: newTotalRepetitionCount,
                correctRepetitionCount: 0, // on remet à zero le compte de bonne réponse
                easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
                interval: selectedRepetitionPattern.initialInterval,
            };
        } else {
            const newCorrectRepetitionCount: number = data.correctRepetitionCount + 1;
            if (newTotalRepetitionCount === 1) {
                // First correct attempt: mark as learned (no repetition = infinite interval (-1))
                return {
                    totalRepetitionCount: newTotalRepetitionCount,
                    correctRepetitionCount: newCorrectRepetitionCount,
                    easinessFactor: data.easinessFactor,
                    interval: -1,
                };
            }
            let newInterval: number;
            if (newCorrectRepetitionCount === 1) {
                // console.log('SECOND INTERVAL : ' + selectedRepetitionPattern.secondInterval);
                newInterval = selectedRepetitionPattern.secondInterval;
            } else {
                // L'interval de répétition augmente avec la facilité d'apprentissage et donc la qualité des reponses
                newInterval = Math.round(data.interval * data.easinessFactor);
            }
            // Le facteur de facilité augmente avec la qualité des réponses
            let newEasinessFactor = data.easinessFactor - 0.8 + 0.28 * quality - 0.02 * quality * quality;
            // console.log('new ezFactor de ', newEasinessFactor);
            if (newEasinessFactor < 1.3) newEasinessFactor = 1.3;
            return {
                totalRepetitionCount: newTotalRepetitionCount,
                correctRepetitionCount: newCorrectRepetitionCount,
                easinessFactor: newEasinessFactor,
                interval: newInterval,
            };
        }
      };

    // NAVIGATION IN WEBSITE
    const goBackToMenu = () => {
        navigate('/', { replace: true }); // Adjust the route as necessary
    };

    const openQuizOptions = () => {
      navigate('/quiz/options', { replace: true });
    };
      
    // RETURNING QUIZ TAB
    return (
        <QuizDisplay
            color={color}
            photoUrl={photoUrl}
            initials={initials}
            showInitials={selectedHelps.initialGiven}
            answer={answer}
            handleAnswerChange={handleAnswerChange}
            validateAnswer={validateAnswer}
            openQuizOptions={openQuizOptions}
            goBackToMenu={goBackToMenu}
            isLoading={isLoading}
            hasFetched={hasFetched}
        />
      );
};

export default Quiz;
