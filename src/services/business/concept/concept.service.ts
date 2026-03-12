import { Concept } from "../../../models/commons/Concept/Concept";
import API from "../../api/apiUtils";

const endpoint = "/concepts";

/** Tous les concepts globaux disponibles */
export async function getConcepts(): Promise<Concept[]> {
  const { data } = await API.get<Concept[]>(endpoint);
  return data ?? [];
}