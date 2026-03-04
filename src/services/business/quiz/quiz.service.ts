import API from "../../api/apiUtils";
import { QuizAnswerRequestDto } from "../../dto/quiz/QuizAnswerRequestDto";
import { QuizAnswerResultDto } from "../../dto/quiz/QuizAnswerResultDto";
import {
  QuizAnswerSubmissionDto,
  buildQuizAnswerSubmission,
} from "../../dto/quiz/QuizAnswerSubmissionDto";
import { QuizQuestionDto } from "../../dto/quiz/QuizQuestionDto";
import { QuizQuestionRequestDto } from "../../dto/quiz/QuizQuestionRequestDto";

const endpoint = "/quiz";

export async function continueTraining(req: QuizQuestionRequestDto): Promise<QuizQuestionDto> {
  const res = await API.post<QuizQuestionDto>(`${endpoint}/continue`, req);
  return res.data;
}

export async function answerTraining(req: QuizAnswerRequestDto): Promise<QuizAnswerResultDto> {
  const res = await API.post<QuizAnswerResultDto>(`${endpoint}/answer`, req, {
    validateStatus: (s) => s < 500,
  });
  return res.data;
}

export async function guessHangmanLetterTraining(
  questionHandle: string,
  letter: string,
  nextRequest: QuizQuestionRequestDto,
  timeMs?: number
): Promise<QuizAnswerResultDto> {
  const submission: QuizAnswerSubmissionDto = buildQuizAnswerSubmission({
    timeMs: timeMs ?? null,
    hangman: { action: "GUESS", letter, value: null },
  });

  return answerTraining({ questionHandle, submission, nextRequest });
}

export async function solveHangmanTraining(
  questionHandle: string,
  value: string,
  nextRequest: QuizQuestionRequestDto,
  timeMs?: number
): Promise<QuizAnswerResultDto> {
  const submission: QuizAnswerSubmissionDto = buildQuizAnswerSubmission({
    timeMs: timeMs ?? null,
    hangman: { action: "SOLVE", letter: null, value },
  });

  return answerTraining({ questionHandle, submission, nextRequest });
}