import { Person } from "../../../models/commons/Person";
import { PersonBasic } from "../../../models/commons/PersonBasic";
import API from "../../api/apiUtils";

const endpoint = "/persons";

interface params {
}

export async function getPersons(): Promise<Person[]> {
    const response = await API.get<Person[]>(endpoint);
    return response.data;
}

export async function getPersonsWithoutAccount(): Promise<PersonBasic[]> {
    const response = await API.get<PersonBasic[]>(endpoint + '/withoutaccount');
    return response.data;
}