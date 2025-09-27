import { QuizEntry } from "../../../models/commons/Game/QuizEntry";
import { PersonAttributeLite } from "../../../models/commons/PersonAttribute";
import API from "../../api/apiUtils";
import { CourseAnswerAndNextQuestionDto } from "../../dto/courses/CourseAnswerAndNextQuestionDto";
import { CourseAnswerDto } from "../../dto/courses/CourseAnswerDto";
import { CourseDto, CreateCourseDto } from "../../dto/courses/CourseDto";
import { CourseQuestionDto } from "../../dto/courses/CourseQuestionDto";
import { CourseStatsDto } from "../../dto/courses/CourseStatsDto";

// src/services/courseService.ts
const endpoint = "/courses";

/**
 * Récupère le cours en cours d'un utilisateur (ou null si aucun)
 */
export async function getCurrentCourse(userId: number): Promise<CourseDto | null> {
  try {
    const response = await API.get<CourseDto>(`${endpoint}/${userId}/current`);
    return response.status === 204 ? null : response.data;
  } catch (err: any) {
    console.error("getCurrentCourse failed", err);
    throw err;
  }
}

/** Stats du parcours */
export async function getCourseStats(courseId: number): Promise<CourseStatsDto> {
  try {
    const res = await API.get<CourseStatsDto>(`${endpoint}/${courseId}/stats`);
    return res.data;
  } catch (err: any) {
    console.error("getCourseStats failed", err);
    throw err;
  }
}

/**
 * Crée un nouveau cours
 */
export async function createCourse(dto: CreateCourseDto): Promise<CourseDto> {
  try {
    const response = await API.post<CourseDto>(`${endpoint}/create`, dto);
    return response.data;
  } catch (err: any) {
    console.error("createCourse failed", err);
    throw err;
  }
}

/**
 * Redémarre un cours : purge la progression & remet à zéro
 */
export async function restartCourse(courseId: number): Promise<CourseDto> {
  try {
    const response = await API.post<CourseDto>(`${endpoint}/${courseId}/restart`);
    return response.data;
  } catch (err: any) {
    console.error("restartCourse failed", err);
    throw err;
  }
}

/**
 * Abandonne un cours : passe le statut à ABANDONED
 */
export async function abandonCourse(courseId: number): Promise<CourseDto> {
  try {
    const response = await API.post<CourseDto>(`${endpoint}/${courseId}/abandon`);
    return response.data;
  } catch (err: any) {
    console.error("abandonCourse failed", err);
    throw err;
  }
}

/**
 * Démarre (ou récupère) la première question d'un cours
 */
export async function continueCourse(courseId: number): Promise<CourseQuestionDto> {
  try {
    const response = await API.get<CourseQuestionDto>(`${endpoint}/${courseId}/continue`);
    return response.data;
  } catch (err: any) {
    console.error("continueCourse failed", err);
    throw err;
  }
}

export class NoMoreQuestionsError extends Error {
  constructor(message = "Plus de nouveaux items disponibles") {
    super(message);
    this.name = "NoMoreQuestionsError";
  }
}

/**
 * Soumet une réponse et récupère la question suivante
 */
export async function answerCourse(
  courseId: number,
  answerDto: CourseAnswerDto
): Promise<CourseAnswerAndNextQuestionDto> {
  try {
    const response = await API.post<CourseAnswerAndNextQuestionDto>(
      `${endpoint}/${courseId}/answer`,
      answerDto,
      { validateStatus: (status) => status < 500 }
    );

    if (response.status === 206) {
      throw new NoMoreQuestionsError();
    }

    return response.data;
  } catch (err: any) {
    throw err;
  }
}

/**
 * Marquer une question avec l'aide et récupérer les attributs utiles
 */
export async function useHelp(
  courseId: number,
  questionId: number
): Promise<PersonAttributeLite[]> {
  try {
    const response = await API.post<PersonAttributeLite[]>(
      `${endpoint}/${courseId}/questions/${questionId}/help`
    );
    return response.data;
  } catch (error) {
    console.error(
      "Failed to get help containing person attributes with courseId " +
        courseId +
        " and questionId " +
        questionId +
        " :",
      error
    );
    throw error;
  }
}

export async function getTrainingList(courseId: number): Promise<QuizEntry[]> {
  try {
    const response = await API.get<QuizEntry[]>(`${endpoint}/${courseId}/training`);
    return response.data;
  } catch (error) {
    console.error("Failed to get the training list with courseId " + courseId + " :", error);
    throw error;
  }
}
