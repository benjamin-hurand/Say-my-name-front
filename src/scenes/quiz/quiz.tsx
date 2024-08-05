import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { getPhoto } from '../../services/business/quiz/quiz.service';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    const navigate = useNavigate();
    const [answer, setAnswer] = useState<string>('');
    const { color } = useThemeColorContext();
    const [photo, setPhoto] = useState<string | null>(null);

    useEffect(() => {
        const fetchPhoto = async () => {
            try {
                const fetchedPhoto = await getPhoto();
                setPhoto(fetchedPhoto.url);
                console.log("photo fetched: "+ JSON.stringify(fetchPhoto));
                console.log('photo url: ' + fetchedPhoto.url);
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
        // Add additional validation logic here
    };

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
                        src={photo}
                        alt="Quiz"
                        style={{ width: '100%', boxShadow: `0 0 20px ${color}` }}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                    <Button variant="outlined" className='menu' onClick={validateAnswer} sx={{ marginRight: '1vw' }}>
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
