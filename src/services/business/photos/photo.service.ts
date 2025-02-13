import API from "../../api/apiUtils";
import { PersonAttribute } from "../../../models/commons/PersonAttribute";
import { Photo } from "../../../models/commons/Photo";

const endpoint = "/photos";

export async function getPhotoById(photoId: number): Promise<Photo> {
    try {
        const response = await API.get<Photo>(`${endpoint}/${photoId}`);
        console.log('voici la photo: ' + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Fail to get photo with id' + photoId + ': ', error);
        throw error;
    }
}
