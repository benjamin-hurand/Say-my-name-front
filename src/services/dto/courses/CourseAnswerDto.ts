// src/dto/course/CourseAnswerDto.ts
export interface CourseAnswerDto {
  userId: number;
  courseQuestionId: number;
  courseId: number;
  answer: string;
}
