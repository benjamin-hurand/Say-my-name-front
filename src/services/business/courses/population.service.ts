// src/services/courseService.ts
import API from "../../api/apiUtils";
import { PopulationDto } from "../../dto/courses/PopulationDto";

const endpoint = '/populations';

/**
 * Récupère le cours en cours d'un utilisateur (ou null si aucun)
 */
export async function getPopulationList(): Promise<PopulationDto[]> {
  try {
    const response = await API.get<PopulationDto[]>(`${endpoint}`);
    return response.data;
  } catch (err: any) {
    console.error('getPopulationList failed', err);
    throw err;
  }
}