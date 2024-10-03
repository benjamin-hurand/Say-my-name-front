import { GameOptions } from "../../../models/commons/Game/GameOptions/GameOptions.model";
import { Photo } from "../../../models/commons/Photo";
import API from "../../api/apiUtils";
import { PersonAttribute } from "../../../models/commons/PersonAttribute";

const endpoint = "/photos";

export async function getPhotoWithCriteria(gameOptions: GameOptions, personIdsHistoric: number[]): Promise<Photo> {
    try {
        console.log("GameOptions : " + JSON.stringify(gameOptions));
        const response = await API.post<Photo>(`${endpoint}/random/with-criteria`, {
            gameOptionsDto: gameOptions, 
            personIdsHistoric: personIdsHistoric
        });
        console.log("Received photo with criteria:", JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to fetch random photo with criteria:', error);
        throw error;
    }
}

export async function getPersonAttributesOfPhoto(photoId: number): Promise<PersonAttribute[]> {
    try {
        const response = await API.get<PersonAttribute[]>(`${endpoint}/${photoId}/person/attributes`);
        console.log("voicii:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get person attributes of photo:', error);
        throw error;
    }
}
