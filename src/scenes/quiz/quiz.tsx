import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Tooltip } from '@mui/material';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { getGameModes } from '../../services/business/gamemodes/gameMode.service';
import { getAttributes } from '../../services/business/attributes/attribute.service';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import { GameMode } from '../../models/commons/Game/GameMode/GameMode.model';
import { Attribute } from '../../models/commons/Attribute';
import { GameSortBy } from '../../models/commons/Game/GameOptions/GameSortBy.model';
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model';
import { GameRepetitionPattern, repetitionPatterns, SpacedRepetitionData } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';
import { PersonAttribute } from '../../models/commons/PersonAttribute';
import { getQuizList } from '../../services/business/quiz/quiz.service';
import { QuizEntry, QuizEntryWithRepetition } from '../../models/commons/Game/QuizEntry';
import { getPersonAttributesById } from '../../services/business/persons/person.service';
import OptionCard from './components/OptionCard';
import ModeCard from './components/ModeCard';
import QuizDisplay from './QuizDisplay';
import QuizOptions from './QuizOptions';
import { ReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDto';
import { toReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDtoMapper';
import { QuizHistoryEntry } from '../../models/commons/Game/QuizHistoryEntry';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    // PAGE UTILS
    const navigate = useNavigate();
    const { color } = useThemeColorContext();

    // TOGGLE OPTIONS / QUIZ TAB
    const [showOptions, setShowOptions] = useState<boolean>(false);

    // FULL QUIZ DATA
    const [fetchedQuizList, setFetchedQuizList] = useState<QuizEntryWithRepetition[]>([]);
    const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
    const [backupQuizList, setBackupQuizList] = useState<QuizEntryWithRepetition[]>([]);
    
    // QUIZ 1 QUESTION
    const [currentRound, setCurrentRound] = useState<number>(1);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [personId, setPersonId] = useState<number | null>(null);
    const [initials, setInitials] = useState<string | null>(null);
    const [answer, setAnswer] = useState<string>('');


    // OPTIONS
    // OPTIONS MENU
    const [gameOptions, setGameOptions] = useState<GameOptions>({
        id: Date.now(),
        gameMode: null,
        filters: [],
        sortBy: [],
        repetitionPattern: repetitionPatterns.never,
        initialGiven: false,
        typosFriendly: false
    });
    const [criticalOptionsChangedFlagCounter, setCriticalOptionsChangedFlagCounter] = useState<number>(0);

    // MODES
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [modesList, setModesList] = useState<GameMode[]>([]);
    // FILTERS
    const [filters, setFilters] = useState<Attribute[]>([]);
    const [openFilterModal, setOpenFilterModal] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<GameFilter[]>([]);
    // SORTING METHODS
    const [sorts, setSorts] = useState<Attribute[]>([]);
    const [sortingMethods, setSortingMethods] = useState<GameSortBy[]>([]);
    const [openSortModal, setOpenSortModal] = useState(false);

    // REPETITIONS
    const [selectedRepetitionPattern, setSelectedRepetitionPattern] = useState<GameRepetitionPattern>(repetitionPatterns.never);
    const [repeatSettings, setRepeatSettings] = useState<{
        initialRepetitionCount: number;
        initialEasinessFactor: number;
        initialInterval: number | "Infinity";
    }>({
        initialRepetitionCount: repetitionPatterns.never.initialRepetitionCount,
        initialEasinessFactor: repetitionPatterns.never.initialEasinessFactor,
        initialInterval: repetitionPatterns.never.initialInterval,
    });
    const [currentRepetitionData, setCurrentRepetitionData] = useState<SpacedRepetitionData | null>(null);

    
    // HELPS
    const helpsList = ['Typos friendly', 'Initial given'];
    const [selectedHelps, setSelectedHelps] = useState<string>('None');

    // INIT
    useEffect(() => {
        (async () => {
          await fetchAttributes();
          await fetchModes();
        })();
    }, []);

    // Some Critical options changed (as during initialization)
    useEffect(() => {
        if (criticalOptionsChangedFlagCounter > 0) {
            console.log(
                `Critical options were changed for the ${criticalOptionsChangedFlagCounter}n time: fetching quiz list!`
              );
              fetchQuizList();
        }
    }, [criticalOptionsChangedFlagCounter]);

    // FetchedQuizList changed: update question (photo, person, answer)
    useEffect(() => {
        fetchQuiz();
    }, [fetchedQuizList]);

    // INIT FULL QUIZ WITH OPTIONS
    const fetchQuizList = async () => {
        try {
          const reducedGameOptionsDto: ReducedGameOptionsDto = toReducedGameOptionsDto(gameOptions);
          console.log('FETCHING QUIZ LIST ' + JSON.stringify(reducedGameOptionsDto));
          const quizList: QuizEntry[] = await getQuizList(reducedGameOptionsDto);
          // Enrich each quiz entry with an initial repetitionData
          const enrichedQuizList: QuizEntryWithRepetition[] = quizList.map(qe => ({
            ...qe,
            repetitionData: {
              repetitionCount: 0,
              easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
              interval: selectedRepetitionPattern.initialInterval === Infinity
                        ? 0
                        : Number(selectedRepetitionPattern.initialInterval),
              nextDueRound: currentRound + (selectedRepetitionPattern.initialInterval === Infinity
                        ? 0
                        : Number(selectedRepetitionPattern.initialInterval))
            }
          }));
          // Save a backup copy as well as the working list:
          setBackupQuizList(enrichedQuizList);
          setFetchedQuizList(enrichedQuizList);
          setCurrentRound(1);
          setCurrentRepetitionData(null);
        } catch (error) {
          console.error('Error fetching quiz list: ', error);
          notifyError('Error fetching quiz list: ' + error);
        }
      };

    // INIT 1 QUESTION
    const fetchQuiz = async () => {
        try {
          if (fetchedQuizList.length) {
            console.log('Fetching photo quiz: ' + fetchedQuizList[0].photoUrl);
            setPhotoUrl(fetchedQuizList[0].photoUrl);
            setPersonId(fetchedQuizList[0].personId);
            setInitials(fetchedQuizList[0].initials);
            setAnswer('');
            if (!currentRepetitionData && selectedRepetitionPattern) {
              // Initialize repetition data for the new item.
              setCurrentRepetitionData({
                repetitionCount: 0,
                easinessFactor: selectedRepetitionPattern.initialEasinessFactor,
                interval: selectedRepetitionPattern.initialInterval === Infinity ? 0 : Number(selectedRepetitionPattern.initialInterval),
                nextDueRound: currentRound + (selectedRepetitionPattern.initialInterval === Infinity ? 0 : Number(selectedRepetitionPattern.initialInterval)),
              });
            }
          }
        } catch (error) {
          console.error('Error fetching quiz: ', error);
          notifyError('Error fetching quiz: ' + error);
        }
      };

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
            const typosFriendly = selectedHelps.includes('Typos friendly');
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
            const updatedRepetitionData: SpacedRepetitionData = updateRepetitionData(currentRepetitionData, quality, currentRound);
            // Save the updated repetition data for this item in your history:
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
    
            // If the answer is correct, remove it from the quiz list.
            // Otherwise, if incorrect, reinsert it so that it will be repeated in a future round.
            if (match) {
                notifySuccess('Bien joué');
                // Check if this is the first correct answer:
                if (currentRepetitionData && currentRepetitionData.repetitionCount === 0) {
                  // Remove permanently (do not reinsert)
                  setFetchedQuizList(prevList => prevList.slice(1));
                } else {
                  // Otherwise, update the repetition data and reinsert at the calculated index.
                  const insertionIndex: number = updatedRepetitionData.nextDueRound - currentRound;
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
                }
                setCurrentRound(prev => prev + 1);
                // Reset current repetition data for the next question.
                setCurrentRepetitionData(null);
              } else {
                notifyWarning(`Erreur: la réponse était ${correctAnswers.join(' ')} et vous avez répondu ${answer}`);
                // For an incorrect answer, update its repetitionData and reinsert it.
                if (updatedRepetitionData.nextDueRound > currentRound) {
                  setFetchedQuizList(prevList => {
                    const currentQuestion: QuizEntryWithRepetition = prevList[0];
                    const newList: QuizEntryWithRepetition[] = prevList.slice(1);
                    const insertionIndex: number = updatedRepetitionData.nextDueRound - currentRound;
                    newList.splice(insertionIndex, 0, {
                      ...currentQuestion,
                      repetitionData: updatedRepetitionData
                    });
                    return newList;
                  });
                  // Do not increment currentRound: the question will reappear later.
                } else {
                  // If due immediately, you could choose to leave it at the front.
                  setFetchedQuizList(prevList => {
                    const currentQuestion = prevList[0];
                    return [{ ...currentQuestion, repetitionData: updatedRepetitionData }, ...prevList.slice(1)];
                  });
                }
              }
              setAnswer('');
              
          } catch (error) {
            console.error('Error validating answer:', error);
            notifyError('Error validating answer: ' + error);
          }
        } else {
          console.error('No photo available or game mode selected');
          notifyError('No photo available or game mode selected');
        }
      }, [answer, photoUrl, personId, selectedMode, selectedHelps, currentRound, currentRepetitionData]);

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
                .replace(/([bcdfghjklmnpqrstvwxyz])\1/gi, '$1') // Simplify double consonants
                .replace(/e+$/gi, '') // Remove trailing silent 'e'
                .replace(/[^a-z]/gi, '') // Remove non-alphabetic characters
                .replace(/au/gi, 'o') // Transform "au" to "o"
                .replace(/ck/gi, 'k') // Transform "ck" to "k"
                .replace(/qu/gi, 'k') // Transform "qu" to "k"
                .replace(/que/gi, 'k') // Transform "que" to "k"
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
        quality: number,
        currentRound: number
      ): SpacedRepetitionData => {
        const data = currentData || {
          repetitionCount: 0,
          easinessFactor: 2.5,
          interval: 1,
          nextDueRound: currentRound + 1,
        };
    
        if (quality < 3) {
          // Reset for low quality answers
          return {
            repetitionCount: 0,
            easinessFactor: 2.5,
            interval: 1,
            nextDueRound: currentRound + 1,
          };
        } else {
          if (data.repetitionCount === 0) {
            // First correct attempt: mark as learned (no repetition)
            return {
              repetitionCount: 1,
              easinessFactor: data.easinessFactor,
              interval: Infinity,
              nextDueRound: Infinity,
            };
          }
          const newRepetitionCount = data.repetitionCount + 1;
          let newInterval: number;
          if (newRepetitionCount === 2) {
            newInterval = 4;
          } else {
            // L'interval de répétition augmente avec la facilité d'apprentissage et donc la qualité des reponses
            newInterval = Math.round(data.interval * data.easinessFactor);
          }
          // Le facteur de facilité augmente avec la qualité des réponses
          let newEasinessFactor = data.easinessFactor - 0.8 + 0.28 * quality - 0.02 * quality * quality;
          if (newEasinessFactor < 1.3) newEasinessFactor = 1.3;
          return {
            repetitionCount: newRepetitionCount,
            easinessFactor: newEasinessFactor,
            interval: newInterval,
            nextDueRound: currentRound + newInterval,
          };
        }
      };

    // OPTIONS
    // INIT OPTIONS
    const fetchAttributes = async () => {
        try {
            const fetchedAttributes: Attribute[] = await getAttributes();
            setFilters(fetchedAttributes.filter(attr => attr.filter === true));
            setSorts(fetchedAttributes.filter(attr => attr.sort === true));
        } catch (error) {
            console.error('Error fetching attributes:', error);
        }
    };

    // OPEN / CLOSE OPTIONS - SAVE / CANCEL OPTIONS CHANGES
    const toggleOptions = (saveChanges = false) => {
        console.log('ShowOptions toggled from:' + showOptions);
        if(showOptions) { // CLOSING OPTIONS
            if (saveChanges) {
                console.log('Trying to save options');
                const gameModeChanged: boolean = gameOptions.gameMode !== selectedMode;
                const filtersChanged: boolean = JSON.stringify(gameOptions.filters) !== JSON.stringify(selectedFilters);
                const sortByChanged: boolean = JSON.stringify(gameOptions.sortBy) !== JSON.stringify(sortingMethods);
                const repetitionPatternChanged: boolean = gameOptions.repetitionPattern !== selectedRepetitionPattern;
                const initialGivenChanged: boolean = gameOptions.initialGiven !== selectedHelps.includes('Initial given');
                const typosFriendlyChanged: boolean = gameOptions.typosFriendly !== selectedHelps.includes('Typos friendly');
                const changesMade: boolean = (gameModeChanged || filtersChanged ||
                                             sortByChanged || repetitionPatternChanged ||
                                             initialGivenChanged || typosFriendlyChanged);
    
                if (changesMade) {
                    console.log('Options were changed: let\'s continue');
                    setGameOptions({
                        id: Date.now(),
                        gameMode: selectedMode!,
                        filters: selectedFilters  || [],
                        sortBy: sortingMethods  || [],
                        repetitionPattern: selectedRepetitionPattern,
                        initialGiven: selectedHelps.includes('Initial given'),
                        typosFriendly: selectedHelps.includes('Typos friendly')
                    });
    
                    if (gameModeChanged || filtersChanged || sortByChanged) {
                        console.log('Critical options were changed: let\'s increment criticalOptionsChangedFlagCounter');
                        setCriticalOptionsChangedFlagCounter(prev => prev + 1);
                    }
                    if (gameModeChanged) {
                        // TODO : RESET PROGRESS (NO PROGRESS YET, NO HISTORIC YET)
                    }
                 }
            } else {
                // Revert interim states to last committed state if changes were made but user cancelled
                setSelectedMode(gameOptions.gameMode);
                setSelectedFilters(gameOptions.filters);
                setSortingMethods(gameOptions.sortBy);
                setSelectedRepetitionPattern(gameOptions.repetitionPattern);
                setSelectedHelps(gameOptions.initialGiven ? 'Initial given' : 'Typos friendly');
            }
        }
        
        setShowOptions(!showOptions);  // Toggle the visibility of the options panel
    };

    // OPTIONS: MODES
    const fetchModes = async () => {
        try {
            const fetchedModes = await getGameModes();
            setModesList(fetchedModes);
            if (fetchedModes.length > 0) {
                setSelectedMode(fetchedModes[0]); // Set the first mode as the default selected mode
                setGameOptions((prevOptions) => ({
                    ...prevOptions, // Spread previous options to keep all other values
                    gameMode: fetchedModes[0],
                }));
                console.log('FETCHING MODES');
                setCriticalOptionsChangedFlagCounter(prev => prev + 1);
                
            }
        } catch (error) {
            console.error('Error fetching game themes:', error);
        }
    };

    const renderModes = () => {
        return modesList.map((mode) => (
            <ModeCard
                key={mode.id}
                mode={mode}
                isSelected={selectedMode?.id === mode.id}
                onSelect={() => handleSelectMode(mode)}
            />
        ));
    };

    const handleSelectMode = (mode: GameMode) => {
        setSelectedMode(mode);
    };

    // OPTIONS: FILTERS
    const handleAddFilter = (filter: GameFilter) => {
        setSelectedFilters(prevFilters => [...prevFilters, filter]);
        setOpenFilterModal(false);
    };

    const handleDeleteFilter = (index: number) => {
        const newFilters = selectedFilters.filter((_, i) => i !== index);
        setSelectedFilters(newFilters);
    };
    
    const renderFilters = () => {
        if (selectedFilters.length === 0) {
            return <Chip label="No filters" disabled />;
        }
        return selectedFilters.map((filter, index) => (
            <Chip
                key={index}
                label={`${filter.attribute.name} [${filter.minValue} - ${filter.maxValue}]`}
                onDelete={() => handleDeleteFilter(index)}
            />
        ));
    };

    // OPTIONS: SORTING METHODS
    const handleAddSortingMethod = (sortBy: GameSortBy) => {
        setSortingMethods([...sortingMethods, sortBy]);
        setOpenSortModal(false);
    };
    
    const handleDeleteSortingMethod = (index: number) => {
        const newSortingMethods = sortingMethods.filter((_, i) => i !== index);
        setSortingMethods(newSortingMethods);
    };

    const renderSortingMethods = () => {
        if (sortingMethods.length === 0) {
            return <Chip label="No sorting methods" disabled />;
        }
        return sortingMethods.map((method, index) => (
            <Chip key={index} label={`${method.attribute.name} (${method.order})`} onDelete={() => handleDeleteSortingMethod(index)} />
        ));
    };
    
    // OPTIONS: REPETITIONS
    const renderRepetitionOptions = () => {
        return Object.keys(repetitionPatterns).map((option) => (
            <Tooltip key={option} title={
            option.toLowerCase() === 'optimal'
                ? 'Optimal: We will automatically schedule reviews based on your performance.'
                : option.toLowerCase() === 'immediate'
                ? 'Immediate: The question will repeat right away if answered incorrectly.'
                : option.toLowerCase() === 'never'
                ? 'Never: Do not repeat this question.'
                : 'Custom: Adjust advanced repetition parameters.'
            }>
            <OptionCard
                option={option.charAt(0).toUpperCase() + option.slice(1)}
                isSelected={selectedRepetitionPattern.patternName === option.toLowerCase()}
                onSelect={() => handleSelectRepetition(option)}
            />
            </Tooltip>
        ));
    };

    const handleSelectRepetition = (option: string) => {
        const pattern = repetitionPatterns[option.toLowerCase() as keyof typeof repetitionPatterns];
        if (option === 'Custom') {
          setSelectedRepetitionPattern({
            patternName: 'custom',
            initialRepetitionCount: repeatSettings.initialRepetitionCount,
            initialEasinessFactor: repeatSettings.initialEasinessFactor,
            initialInterval: repeatSettings.initialInterval,
          });
        } else {
          setSelectedRepetitionPattern(pattern);
        }
    };      
      
    
    // OPTIONS: HELPS
    const renderHelpsOptions = () => {
        return helpsList.map((option) => (
            <OptionCard
                key={option}
                option={option}
                isSelected={selectedHelps === option}
                onSelect={handleSelectHelps}
            />
        ));
    };

    const handleSelectHelps = (option: string) => {
        setSelectedHelps(option);
    };

    // NAVIGATION IN WEBSITE
    const goBackToMenu = () => {
        navigate('/', { replace: true }); // Adjust the route as necessary
    };

    // RETURNING OPTIONS TAB
    if (showOptions) {
        return (
          <QuizOptions
            color={color}
            toggleOptions={toggleOptions}
            renderModes={renderModes}
            renderFilters={renderFilters}
            openFilterModal={openFilterModal}
            setOpenFilterModal={setOpenFilterModal}
            filters={filters}
            handleAddFilter={handleAddFilter}
            renderSortingMethods={renderSortingMethods}
            openSortModal={openSortModal}
            setOpenSortModal={setOpenSortModal}
            sorts={sorts}
            handleAddSortingMethod={handleAddSortingMethod}
            renderRepetitionOptions={renderRepetitionOptions}
            selectedRepetitionPattern={selectedRepetitionPattern}
            repeatSettings={repeatSettings}
            setRepeatSettings={setRepeatSettings}
            renderHelpsOptions={renderHelpsOptions}
          />
        );
      }
      
    // RETURNING QUIZ TAB
    return (
        <QuizDisplay
            color={color}
            photoUrl={photoUrl}
            answer={answer}
            handleAnswerChange={handleAnswerChange}
            validateAnswer={validateAnswer}
            toggleOptions={toggleOptions}
            goBackToMenu={goBackToMenu}
        />
      );
};

export default Quiz;
