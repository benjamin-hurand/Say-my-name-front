import { Person } from "../../../models/commons/Person";
import { PersonAttribute } from "../../../models/commons/PersonAttribute";
import API from "../../api/apiUtils";

const endpoint = "/persons";

export async function getPersons(): Promise<Person[]> {
    const response = await API.get<Person[]>(endpoint);
    return response.data;
}

export async function getPersonAttributesById(personId: number): Promise<PersonAttribute[]> {
    try {
        const response = await API.get<PersonAttribute[]>(`${endpoint}/${personId}/attributes`);
        // console.log("voicii:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get person attributes with personId ' + personId + ' :', error);
        throw error;
    }
}