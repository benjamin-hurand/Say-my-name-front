import { QuizAnswerSubmissionDto } from "./QuizAnswerSubmissionDto";
import { QuizQuestionRequestDto } from "./QuizQuestionRequestDto";

export interface QuizAnswerRequestDto {
  questionHandle: string;
  submission: QuizAnswerSubmissionDto;
  nextRequest: QuizQuestionRequestDto;
}
