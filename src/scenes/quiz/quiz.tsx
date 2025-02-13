import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton, FormGroup, Divider, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { getGameModes } from '../../services/business/gamemodes/gameMode.service';
import { getAttributes } from '../../services/business/attributes/attribute.service';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import { GameMode } from '../../models/commons/Game/GameMode/GameMode.model';
import { AddFilterModal } from './components/AddFilterModal';
import { Attribute } from '../../models/commons/Attribute';
import { AddSortModal } from './components/AddSortModal';
import { GameSortBy } from '../../models/commons/Game/GameOptions/GameSortBy.model';
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model';
import { GameRepetitionPattern, repetitionPatterns } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';
import { PersonAttribute } from '../../models/commons/PersonAttribute';
import { getQuizList } from '../../services/business/quiz/quiz.service';
import { QuizEntry } from '../../models/commons/Game/QuizEntry';
import { getPersonAttributesById } from '../../services/business/persons/person.service';
import OptionCard from './components/OptionCard';
import ModeCard from './components/ModeCard';
import QuizDisplay from './QuizDisplay';
import QuizOptions from './QuizOptions';
import { ReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDto';
import { toReducedGameOptionsDto } from '../../services/dto/ReducedGameOptionsDtoMapper';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    // PAGE UTILS
    const navigate = useNavigate();
    const { color } = useThemeColorContext();

    // TOGGLE OPTIONS / QUIZ TAB
    const [showOptions, setShowOptions] = useState<boolean>(false);

    // FULL QUIZ
    const [fetchedQuizList, setFetchedQuizList] = useState<QuizEntry[]>([]);

    // QUIZ 1 QUESTION
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

    // FILTERS AND SORTING METHODS
    const [attributes, setAttributes] = useState<Attribute[]>([]);
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
    const [repeatSettings, setRepeatSettings] = useState<{ frequency: number; quantity: number }>({
        frequency: repetitionPatterns.never.frequency,
        quantity: repetitionPatterns.never.quantity,
    });

    // HELPS
    const helpsList = ['Typos friendly', 'Initial given'];
    const [selectedHelps, setSelectedHelps] = useState<string>('None');

    // INIT
    useEffect(() => {
        const fetchData = async () => {
            await fetchAttributes();
            await fetchModes();
        };

        fetchData();
    }, []);

    // Some Critical options changed (as during initialization)
    useEffect(() => {
        if (criticalOptionsChangedFlagCounter > 0) {
            console.log('Critical options were changed for the '+ criticalOptionsChangedFlagCounter + 'n times : fetch quiz list !');
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
            setFetchedQuizList(await getQuizList(reducedGameOptionsDto));
        } catch (error) {
            console.error('Error fetching quiz list: ', error);
            notifyError("Error fetching quiz list: " + error);
        }
    };

    // INIT 1 QUESTION
    const fetchQuiz = async () => {
        try {
            if (fetchedQuizList.length) {
                console.log("fetching photo quiz: " + fetchedQuizList[0].photoUrl);
                setPhotoUrl(fetchedQuizList[0].photoUrl);
                setPersonId(fetchedQuizList[0].personId);
                setInitials(fetchedQuizList[0].initials);
                setAnswer('');
            }
        } catch (error) {
            console.error('Error fetching photo: ', error);
            notifyError("Error fetching photo: " + error);
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
            
            // Split the user's answer into parts, then normalize each part
            const normalizedAnswerParts: string[] = answer.split(' ').map(part => normalizeText(part, typosFriendly)).sort();
      
            // Get the correct answers (non-normalized) to display in the notification
            const correctAnswers: string[] = personAttributes
              .filter((pa) =>
                selectedMode.attributes.some((ga) => ga.attribute.id === pa.attribute.id)
              )
              .map((pa) => pa.value);
            
            // Split each correct answer into parts, then normalize each part
            const normalizedCorrectAnswerParts = correctAnswers
              .map((answer) => answer.split(' ').map(part => normalizeText(part, typosFriendly)))
              .flat()
              .sort();
      
            let match = false;
      
            if (selectedMode.operator === 'AND') {
              // AND: All parts must match
              match = JSON.stringify(normalizedAnswerParts) === JSON.stringify(normalizedCorrectAnswerParts);
            } else if (selectedMode.operator === 'OR') {
              // OR: At least one part must match
              match = normalizedAnswerParts.some(part => normalizedCorrectAnswerParts.includes(part));
            }
            
            if (match) {
                notifySuccess('Bien joué');
                // Retirer le premier élément de la liste :
                setFetchedQuizList(prevList => {
                    const newList = prevList.slice(1);
                    if (newList.length === 0) {
                        // Si la liste est vide, on peut recharger la liste ou afficher un message
                        fetchQuizList();
                    }
                    return newList;
                });
                setAnswer('');
            } else {
              // Show non-normalized values in the notification
              notifyWarning(
                `Erreur: la réponse était ${correctAnswers.join(' ')} et vous avez répondu ${answer}`
              );
            }
          } catch (error) {
            console.error('Error fetching person:', error);
            notifyError('Error fetching person: ' + error);
          }
        } else {
          console.error('No photo available or game mode selected');
          notifyError('No photo available or game mode selected');
        }
      }, [answer, photoUrl, selectedMode, selectedHelps]);

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


    // OPTIONS
    // INIT OPTIONS
    const fetchAttributes = async () => {
        try {
            const fetchedAttributes: Attribute[] = await getAttributes();
            setAttributes(fetchedAttributes);

            // Filter and sort attributes client-side
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
            <OptionCard
                key={option}
                option={option.charAt(0).toUpperCase() + option.slice(1)}
                isSelected={selectedRepetitionPattern.patternName === option.toLowerCase()}
                onSelect={() => handleSelectRepetition(option)}
            />
        ));
    };
    
    const handleSelectRepetition = (option: string) => {
        const pattern = repetitionPatterns[option.toLowerCase() as keyof typeof repetitionPatterns];
        
        if (option === 'Custom') {
            setSelectedRepetitionPattern({
                patternName: 'custom',
                frequency: repeatSettings.frequency,
                quantity: repeatSettings.quantity
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
