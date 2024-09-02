import { GameOptions } from "../../../models/commons/Game/GameOptions/GameOptions.model";
import { PersonBasic } from "../../../models/commons/PersonBasic";
import { Photo } from "../../../models/commons/Photo";
import API from "../../api/apiUtils";

const endpoint = "/photos";

export async function getPhotoWithCriteria(gameOptions: GameOptions): Promise<Photo> {
    try {
        console.log("GameOptions : " + JSON.stringify(gameOptions));
        const response = await API.post<Photo>(`${endpoint}/random/with-criteria`, gameOptions);
        console.log("Received photo with criteria:", JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to fetch random photo with criteria:', error);
        throw error; // Handle the error appropriately in your app
    }
}

export async function getPersonBasicOfPhoto(photoId: number): Promise<PersonBasic> {
    try {
        const response = await API.get<PersonBasic>(`${endpoint}/${photoId}/person`);
        console.log("voicii:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get person of photo:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}
