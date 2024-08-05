import { Photo } from "../../../models/commons/Photo";
import API from "../../api/apiUtils";

const endpoint = "/quiz";


export async function getPhoto(): Promise<Photo> {
    try {
        const response = await API.get<Photo>(`${endpoint}/photo/random`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch random photo:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}