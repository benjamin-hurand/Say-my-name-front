// src/scenes/quiz/ChallengeQuiz.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { notifyError } from '../../services/notification/toast.service';
import QuizDisplay from './QuizDisplay';
import { ChallengeHistoryEntry } from '../../models/commons/Game/QuizHistoryEntry';
import { useAttempt } from '../../contexts/ChallengeAttemptContext';
import { ChallengeQuestionDto } from '../../services/dto/ChallengeAttemptDto';

export const ChallengeQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { color } = useThemeColorContext();
  const { attemptId } = useParams<{ attemptId: string }>();
  const { attempt, loadAttempt } = useAttempt();

  // Liste des questions + index courant
  const [questions, setQuestions] = useState<ChallengeQuestionDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Historique des réponses
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);
  const [answer, setAnswer] = useState<string>('');

  // Charger la tentative si on ne l'a pas encore
  useEffect(() => {
    const id = Number(attemptId);
    if (!attempt || attempt.id !== id) {
      loadAttempt(id);
    }
  }, [attemptId, attempt, loadAttempt]);

  // Initialiser la liste de questions quand attempt arrive
  useEffect(() => {
    if (attempt) {
      setQuestions(attempt.challengeEntries);
      setCurrentIndex(0);
    }
  }, [attempt]);

  // Question courante (ou undefined si pas encore chargé)
  const current = questions[currentIndex];

  // Mise à jour de la saisie
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value);
  };

  // Valider la réponse
  const validateAnswer = useCallback(() => {
    if (!current) return;

    // Ajouter à l'historique
    setHistory(prev => [
      ...prev,
      {
        questionNumber: prev.length + 1,
        personId: current.personId,
        answer
      }
    ]);

    // Réinitialiser la saisie
    setAnswer('');

    // Passer à la question suivante ou terminer
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(ci => ci + 1);
    } else {
      // Ici, on peut naviguer vers un résumé
      navigate(`/challenges/${attempt!.id}/summary`, {
        state: { history: [...history, { questionNumber: history.length + 1, personId: current.personId, answer }] }
      });
    }
  }, [answer, current, currentIndex, questions.length, history, navigate, attempt]);

  // Entrée clavier “Enter”
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Enter' && validateAnswer();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [validateAnswer]);

  // Si on n’a pas encore de question à afficher
  if (!current) {
    return <div>Chargement du quiz…</div>;
  }

  return (
    <QuizDisplay
      color={color}
      photoUrl={current.photoUrl}
      initials={null}
      showInitials={false}
      answer={answer}
      handleAnswerChange={handleAnswerChange}
      validateAnswer={validateAnswer}
      goBackToMenu={() => navigate('/challenges', { replace: true })}
      isLoading={false}
      hasFetched={true}
    />
  );
};

export default ChallengeQuiz;
