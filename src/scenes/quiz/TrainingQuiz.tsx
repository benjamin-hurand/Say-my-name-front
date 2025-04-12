import React from 'react';
import { useNavigate } from 'react-router-dom';

import QuizDisplay from './QuizDisplay';
import { GameOptions } from '../../models/commons/Game/GameOptions/GameOptions.model';
import { useQuizLogic } from './hooks/UseQuizLogic';
import { useQuizOptions } from '../../contexts/QuizOptionsContext';

export const TrainingQuiz: React.FC = () => {
  const navigate = useNavigate();
  const 
      {
        selectedMode,
        selectedFilters,
        selectedSortingMethods,
        selectedRepetitionPattern,
        selectedHelps,
      } = useQuizOptions();

  // Exemple: tu construis l’objet gameOptions depuis un context ou localement
  const gameOptions: GameOptions = {
    id: Date.now(),
    gameMode: selectedMode,         // depuis un context ou autrement
    filters: selectedFilters,
    sortBy: selectedSortingMethods,
    repetitionPattern: selectedRepetitionPattern,
    initialGiven: selectedHelps.initialGiven,
    typosFriendly: selectedHelps.typosFriendly,
  };

  // J'appelle le hook :
  const {
    isLoading,
    hasFetched,
    photoUrl,
    initials,
    answer,
    handleAnswerChange,
    validateAnswer,
  } = useQuizLogic({ gameOptions });

  // Pour le bouton "Options" par exemple
  const openQuizOptions = () => {
    navigate('/quiz/options');
  };
  const goBackToMenu = () => {
    navigate('/');
  };

  return (
    <QuizDisplay
      color="blue" // exemple
      photoUrl={photoUrl}
      initials={initials}
      showInitials={gameOptions.initialGiven ?? false}
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
