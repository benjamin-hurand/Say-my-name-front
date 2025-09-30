import { QuizEntry } from "../../../models/commons/Game/QuizEntry";
import { PersonAttributeLite } from "../../../models/commons/PersonAttribute";
import API from "../../api/apiUtils";
import { CourseAnswerAndNextQuestionDto } from "../../dto/courses/CourseAnswerAndNextQuestionDto";
import { CourseAnswerDto } from "../../dto/courses/CourseAnswerDto";
import { CourseDto, CreateCourseDto } from "../../dto/courses/CourseDto";
import { CourseQuestionDto } from "../../dto/courses/CourseQuestionDto";
import { CourseStatsDto } from "../../dto/courses/CourseStatsDto";

// Base pour /api/courses (API util préfixe déjà /api)
const endpoint = "/courses";

/** Dernier cours focal (ou null si 204) */
export async function getCurrentCourse(userId: number): Promise<CourseDto | null> {
  const res = await API.get<CourseDto>(`${endpoint}/${userId}/current`, {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? null : res.data;
}

/** Tous les cours ACTIFS de l’utilisateur */
export async function getUserCourses(userId: number): Promise<CourseDto[]> {
  const res = await API.get<CourseDto[]>(`${endpoint}/user/${userId}`, {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? [] : res.data;
}

/** Stats d’un cours */
export async function getCourseStats(courseId: number): Promise<CourseStatsDto> {
  const res = await API.get<CourseStatsDto>(`${endpoint}/${courseId}/stats`);
  return res.data;
}

/** Stats de tous les cours ACTIFS d’un utilisateur */
export async function getUserCourseStats(userId: number): Promise<CourseStatsDto[]> {
  const res = await API.get<CourseStatsDto[]>(`${endpoint}/user/${userId}/stats`, {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? [] : res.data;
}

/** Crée un nouveau cours (échoue si déjà un IN_PROGRESS pour user/mode/scope) */
export async function createCourse(dto: CreateCourseDto): Promise<CourseDto> {
  const res = await API.post<CourseDto>(`${endpoint}/create`, dto);
  return res.data;
}

/** Crée ou reprend l’IN_PROGRESS existant (user/mode/scope) */
export async function createOrResumeCourse(dto: CreateCourseDto): Promise<CourseDto> {
  const res = await API.post<CourseDto>(`${endpoint}/create-or-resume`, dto);
  return res.data;
}

/** Redémarre un cours (purge progression + reseed) */
export async function restartCourse(courseId: number): Promise<CourseDto> {
  const res = await API.post<CourseDto>(`${endpoint}/${courseId}/restart`);
  return res.data;
}

/** Marque un cours comme “focus” (lastAccessedAt = now) */
export async function focusCourse(courseId: number): Promise<void> {
  await API.post<void>(`${endpoint}/${courseId}/focus`);
}

/** Démarre/continue un cours (renvoie la question) */
export async function continueCourse(courseId: number): Promise<CourseQuestionDto> {
  const res = await API.get<CourseQuestionDto>(`${endpoint}/${courseId}/continue`);
  return res.data;
}

export class NoMoreQuestionsError extends Error {
  constructor(message = "Plus de nouveaux items disponibles") {
    super(message);
    this.name = "NoMoreQuestionsError";
  }
}

/** Soumet une réponse et récupère la suivante */
export async function answerCourse(
  courseId: number,
  answerDto: CourseAnswerDto
): Promise<CourseAnswerAndNextQuestionDto> {
  const res = await API.post<CourseAnswerAndNextQuestionDto>(
    `${endpoint}/${courseId}/answer`,
    answerDto,
    { validateStatus: (status) => status < 500 }
  );

  if (res.status === 206) {
    throw new NoMoreQuestionsError();
  }
  return res.data;
}

/** Marque l’aide et récupère des attributs utiles */
export async function useHelp(
  courseId: number,
  questionId: number
): Promise<PersonAttributeLite[]> {
  const res = await API.post<PersonAttributeLite[]>(
    `${endpoint}/${courseId}/questions/${questionId}/help`
  );
  return res.data;
}

/** Liste d’entraînement à partir d’un cours */
export async function getTrainingList(courseId: number): Promise<QuizEntry[]> {
  const res = await API.get<QuizEntry[]>(`${endpoint}/${courseId}/training`);
  return res.data;
}

