import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, TextField, Typography, IconButton, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';

interface QuizProps {}

export const Quiz: React.FC<QuizProps> = () => {
    const navigate = useNavigate();
    const [answer, setAnswer] = useState<string>('');
    const { color } = useThemeColorContext();
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

    const iconButtonStyle: React.CSSProperties = {
        color: color,
        boxShadow: `0 0 8px ${color}`,
        transition: 'box-shadow 0.2s ease-in-out',
        position: 'absolute',  // Ensure this is a valid CSS position value
        top: '16px',  // Adding 'px' to clarify units
        left: '16px'  // Adding 'px' to clarify units
    };
    

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton
                    onClick={goBackToMenu}
                    style={iconButtonStyle}
                    aria-label="Back to menu"
                >
                    <ArrowBackIcon className="menu" style={{ color }}/>
                </IconButton>
                <Typography variant="h4" style={{ color: color, marginBottom: '20px', textShadow: `0 0 8px ${color}` }}>
                    Hello Quiz
                </Typography>
                {imageLoaded ? (
                    <img
                        src="/path/to/quiz/image.jpg"
                        alt="Quiz"
                        style={{ maxWidth: '90%', boxShadow: `0 0 20px ${color}` }}
                        onLoad={() => setImageLoaded(true)}
                    />
                ) : (
                    <Skeleton variant="rectangular" width="40%" height={300} animation="wave" />
                )}
                <TextField
                    variant="outlined"
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={handleAnswerChange}
                    sx={{ margin: '20px 0' , width: '40%'}}
                />
                <Button variant="contained" sx={{ width: '40%', backgroundColor: color, boxShadow: color}} onClick={validateAnswer}>
                    Submit Answer
                </Button>
            </Box>
        </>
    );
};

export default Quiz;
