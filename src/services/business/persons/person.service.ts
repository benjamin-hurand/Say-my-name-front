import { Person } from "../../../models/commons/Person";
import { PersonAttribute } from "../../../models/commons/PersonAttribute";
import API from "../../api/apiUtils";

const ENDPOINT = "/persons";

/**
 * Récupère les attributs d'une Person donnée.
 * @param personId Identifiant de la Person
 * @returns Promise<PersonAttribute[]>
 * @throws Erreur si l'appel API échoue
 */
export async function getPersonAttributesById(personId: number): Promise<PersonAttribute[]> {
  try {
    const response = await API.get<PersonAttribute[]>(
      `${ENDPOINT}/${personId}/attributes`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Failed to get person attributes with personId ${personId} :`,
      error
    );
    throw error;
  }
}
