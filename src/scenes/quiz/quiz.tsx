import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton, FormGroup, Divider, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { getPersonBasicOfPhoto, getPhotoWithCriteria } from '../../services/business/photos/photo.service';
import { getGameModes } from '../../services/business/gamemodes/gameMode.service';
import { getAttributes } from '../../services/business/attributes/attribute.service';
import { Photo } from '../../models/commons/Photo';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import { PersonBasic } from '../../models/commons/PersonBasic';
import { GameMode } from '../../models/commons/Game/GameMode/GameMode.model';
import { AddFilterModal } from './components/AddFilterModal';
import { Attribute } from '../../models/commons/Attribute';
import { AddSortModal } from './components/AddSortModal';
import { GameSortBy } from '../../models/commons/Game/GameOptions/GameSortBy.model';
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model';
import { GameRepetitionPattern, repetitionPatterns } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';

interface QuizProps {}

const ModeCard = ({ mode, isSelected, onSelect }: { mode: GameMode; isSelected: boolean; onSelect: (mode: GameMode) => void }) => (
    <Chip
        label={mode.title}
        onClick={() => onSelect(mode)}
        color={isSelected ? 'primary' : 'default'}
        style={{ margin: 4, cursor: 'pointer' }}
    />
);

const OptionCard = ({ option, isSelected, onSelect }: { option: string; isSelected: boolean; onSelect: (option: string) => void }) => (
    <Chip
        label={option}
        onClick={() => onSelect(option)}
        color={isSelected ? 'primary' : 'default'}
        style={{ margin: 4, cursor: 'pointer' }}
    />
);

export const Quiz: React.FC<QuizProps> = () => {
    const navigate = useNavigate();
    const [answer, setAnswer] = useState<string>('');
    const { color } = useThemeColorContext();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [showOptions, setShowOptions] = useState<boolean>(false); // Toggle state for options form

    // Option states
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [modesList, setModesList] = useState<GameMode[]>([]);

    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [filters, setFilters] = useState<Attribute[]>([]);
    const [openFilterModal, setOpenFilterModal] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<GameFilter[]>([]);

    const [sorts, setSorts] = useState<Attribute[]>([]);
    const [sortingMethods, setSortingMethods] = useState<GameSortBy[]>([]);
    const [openSortModal, setOpenSortModal] = useState(false);

    const [selectedRepetitionPattern, setSelectedRepetitionPattern] = useState<GameRepetitionPattern>(repetitionPatterns.never);
    const [repeatSettings, setRepeatSettings] = useState<{ frequency: number; quantity: number }>({
        frequency: repetitionPatterns.never.frequency,
        quantity: repetitionPatterns.never.quantity,
    });

    const helpsList = ['Typos friendly', 'Initial given'];
    const [selectedHelps, setSelectedHelps] = useState<string>('None');

    useEffect(() => {
        if (!showOptions && selectedMode) {
            fetchPhotoWithOptions();
        } else {
            fetchAttributes();
            fetchModes();
        }
    }, [showOptions, selectedMode]);

    const fetchPhotoWithOptions = async () => {
        try {
            const gameOptions: GameOptions = {
                id: Date.now(),
                gameMode: selectedMode!,
                filters: selectedFilters  || [],
                sortBy: sortingMethods  || [],
                repetitionPattern: selectedRepetitionPattern,
                typosFriendly: selectedHelps.includes('Typos friendly'),
                initialGiven: selectedHelps.includes('Initial given')
            };
            const fetchedPhoto: Photo = await getPhotoWithCriteria(gameOptions);
            setPhoto(fetchedPhoto);
            setAnswer('');
        } catch (error) {
            console.error('Error fetching photo with criteria:', error);
            notifyError("Error fetching photo: " + error);
        }
    };

    const fetchPerson = async (photoId: number): Promise<PersonBasic> => {
        try {
            const fetchedPerson: PersonBasic = await getPersonBasicOfPhoto(photoId);
            return fetchedPerson;
        } catch (error) {
            console.error('Error fetching person:', error);
            throw error;
        }
    };

    const fetchModes = async () => {
        if (modesList.length > 0) {
            return;
        }
        try {
            const fetchedModes = await getGameModes();
            setModesList(fetchedModes);
            if (fetchedModes.length > 0) {
                setSelectedMode(fetchedModes[0]); // Set the first mode as the default selected mode
            }
        } catch (error) {
            console.error('Error fetching game themes:', error);
        }
    };

    const fetchAttributes = async () => {
        if (attributes.length > 0) {
            return;
        }
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

    const normalizeText = (text: string): string => {
        text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/y/gi, 'i') // Replace 'y' with 'i'
            .replace(/h/gi, '') // Remove silent 'h'
            .replace(/pt/gi, 't') // Simplify "pt" to "t"
            .replace(/sz/gi, 's') // Simplify "sz" to "s"
            .replace(/([bcdfghjklmnpqrstvwxyz])\1/gi, '$1') // Simplify double consonants
            .replace(/e+$/gi, '') // Remove trailing silent 'e'
            .replace(/[^a-z]/gi, '') // Remove non-alphabetic characters
            .toLowerCase(); // Convert to lowercase

        text = text.replace(/au/gi, 'o') // Transform "au" to "o"
            .replace(/ck/gi, 'k') // Transform "ck" to "k"
            .replace(/qu/gi, 'k') // Transform "qu" to "k"
            .replace(/que/gi, 'k') // Transform "que" to "k"
            .replace(/c/gi, 'k') // Transform "c" to "k"
            .trim() // Remove spaces at the beginning and end
            .replace(/\s+/g, ' '); // Replace multiple spaces with a single space

        text = text.replace(/(ein|ain|in)/gi, 'in') // Transform "ein", "ain" and "in" to "in"
            .replace(/gue/gi, 'g'); // Transform "gue" to "g"

        return text;
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

    const handleSelectMode = (mode: GameMode) => {
        setSelectedMode(mode);
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
    

    const handleSelectHelps = (option: string) => {
        setSelectedHelps(option);
    };

    const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    const validateAnswer = useCallback(async () => {
        if (photo) {
            try {
                const person = await fetchPerson(photo.id);
                const normalizedAnswer = normalizeText(answer);
                const normalizedCorrectAnswer = normalizeText(person.firstName);
                if (normalizedAnswer === normalizedCorrectAnswer) {
                    notifySuccess("Bien joué");
                    fetchPhotoWithOptions();
                    setAnswer('');
                } else {
                    notifyWarning("Erreur: la reponse etait " + person.firstName + " et vous avez répondu " + answer);
                }
            } catch (error) {
                notifyError("Error fetching person: " + error);
            }
        } else {
            notifyError("No photo available");
        }
    }, [answer, photo]);

    const toggleOptions = () => {
        setShowOptions(!showOptions);
    };

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

    const goBackToMenu = () => {
        navigate('/', { replace: true }); // Adjust the route as necessary
    };

    const handleAddFilter = (filter: GameFilter) => {
        setSelectedFilters(prevFilters => [...prevFilters, filter]);
        setOpenFilterModal(false);
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
    

    const handleDeleteFilter = (index: number) => {
        const newFilters = selectedFilters.filter((_, i) => i !== index);
        setSelectedFilters(newFilters);
    };

    const handleAddSortingMethod = (sortBy: GameSortBy) => {
        setSortingMethods([...sortingMethods, sortBy]);
        setOpenSortModal(false);
    };

    const renderSortingMethods = () => {
        if (sortingMethods.length === 0) {
            return <Chip label="No sorting methods" disabled />;
        }
        return sortingMethods.map((method, index) => (
            <Chip key={index} label={`${method.attribute.name} (${method.order})`} onDelete={() => handleDeleteSortingMethod(index)} />
        ));
    };

    const handleDeleteSortingMethod = (index: number) => {
        const newSortingMethods = sortingMethods.filter((_, i) => i !== index);
        setSortingMethods(newSortingMethods);
    };

    if (showOptions) {
        return (
            <Box sx={{ padding: '20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1vh' }}>
                    <IconButton
                        onClick={toggleOptions}
                        sx={{
                            color: color,
                            boxShadow: `0 0 8px ${color}`,
                            transition: 'box-shadow 0.2s ease-in-out',
                            backdropFilter: 'blur(6px)',
                        }}
                        aria-label="Back to quiz"
                    >
                        <ArrowBackIcon style={{ color }} />
                    </IconButton>
                    <Typography variant="h4" style={{ color: color, textShadow: `0 0 8px ${color}` }}>
                        Quiz Options
                    </Typography>
                </Box>
                <FormGroup sx={{ width: '100%' }}>
                    <Divider><Typography variant="h6">Mode</Typography></Divider>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {renderModes()}
                    </Box>
                    <Divider><Typography variant="h6">Filters</Typography></Divider>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {renderFilters()}
                        </Box>
                        <Button onClick={() => setOpenFilterModal(true)} variant="contained" size="small">
                            Add filter
                        </Button>
                    </Box>
                    <AddFilterModal
                        open={openFilterModal}
                        attributes={filters}
                        onSave={handleAddFilter}
                        onClose={() => setOpenFilterModal(false)}
                    />
                    <Divider><Typography variant="h6">Sorting Methods</Typography></Divider>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {renderSortingMethods()}
                        </Box>
                        <Button onClick={() => setOpenSortModal(true)} variant="contained" size="small">
                            Add Sorting Method
                        </Button>
                    </Box>
                    <AddSortModal
                        open={openSortModal}
                        attributes={sorts}
                        onSave={handleAddSortingMethod}
                        onClose={() => setOpenSortModal(false)}
                    />

                    <Divider><Typography variant="h6">Learning repetition</Typography></Divider>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {renderRepetitionOptions()}
                    </Box>
                    {selectedRepetitionPattern.patternName === 'custom' && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TextField
                                type="number"
                                label="Frequency"
                                sx={{ m: 1 }}
                                value={repeatSettings.frequency}
                                onChange={(e) => {
                                    const newFrequency = parseInt(e.target.value);
                                    setRepeatSettings({ ...repeatSettings, frequency: newFrequency });
                                    setSelectedRepetitionPattern({
                                        ...selectedRepetitionPattern,
                                        frequency: newFrequency
                                    });
                                }}
                            />
                            <TextField
                                type="number"
                                label="Quantity"
                                sx={{ m: 1 }}
                                value={repeatSettings.quantity}
                                onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value);
                                    setRepeatSettings({ ...repeatSettings, quantity: newQuantity });
                                    setSelectedRepetitionPattern({
                                        ...selectedRepetitionPattern,
                                        quantity: newQuantity
                                    });
                                }}
                            />
                        </Box>
                    )}

                    <Divider><Typography variant="h6">Helps</Typography></Divider>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {renderHelpsOptions()}
                    </Box>
                </FormGroup>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '7vh', marginTop: '15px' }}>
                    <Button variant="outlined" className='menu nobg' onClick={toggleOptions} sx={{ marginRight: '1vw' }}>
                        Cancel
                    </Button>
                    <Button variant="contained" className='menu' onClick={toggleOptions}>
                        Save Options
                    </Button>
                </Box>
            </Box>
        );
    }
    return (
        <div className="quiz" style={{ padding: '20px', width: '100%', height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1vh' }}>
                    <IconButton
                        onClick={goBackToMenu}
                        sx={{
                            color: color,
                            boxShadow: `0 0 8px ${color}`,
                            transition: 'box-shadow 0.2s ease-in-out',
                            backdropFilter: 'blur(6px)',
                        }}
                        aria-label="Back to menu"
                    >
                        <ArrowBackIcon style={{ color }} />
                    </IconButton>
                    <Typography variant="h4" style={{ color: color, textShadow: `0 0 8px ${color}` }}>
                        Hello Quiz
                    </Typography>
                </Box>
                {photo ? (
                    <img
                        src={`photos/${photo.url}`}
                        alt="Quiz"
                        style={{ width: 'auto', height: '56vh', zIndex: 1, boxShadow: `0 0 20px ${color}` }}
                    />
                ) : (
                    <Skeleton variant="rectangular" width="100%" height={300} animation="wave" style={{ backdropFilter: 'blur(3px)', backgroundColor: color + '10' }} />
                )}
                <TextField
                    variant="outlined"
                    placeholder="Type your answer here..."
                    value={answer}
                    className='menu'
                    onChange={handleAnswerChange}
                    sx={{ margin: '20px 0', width: '100%' }} // Adjust width as needed
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '7vh' }}>
                    <Button variant="outlined" className='menu nobg' onClick={toggleOptions} sx={{ marginRight: '1vw' }}>
                        Options
                    </Button>
                    <Button variant="contained" className='menu' onClick={validateAnswer}>
                        Submit Answer
                    </Button>
                </Box>
            </Box>
        </div>
    );
};

export default Quiz;
