import { GameOptions } from "../../../models/commons/Game/GameOptions/GameOptions.model";
import { QuizEntry } from "../../../models/commons/Game/QuizEntry";
import API from "../../api/apiUtils";
import { ReducedGameOptionsDto } from "../../dto/ReducedGameOptionsDto";

const endpoint = "/quiz";

export async function getQuizList(reducedGameOptionsDto: ReducedGameOptionsDto): Promise<QuizEntry[]> {
    try {
        console.log("ReducedGameOptionsDto : " + JSON.stringify(reducedGameOptionsDto));
        const response = await API.post<QuizEntry[]>(`${endpoint}/list`, reducedGameOptionsDto);
        // console.log("Received quiz list:", JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to fetch quiz list:', error);
        throw error;
    }
}
