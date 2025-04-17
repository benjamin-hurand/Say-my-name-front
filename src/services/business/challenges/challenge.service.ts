import { ChallengeSeason } from "../../../models/commons/ChallengeSeason";
import { Challenge } from "../../../models/commons/Game/Challenge";
import { ChallengeHistoryEntry } from "../../../models/commons/Game/QuizHistoryEntry";
import API from "../../api/apiUtils";
import { AddChallengeDto } from "../../dto/addChallengeDto";
import { AddChallengeAttemptDto, ChallengeEvaluationDto, ChallengeEvaluationRequestDto, CreatedChallengeAttemptDto } from "../../dto/ChallengeAttemptDto";
import { ChallengeCardDto } from "../../dto/ChallengeCardDto";
import { ChallengeMenuDto } from "../../dto/ChallengeMenuDto";
import { CreatedChallengeVersionDto } from "../../dto/CreatedChallengeVersionDto";

const endpoint = "/challenges";
const attemptsEndpoint = "attempts";

export async function fetchCurrentSeason(): Promise<ChallengeSeason> {
    try {
        const response = await API.get<ChallengeSeason>(`${endpoint}/current-season`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch current season:', error);
        throw error;
    }
}

export async function createChallenge(addChallengeDto: AddChallengeDto): Promise<CreatedChallengeVersionDto> {
    try {
      const response = await API.post<CreatedChallengeVersionDto>(`${endpoint}/create`, addChallengeDto);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du challenge", error);
      throw error;
    }
  }

export async function getChallengesList(challengeMenuDto: ChallengeMenuDto): Promise<ChallengeCardDto[]> {
  try {
    const response = await API.post<ChallengeCardDto[]>(`${endpoint}/list`, challengeMenuDto);
    return response.data;
  } catch (error) {
    console.error("Error fetching challenges list:", error);
    throw error;
  }
}

/**
 * Crée une tentative de challenge côté backend
 * @param payload { userId, challengeVersionId }
 * @returns le CreatedChallengeAttemptDto renvoyé par le serveur
 */
export async function createChallengeAttempt(
  payload: AddChallengeAttemptDto
): Promise<CreatedChallengeAttemptDto> {
  try {
    const response = await API.post<CreatedChallengeAttemptDto>(
      `${endpoint}/${attemptsEndpoint}/create`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating challenge attempt:", error);
    throw error;
  }
}

/**
 * Récupère une tentative de challenge existante par son ID
 */
export async function getChallengeAttempt(
  attemptId: number
): Promise<CreatedChallengeAttemptDto> {
  try {
    const response = await API.get<CreatedChallengeAttemptDto>(
      `${endpoint}/${attemptsEndpoint}/${attemptId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching challenge attempt:", error);
    throw error;
  }
}

export async function startChallengeAttempt(attemptId: number): Promise<void> {
  try {
    await API.post<void>(`${endpoint}/${attemptsEndpoint}/${attemptId}/start`);
  } catch (error) {
    console.error("Error starting challenge attempt:", error);
    throw error;
  }
}

export async function stopChallengeAttempt(attemptId: number): Promise<void> {
  try {
    await API.post<void>(`${endpoint}/${attemptsEndpoint}/${attemptId}/stop`);
  } catch (error) {
    console.error("Error stopping challenge attempt:", error);
    throw error;
  }
}

export async function evaluateChallengeAttempt(
  attemptId: string,
  payload: ChallengeEvaluationRequestDto
): Promise<ChallengeEvaluationDto> {
  try {
    const response = await API.post<ChallengeEvaluationDto>(
      `${endpoint}/${attemptsEndpoint}/${attemptId}/evaluate`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error evaluating challenge attempt:", error);
    throw error;
  }
}



