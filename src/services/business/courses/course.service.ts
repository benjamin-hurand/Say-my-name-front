// src/api/services/courses/coursesApi.ts
import API from "../../api/apiUtils";
import { PersonAttributeLiteDto } from "../../dto/person/PersonAttributeLiteDto";
import { QuizEntry } from "../../../models/commons/Game/QuizEntry";

import { CourseDto, CreateCourseDto } from "../../dto/courses/CourseDto";
import { CourseStatsDto } from "../../dto/courses/CourseStatsDto";

import { QuizQuestionDto } from "../../dto/quiz/QuizQuestionDto";
import { QuizAnswerRequestDto } from "../../dto/quiz/QuizAnswerRequestDto";
import { QuizAnswerResultDto } from "../../dto/quiz/QuizAnswerResultDto";

const endpoint = "/courses";

/** Dernier cours focal (ou null si 204) */
export async function getCurrentCourse(): Promise<CourseDto | null> {
  const res = await API.get<CourseDto>(`${endpoint}/me/current`, {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? null : res.data;
}

/** Tous les cours de l’utilisateur */
export async function getUserCourses(): Promise<CourseDto[]> {
  const res = await API.get<CourseDto[]>(`${endpoint}/me`, {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? [] : res.data;
}

/** Stats d’un cours */
export async function getCourseStats(courseId: number): Promise<CourseStatsDto> {
  const res = await API.get<CourseStatsDto>(`${endpoint}/${courseId}/stats`);
  return res.data;
}

/** Stats de tous les cours de l’utilisateur */
export async function getUserCourseStats(): Promise<CourseStatsDto[]> {
  const res = await API.get<CourseStatsDto[]>(`${endpoint}/me/stats`, {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? [] : res.data;
}

/** Crée un nouveau cours */
export async function createCourse(dto: CreateCourseDto): Promise<CourseDto> {
  const res = await API.post<CourseDto>(`${endpoint}/create`, dto);
  return res.data;
}

/** Crée ou reprend l’existant */
export async function createOrResumeCourse(dto: CreateCourseDto): Promise<CourseDto> {
  const res = await API.post<CourseDto>(`${endpoint}/create-or-resume`, dto);
  return res.data;
}

/** Redémarre un cours */
export async function restartCourse(courseId: number): Promise<CourseDto> {
  const res = await API.post<CourseDto>(`${endpoint}/${courseId}/restart`);
  return res.data;
}

/** Focus (lastAccessedAt = now) */
export async function focusCourse(courseId: number): Promise<void> {
  await API.post<void>(`${endpoint}/${courseId}/focus`);
}

/**
 * Continue course: renvoie QuizQuestionDto (Option A).
 * IMPORTANT: idéalement tu ne passes pas preferredFormat/timed/timeLimitMs ici sauf si tu assumes le “soft preference”.
 */
export async function continueCourse(courseId: number): Promise<QuizQuestionDto> {
  const res = await API.get<QuizQuestionDto>(`${endpoint}/${courseId}/continue`);
  return res.data;
}

/**
 * Soumet une réponse COURSE et récupère le résultat + nextQuestion.
 */
export async function answerCourse(courseId: number, req: QuizAnswerRequestDto): Promise<QuizAnswerResultDto> {
  const res = await API.post<QuizAnswerResultDto>(
    `${endpoint}/${courseId}/answer`,
    req,
    { validateStatus: (status) => status < 500 }
  );

  return res.data;
}

/** Marque l’aide et récupère des attributs utiles */
export async function useHelp(courseId: number, questionId: number): Promise<PersonAttributeLiteDto[]> {
  const res = await API.post<PersonAttributeLiteDto[]>(
    `${endpoint}/${courseId}/questions/${questionId}/help`
  );
  return res.data;
}

/** Liste d’entraînement à partir d’un cours (si tu la gardes) */
export async function getTrainingList(courseId: number): Promise<QuizEntry[]> {
  const res = await API.get<QuizEntry[]>(`${endpoint}/${courseId}/training`);
  return res.data;
}
