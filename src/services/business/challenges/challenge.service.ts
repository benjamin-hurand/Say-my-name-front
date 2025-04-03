import { ChallengeSeason } from "../../../models/commons/ChallengeSeason";
import { Challenge } from "../../../models/commons/Game/Challenge";
import API from "../../api/apiUtils";
import { AddChallengeDto } from "../../dto/addChallengeDto";
import { ChallengeCardDto } from "../../dto/ChallengeCardDto";
import { ChallengeMenuDto } from "../../dto/ChallengeMenuDto";

const endpoint = "/challenges";

export async function fetchCurrentSeason(): Promise<ChallengeSeason> {
    try {
        const response = await API.get<ChallengeSeason>(`${endpoint}/current-season`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch current season:', error);
        throw error;
    }
}

export async function createChallenge(addChallengeDto: AddChallengeDto): Promise<Challenge> {
    try {
      const response = await API.post<Challenge>(`${endpoint}/create`, addChallengeDto);
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