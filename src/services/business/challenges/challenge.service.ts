import { ChallengeSeason } from "../../../models/commons/ChallengeSeason";
import { Challenge } from "../../../models/commons/Game/Challenge";
import { ChallengeHistoryEntry } from "../../../models/commons/Game/QuizHistoryEntry";
import API from "../../api/apiUtils";
import { isAxiosError } from "axios";
import { AddChallengeDto } from "../../dto/addChallengeDto";
import { AddChallengeAttemptDto, ChallengeEvaluationDto, ChallengeEvaluationRequestDto, CreatedChallengeAttemptDto } from "../../dto/ChallengeAttemptDto";
import { ChallengeCardDto } from "../../dto/ChallengeCardDto";
import { ChallengeMenuDto } from "../../dto/ChallengeMenuDto";
import { CreatedChallengeVersionDto } from "../../dto/CreatedChallengeVersionDto";
import { AttemptNotFoundError, ChallengeAlreadyStartedError, ChallengeAlreadyEndedError } from "../../../errors/ApiErrors";

const endpoint = "/challenges";
const attemptsEndpoint = `${endpoint}/attempts`;

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
      `${attemptsEndpoint}/create`,
      payload
    );
    console.log("Created challenge attempt:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating challenge attempt:", error);
    throw error;
  }
}

/**
 * Récupère une tentative de challenge existante par son ID pour execution du challenge
 */
export async function getChallengeAttempt(
  attemptId: number
): Promise<CreatedChallengeAttemptDto> {
  try {
    const response = await API.get<CreatedChallengeAttemptDto>(
      `${attemptsEndpoint}/${attemptId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching challenge attempt:", error);
    throw error;
  }
}

/**
 * Vérifie si l'utilisateur peut réellement démarrer ou continuer un attempt.
 * 
 * @returns true si autorisé, false si conflit (déjà démarré / terminé)
 * @throws AttemptNotFoundError si l'attempt n'existe pas (404)
 * @throws toute autre erreur réseau ou inattendue
 */
export async function verifyUserCanAttempt(
  userId: number,
  attemptId: number
): Promise<boolean> {
  try {
    const response = await API.get<{ canAttempt: boolean }>(
      `${attemptsEndpoint}/${attemptId}/verify/${userId}`
    );
    return response.data.canAttempt;

  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) {
        // Attempt introuvable
        throw new AttemptNotFoundError(attemptId);
      }
      if (status === 409) {
        // Conflit métier : déjà démarré ou déjà terminé
        // On renvoie false (l'utilisateur ne peut pas faire l'attempt)
        return false;
      }
      if (status === 403) {
        // Refus autorisations (free‐to‐play, tokens, etc.)
        return false;
      }
    }
    // erreur réseau ou inattendue, on remonte
    throw err;
  }
}

/**
 * Lance l’attempt et traduit les codes HTTP en erreurs métier
 */
export async function startChallengeAttempt(attemptId: number): Promise<void> {
  try {
    await API.post<void>(`${attemptsEndpoint}/${attemptId}/start`);
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) {
        throw new AttemptNotFoundError(attemptId);
      }
      if (status === 409) {
        throw new ChallengeAlreadyStartedError(attemptId);
      }
    }
    // Pour tout le reste, on relance l'erreur brute
    throw err;
  }
}

/**
 * Arrête l’attempt et traduit les codes HTTP en erreurs métier
 */
export async function stopChallengeAttempt(attemptId: number): Promise<void> {
  try {
    await API.post<void>(`${attemptsEndpoint}/${attemptId}/stop`);
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) {
        throw new AttemptNotFoundError(attemptId);
      }
      if (status === 409) {
        throw new ChallengeAlreadyEndedError(attemptId);
      }
    }
    throw err;
  }
}

export async function evaluateChallengeAttempt(
  attemptId: number,
  payload: ChallengeEvaluationRequestDto
): Promise<ChallengeEvaluationDto> {
  try {
    const response = await API.post<ChallengeEvaluationDto>(
      `${attemptsEndpoint}/${attemptId}/evaluate`,
      payload
    );
    console.log("Challenge evaluation response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error evaluating challenge attempt:", error);
    throw error;
  }
}



