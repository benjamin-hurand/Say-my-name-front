import { Person } from "../../../models/commons/Person";
import API from "../../api/apiUtils";

const endpoint = "/persons";

export async function getPersons(): Promise<Person[]> {
    const response = await API.get<Person[]>(endpoint);
    return response.data;
}