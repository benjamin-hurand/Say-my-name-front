import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { neonColors } from '../../models/commons/NeonColors';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    const navigate = useNavigate();
    const [answer, setAnswer] = useState<string>('');
    const [quizColor, setQuizColor] = useState<string>(neonColors[0]); // Default neon color
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

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

    const quizStyle = {
        color: quizColor,
        boxShadow: `0 0 8px ${quizColor}`,
        transition: 'box-shadow 0.3s ease-in-out',
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', position: 'relative' }}>
                <IconButton
                    onClick={goBackToMenu}
                    sx={{ position: 'absolute', top: 16, left: 16, color: quizColor, boxShadow: `0 0 8px ${quizColor}` }}
                    aria-label="Back to menu"
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" style={{ color: quizColor, marginBottom: '20px', textShadow: `0 0 8px ${quizColor}` }}>
                    Hello Quiz
                </Typography>
                {imageLoaded ? (
                    <img
                        src="/path/to/quiz/image.jpg"
                        alt="Quiz"
                        style={{ maxWidth: '90%', boxShadow: `0 0 20px ${quizColor}` }}
                        onLoad={() => setImageLoaded(true)}
                    />
                ) : (
                    <Skeleton variant="rectangular" width="90%" height={400} animation="wave" />
                )}
                <TextField
                    variant="outlined"
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={handleAnswerChange}
                    style={quizStyle}
                    sx={{ margin: '20px 0' }}
                />
                <Button variant="contained" style={quizStyle} onClick={validateAnswer}>
                    Submit Answer
                </Button>
            </Box>
        </>
    );
};

export default Quiz;
