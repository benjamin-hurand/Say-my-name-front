import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton } from '@mui/material';
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
    const [person, setPerson] = useState<PersonBasic | null>(null);

    useEffect(() => {
        const fetchPhoto = async () => {
            try {
                const fetchedPhoto: Photo = await getPhoto();
                setPhoto(fetchedPhoto);
                console.log("photo fetched: "+ JSON.stringify(photo));
            } catch (error) {
                console.error('Error fetching photo:', error);
            }
        };

        fetchPhoto();
    }, []);

    const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    const validateAnswer = () => {
        console.log('Answer validated:', answer);
        if(photo) {
            fetchPerson(photo.id);
            if(answer === person?.firstName) {
                notifySuccess("Bien joué")
            } else {
                notifyWarning("Erreur: la reponse etait " + person?.firstName + " et vous avez répondu " + answer);
            }
        } else {
            notifyError("wtf");
        }
        // Add additional validation logic here
    };

    const fetchPerson = async (photoId: number) => {
        try {
            const fetchedPerson: PersonBasic = await getPersonBasicOfPhoto(photoId);
            setPerson(fetchedPerson);
            console.log("fetchedPerson: " + JSON.stringify(person));
        } catch (error) {
            console.error('Error fetching person:', error);
        }
    }

    const openOption = () => {
        console.log('Let\'s open option !');
    }

    const goBackToMenu = () => {
        navigate('/', { replace: true }); // Adjust the route as necessary
    };

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
                        style={{ width: 'auto', height: '56vh', boxShadow: `0 0 20px ${color}` }}
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
                    sx={{ margin: '20px 0', width: '100%'}} // Adjust width as needed
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '7vh'}}>
                    <Button variant="outlined" className='menu' onClick={openOption} sx={{ marginRight: '1vw' }}>
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
