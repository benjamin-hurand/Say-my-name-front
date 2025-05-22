// src/dto/course/CourseAnswerAndNextQuestionDto.ts
import { ResultAttr } from '../../../models/commons/PersonAttribute';
import { CourseQuestionDto } from './CourseQuestionDto';
import { StatusCountsDto } from './StatusCountsDto';

export interface CourseAnswerAndNextQuestionDto {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  feedbackMessage: string;
  nextQuestion: CourseQuestionDto;
  resultAttributes: ResultAttr[];
  statusCounts: StatusCountsDto;
}
