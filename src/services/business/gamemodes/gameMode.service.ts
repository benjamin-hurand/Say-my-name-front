import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";
import API from "../../api/apiUtils";

const endpoint = "/gamemodes";

export async function getGameModes(): Promise<GameMode[]> {
    try {
        const response = await API.get<GameMode[]>(`${endpoint}`);
        // console.log("voicii themes:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get game themes:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}