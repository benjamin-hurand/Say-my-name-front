// src/scenes/courses/ProgressionQuiz.tsx
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourse } from '../../contexts/CoursesContext'
import { useThemeColorContext } from '../../contexts/ThemeColorContext'
import { useAuth } from '../../contexts/AuthContext'
import QuizDisplay from '../quiz/QuizDisplay'
import {
  continueCourse,
  answerCourse,
  useHelp,
  NoMoreQuestionsError,
  getTrainingList
} from '../../services/business/courses/course.service'
import { CourseAnswerAndNextQuestionDto } from '../../services/dto/courses/CourseAnswerAndNextQuestionDto'
import { CourseAnswerDto } from '../../services/dto/courses/CourseAnswerDto'
import { CourseQuestionDto } from '../../services/dto/courses/CourseQuestionDto'
import { notifyError, notifySuccess } from '../../services/notification/toast.service'
import { PersonAttributeLite, ResultAttr } from '../../models/commons/PersonAttribute'
import { QuizEntry, QuizEntryWithRepetition } from '../../models/commons/Game/QuizEntry'
import { useQuizSession } from '../../contexts/QuizSessionContext'
import { GameMode } from '../../models/commons/Game/GameMode/GameMode.model'
import { useGlobalData } from '../../contexts/GlobalDataContext'
import { Attribute } from '../../models/commons/Attribute'
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model'
import { repetitionPatterns } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model'
import { PopulationDto } from '../../services/dto/courses/PopulationDto'

export const ProgressionQuiz: React.FC = () => {
  const navigate = useNavigate()
  const { color } = useThemeColorContext()
  const { selectedCourse } = useCourse()
  const { user } = useAuth()
  const {
      setQuizList,
      setReviewList,
      setSessionOptions,
      setUncheckedNewSession,
    } = useQuizSession();
  const { populations, modes, sorts } = useGlobalData();

  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState<CourseQuestionDto | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  
  const [isResultMode, setIsResultMode] = useState<boolean>(false)
  const [resultMessage, setResultMessage] = useState<string>('')
  const [resultAttrs, setResultAttrs] = useState<ResultAttr[]>([])
  const [pendingNext, setPendingNext] = useState<CourseQuestionDto | null>(null)

  const [batchExhausted, setBatchExhausted] = useState(false)

  // Démarrer le quiz
  useEffect(() => {
    if (!selectedCourse) {
      navigate('/')
      return
    }
    setIsLoading(true)
    continueCourse(selectedCourse.id)
      .then(q => {
        setCurrentQuestion(q)
        setBatchExhausted(false)
      })
      .catch(err => {
        console.error(err)
        notifyError('Impossible de démarrer le quiz')
      })
      .finally(() => setIsLoading(false))
  }, [selectedCourse, navigate])

  useEffect(() => {
    if(!isResultMode && pendingNext) {
      console.log('on affiche question pending');
      setCurrentQuestion(pendingNext)
      setPendingNext(null)
    }
  }, [pendingNext, isResultMode])

  // Soumission de la réponse
  const handleSubmit = useCallback(async () => {
    if (!selectedCourse || !currentQuestion || !user) return
    const dto: CourseAnswerDto = {
      userId: user.id,
      courseQuestionId: currentQuestion.id,
      courseId: selectedCourse.id,
      answer: answer.trim(),
    }

    try {
      const result: CourseAnswerAndNextQuestionDto = await answerCourse(selectedCourse.id, dto)
      setFeedback(result.feedbackMessage)
      // setCurrentQuestion(result.nextQuestion)

      // Build result message
      const msg = result.correct
        ? `Bravo ! C’était bien : ${result.correctAnswer}`
        : `Dommage ! Mauvaise réponse. C’était : ${result.correctAnswer}`
      setResultMessage(msg)

      // Optionally build attribute list (empty here)
      setResultAttrs(result.resultAttributes)

      // Store next question for when user clicks "Suivant"
      setPendingNext(result.nextQuestion)

      // Enter result mode
      setIsResultMode(true)
      console.log('OUVERTURE RESULTATS');

      // Clear input
      setAnswer('')

    } catch (err: any) {
      if (err instanceof NoMoreQuestionsError) {
        setBatchExhausted(true);
      } else {
        console.error(err)
        notifyError('Erreur lors de l’envoi de la réponse')
      }
    } finally {
    }
  }, [selectedCourse, currentQuestion, answer, user, navigate])

  // Next callback from QuizDisplay
  const handleNext = () => {
    setResultAttrs([]);
    setResultMessage('');
    setIsResultMode(false);
  }

  // Handler pour injecter 10 nouveaux et repartir
  const handleReloadBatch = useCallback(async () => {
    if (!selectedCourse) return
    setIsLoading(true)
    try {
      // continueCourse upserte 10 nouveaux et renvoie la première question
      const next: CourseQuestionDto = await continueCourse(selectedCourse.id)
      setCurrentQuestion(next)
      setAnswer('')
      setBatchExhausted(false)
    } catch (err) {
      console.error(err)
      notifyError('Impossible de charger 10 nouveaux mots.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCourse])

  // Handler pour passer en Free Training
  const handleFreeTraining = async () => {
      if (!selectedCourse) return;
      // préparation des entrées pour entraînement
      const entries: QuizEntry[] = await getTrainingList(selectedCourse.id);

      const reviewEntries: QuizEntryWithRepetition[] =
            entries.map((e: QuizEntry) => {
              return {
                ...e,
                repetitionData: {
                  totalRepetitionCount: 0,
                  correctRepetitionCount: 0,
                  easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
                  interval: repetitionPatterns.optimal.initialInterval,
                },
              } as QuizEntryWithRepetition;
            });
  
      setReviewList(reviewEntries);
      setUncheckedNewSession(true);
      setQuizList(reviewEntries);
  
      const mode: GameMode | undefined = modes.find(
        (m) => m.id === selectedCourse?.gameModeId
      );
      if (!mode) {
        notifyError("Mode de jeu du challenge introuvable.");
        return;
      }
      const populationCourse: PopulationDto | undefined = populations.find(
        (p) => p.id === selectedCourse.populationIds[0]
      );
      if (!populationCourse) {
        notifyError("Pas de population trouvée");
        return;
      }
      const filterAttribute: Attribute | undefined = populationCourse.attributeFilter;
      if (!filterAttribute) {
        notifyError("Filtre de la course introuvable.");
        return;
      }
      const gameFilter: GameFilter = {
        id: 0,
        attribute: filterAttribute,
        minValue: populationCourse.minValue,
        maxValue: populationCourse.maxValue,
      };

      const sortAttribute: Attribute | undefined = sorts.find((s) => s.id === selectedCourse.sortingMethodAttributeId);
      if (!sortAttribute) {
        notifyError("Sort de la course introuvable.");
        return;
      }
      setSessionOptions({
        mode,
        filters: [gameFilter],
        sorts: [{
          id : 0,
          attribute: sortAttribute,
          order: selectedCourse.sortingMethodOrder
        }],
        populationScope: 'FOLLOWED',
        repetitionPattern: repetitionPatterns.optimal,
        helps: { typosFriendly: true, initialGiven: true },
      });
  
      navigate("/training");
    };

   // 1) En cours de chargement
  if (isLoading) {
    return (
      <QuizDisplay
        color={color}
        photoUrl={null}
        initials={null}
        showInitials={false}
        answer=""
        handleAnswerChange={() => {}}
        validateAnswer={() => {}}
        isLoading={true}
        hasFetched={false}
      />
    )
  }

  // 2) Batch épuisé → on affiche les options “Free Training” / “Continuer 10” / “Menu”
  if (batchExhausted) {
    return (
      <QuizDisplay
        color={color}
        photoUrl={null}
        initials={null}
        showInitials={false}
        answer=""
        handleAnswerChange={() => {}}
        validateAnswer={() => {}}
        isLoading={false}
        hasFetched={true}
        hasHistory={false}
        // nouveaux props pour QuizDisplay
        onFreeTraining={handleFreeTraining}
        onReloadBatch={handleReloadBatch}
      />
    )
  }

  // 3) Quiz terminé (aucune question restante)
  if (!currentQuestion) {
    return (
      <QuizDisplay
        color={color}
        photoUrl={null}
        initials={null}
        showInitials={false}
        answer=""
        handleAnswerChange={() => {}}
        validateAnswer={() => {}}
        isLoading={false}
        hasFetched={true}
        hasHistory={true}
        onRetry={handleReloadBatch}
      />
    )
  }

  // 4) Question courante normale
  return <QuizDisplay
    color={color}

    // Progress (TODO)
    elapsed={undefined}
    progress={undefined}

    // Photo & fetch state
    photoUrl={currentQuestion.photoUrl}
    hasFetched
    isLoading={false}

    // Badges
    poolBadge={currentQuestion.poolType}
    difficultyBadge={currentQuestion.difficultyLevel}

    // Help
    useHelp={async () => {
      if (!currentQuestion) return []
      const attrs: PersonAttributeLite[] = await useHelp(selectedCourse!.id, currentQuestion.id)
      return attrs
    }}

    // Initials
    initials={null}
    showInitials={false}

    // Answer input
    answer={answer}
    handleAnswerChange={e => setAnswer(e.target.value)}
    validateAnswer={handleSubmit}

    // Results
    isResultMode={isResultMode}
    resultMessage={resultMessage}
    resultAttributes={resultAttrs}
    onNext={handleNext}

    // Options

    // End events
    onFreeTraining={handleFreeTraining}
    onReloadBatch={handleReloadBatch}
    onRetry={handleReloadBatch}
    hasHistory={false}
  />
}

export default ProgressionQuiz
