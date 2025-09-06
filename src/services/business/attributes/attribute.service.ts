import { Attribute } from "../../../models/commons/Attribute";
import API from "../../api/apiUtils";

const endpoint = "/attributes";

export async function getAttributes(): Promise<Attribute[]> {
    try {
        const response = await API.get<Attribute[]>(`${endpoint}`);
        // console.log("voicii attributes:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get attributes:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}

export async function getFilters(): Promise<Attribute[]> {
    try {
        const response = await API.get<Attribute[]>(`${endpoint}/filters`);
        // console.log("voicii filters:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get filters:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}
