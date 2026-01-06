import { PersonAttributeLite } from "../../../models/commons/PersonAttribute";
import API from "../../api/apiUtils";
import { UserPersonCardDto } from "../../dto/person/search/PersonCardDtos";
import { PersonSearchRequestDto } from "../../dto/person/search/PersonSearchRequestDto";
import { Page } from "../subscriptions/subscriptions.service";

const BASE = "/persons";

/**
 * Récupère les attributs d'une Person donnée.
 * @param personId Identifiant de la Person
 * @returns Promise<PersonAttribute[]>
 * @throws Erreur si l'appel API échoue
 */
export async function getPersonAttributesById(personId: number): Promise<PersonAttributeLite[]> {
  try {
    const response = await API.get<PersonAttributeLite[]>(
      `${BASE}/${personId}/attributes`
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

/**
 * Recherche trombinoscope (filtrée/triée/paginée).
 * Envoie le body PersonSearchRequestDto et passe page/size en query (Spring Pageable).
 *
 * @param body   critères de recherche
 * @param page   index de page (0-based)
 * @param size   taille de page (ex: 24)
 */
export async function searchPersons(
  body: PersonSearchRequestDto,
  page = 0,
  size = 24
): Promise<Page<UserPersonCardDto>> {
  try {
    const { data } = await API.post<Page<UserPersonCardDto>>(
      `${BASE}/search`,
      body ?? {},
      { params: { page, size } } // Pageable Spring
    );
    return data;
  } catch (error) {
    console.error("[searchPersons] API error:", error);
    throw error;
  }
}


