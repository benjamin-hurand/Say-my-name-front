/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton, FormGroup, FormControlLabel, InputLabel, MenuItem, Select, Switch } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { getPersonBasicOfPhoto, getPhoto } from '../../services/business/quiz/quiz.service';
import { Photo } from '../../models/commons/Photo';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification/toast.service';
import { PersonBasic } from '../../models/commons/PersonBasic';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    const navigate = useNavigate();
    const [answer, setAnswer] = useState<string>('');
    const { color } = useThemeColorContext();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [showOptions, setShowOptions] = useState<boolean>(false); // Toggle state for options form

    // Option states
    const [isHowActive, setHowActive] = useState(false);
    const [isWhoActive, setWhoActive] = useState(false);
    const [isRepeatActive, setRepeatActive] = useState(false);
    const [repeatSettings, setRepeatSettings] = useState({ frequency: 0, quantity: 0 });

    useEffect(() => {
        if (!showOptions) {
            fetchPhoto();
        }
    }, [showOptions]);

    const fetchPhoto = async () => {
        try {
            const fetchedPhoto: Photo = await getPhoto();
            setPhoto(fetchedPhoto);
            console.log("photo fetched: " + JSON.stringify(fetchedPhoto));
        } catch (error) {
            console.error('Error fetching photo:', error);
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

    const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    const fetchPerson = async (photoId: number): Promise<PersonBasic> => {
        try {
            const fetchedPerson: PersonBasic = await getPersonBasicOfPhoto(photoId);
            console.log("fetchedPerson: " + JSON.stringify(fetchedPerson));
            return fetchedPerson;
        } catch (error: any) {
            console.error('Error fetching person:', error);
            throw error;
        }
    };

    const validateAnswer = useCallback(async () => {
        console.log('Answer validated:', answer);
        if (photo) {
            try {
                const person = await fetchPerson(photo.id);
                const normalizedAnswer = normalizeText(answer);
                const normalizedPersonName = normalizeText(person.firstName);
                if (normalizedAnswer === normalizedPersonName) {
                    notifySuccess("Bien joué");
                    fetchPhoto();
                    setAnswer('');
                } else {
                    notifyWarning("Erreur: la reponse etait " + person.firstName + " et vous avez répondu " + answer);
                }
            } catch (error: any) {
                notifyError("Error fetching person: " + error.message);
            }
        } else {
            notifyError("wtf");
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

    if (showOptions) {
        return (
            <Box sx={{ padding: '20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton onClick={toggleOptions} aria-label="Back to quiz" sx={{ color, marginBottom: '20px' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" style={{ color, textShadow: `0 0 8px ${color}` }}>
                    Quiz Options
                </Typography>
                <FormGroup>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={<Switch checked={isHowActive} onChange={() => setHowActive(!isHowActive)} />}
                                label={isHowActive ? "Active" : "Inactive"}
                            />
                            {isHowActive ? (
                                <>
                                    <InputLabel id="sort-label" sx={{ marginLeft: 1 }}>Sorted by:</InputLabel>
                                    <Select labelId="sort-label" defaultValue="random" sx={{ m: 1, minWidth: 120 }}>
                                        <MenuItem value="random">Random</MenuItem>
                                        <MenuItem value="name">Name</MenuItem>
                                        <MenuItem value="date">Date</MenuItem>
                                    </Select>
                                </>
                            ) : (
                                <Typography sx={{ marginLeft: 2 }}>Random</Typography>
                            )}
                        </Box>
                    </Box>

                    <FormControlLabel control={<Switch checked={isWhoActive} onChange={() => setWhoActive(!isWhoActive)} />} label="Who" />
                    {isWhoActive ? (
                        <div>
                            {/* Placeholder for complex toggles */}
                            <Typography>Complex Who Settings</Typography>
                        </div>
                    ) : (
                        <Typography>Everyone</Typography>
                    )}

                    <InputLabel id="what-select-label">What</InputLabel>
                    <Select labelId="what-select-label" defaultValue="all">
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="some">Some</MenuItem>
                        <MenuItem value="none">None</MenuItem>
                    </Select>

                    <FormControlLabel control={<Switch checked={isRepeatActive} onChange={() => setRepeatActive(!isRepeatActive)} />} label="Repeat after me" />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField type="number" label="Frequency" disabled={!isRepeatActive} sx={{ m: 1 }} value={repeatSettings.frequency} onChange={(e) => setRepeatSettings({ ...repeatSettings, frequency: parseInt(e.target.value) })} />
                        <TextField type="number" label="Quantity" disabled={!isRepeatActive} sx={{ m: 1 }} value={repeatSettings.quantity} onChange={(e) => setRepeatSettings({ ...repeatSettings, quantity: parseInt(e.target.value) })} />
                    </Box>
                </FormGroup>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '7vh' }}>
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
                    <Skeleton variant="rectangular" width="100%" height={300} animation="wave" style={{backdropFilter: 'blur(3px)', backgroundColor: color+'10'}} />
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
