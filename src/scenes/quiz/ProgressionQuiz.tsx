// src/scenes/courses/ProgressionQuiz.tsx
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourse } from '../../contexts/CoursesContext'
import { useOrgData } from '../../contexts/OrgDataContext'
import { useQuizSession } from '../../contexts/QuizSessionContext'
import { useThemeColorContext } from '../../contexts/ThemeColorContext'
import { GameMode } from '../../models/commons/Game/GameMode/GameMode.model'
import { repetitionPatterns } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model'
import { QuizEntry, QuizEntryWithRepetition } from '../../models/commons/Game/QuizEntry'
import { PersonAttributeLite, ResultAttr } from '../../models/commons/PersonAttribute'
import {
  NoMoreQuestionsError,
  answerCourse,
  continueCourse,
  getTrainingList,
  useHelp
} from '../../services/business/courses/course.service'
import { CourseAnswerAndNextQuestionDto } from '../../services/dto/courses/CourseAnswerAndNextQuestionDto'
import { CourseAnswerDto } from '../../services/dto/courses/CourseAnswerDto'
import { CourseQuestionDto } from '../../services/dto/courses/CourseQuestionDto'
import { notifyError } from '../../services/notification/toast.service'
import QuizDisplay from '../quiz/QuizDisplay'

export const ProgressionQuiz: React.FC = () => {
  const navigate = useNavigate()
  const { color } = useThemeColorContext()
  const { selectedCourse } = useCourse()
  const {
    setQuizList,
    setReviewList,
    setSessionOptions,
    setUncheckedNewSession,
  } = useQuizSession()
  const { modes } = useOrgData()

  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState<CourseQuestionDto | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const [isResultMode, setIsResultMode] = useState<boolean>(false)
  const [resultMessage, setResultMessage] = useState<string>('')
  const [resultAttrs, setResultAttrs] = useState<ResultAttr[]>([])
  const [pendingNext, setPendingNext] = useState<CourseQuestionDto | null>(null)

  const [batchExhausted, setBatchExhausted] = useState(false)

  // Init course progression
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
        notifyError('Impossible de démarrer le cours')
      })
      .finally(() => setIsLoading(false))
  }, [selectedCourse, navigate])

  useEffect(() => {
    if (!isResultMode && pendingNext) {
      setCurrentQuestion(pendingNext)
      setPendingNext(null)
    }
  }, [pendingNext, isResultMode])

  // Submit answer
  const handleSubmit = useCallback(async () => {
    if (!selectedCourse || !currentQuestion) return

    const dto: CourseAnswerDto = {
      courseQuestionId: currentQuestion.id,
      courseId: selectedCourse.id,
      answer: answer.trim(),
    }

    try {
      const result: CourseAnswerAndNextQuestionDto =
        await answerCourse(selectedCourse.id, dto)

      setFeedback(result.feedbackMessage)

      const msg = result.correct
        ? `Bravo ! C’était bien : ${result.correctAnswer}`
        : `Dommage ! Mauvaise réponse. C’était : ${result.correctAnswer}`

      setResultMessage(msg)
      setResultAttrs(result.resultAttributes)
      setPendingNext(result.nextQuestion)
      setIsResultMode(true)
      setAnswer('')
    } catch (err: any) {
      if (err instanceof NoMoreQuestionsError) {
        setBatchExhausted(true)
      } else {
        console.error(err)
        notifyError('Erreur lors de l’envoi de la réponse')
      }
    }
  }, [selectedCourse, currentQuestion, answer])

  const handleNext = () => {
    setResultAttrs([])
    setResultMessage('')
    setIsResultMode(false)
  }

  // Reload a new batch of course questions
  const handleReloadBatch = useCallback(async () => {
    if (!selectedCourse) return
    setIsLoading(true)
    try {
      const next: CourseQuestionDto =
        await continueCourse(selectedCourse.id)
      setCurrentQuestion(next)
      setAnswer('')
      setBatchExhausted(false)
    } catch (err) {
      console.error(err)
      notifyError('Impossible de charger de nouvelles questions.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCourse])

  // Switch to Free Training with the same population
  const handleFreeTraining = async () => {
    if (!selectedCourse) return

    const entries: QuizEntry[] = await getTrainingList(selectedCourse.id)

    const reviewEntries: QuizEntryWithRepetition[] =
      entries.map(e => ({
        ...e,
        repetitionData: {
          totalRepetitionCount: 0,
          correctRepetitionCount: 0,
          easinessFactor: repetitionPatterns.optimal.initialEasinessFactor,
          interval: repetitionPatterns.optimal.initialInterval,
        },
      }))

    setReviewList(reviewEntries)
    setUncheckedNewSession(true)
    setQuizList(reviewEntries)

    const mode: GameMode | undefined =
      modes.find(m => m.id === selectedCourse.gameModeId)

    if (!mode) {
      notifyError('Mode de jeu du cours introuvable.')
      return
    }

    setSessionOptions({
      mode,
      filters: [],
      sorts: [],
      populationScope: 'FOLLOWED',
      repetitionPattern: repetitionPatterns.optimal,
      helps: { typosFriendly: true, initialGiven: true },
    })

    navigate('/training')
  }

  // Loading
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
        isLoading
        hasFetched={false}
      />
    )
  }

  // Batch exhausted
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
        hasFetched
        onFreeTraining={handleFreeTraining}
        onReloadBatch={handleReloadBatch}
      />
    )
  }

  // No current question
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
        hasFetched
        hasHistory
        onRetry={handleReloadBatch}
      />
    )
  }

  // Normal course question
  return (
    <QuizDisplay
      color={color}
      photoUrl={currentQuestion.photoUrl}
      hasFetched
      isLoading={false}

      poolBadge={currentQuestion.poolType}
      difficultyBadge={currentQuestion.difficultyLevel}

      useHelp={async () => {
        if (!currentQuestion) return []
        const attrs: PersonAttributeLite[] =
          await useHelp(selectedCourse!.id, currentQuestion.id)
        return attrs
      }}

      initials={null}
      showInitials={false}

      answer={answer}
      handleAnswerChange={e => setAnswer(e.target.value)}
      validateAnswer={handleSubmit}

      isResultMode={isResultMode}
      resultMessage={resultMessage}
      resultAttributes={resultAttrs}
      onNext={handleNext}

      onFreeTraining={handleFreeTraining}
      onReloadBatch={handleReloadBatch}
      onRetry={handleReloadBatch}
    />
  )
}

export default ProgressionQuiz
