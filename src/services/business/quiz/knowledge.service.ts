// src/services/knowledgeService.ts
import API from "../../api/apiUtils";
import { KnowledgeResultDto } from "../../dto/KnowledgeResultDto";

const endpoint = "/knowledges";

/**
 * Envoie un batch de résultats de quiz au backend.
 *
 * @param results – tableau de KnowledgeResultDto à envoyer
 * @returns Promise<void> – se résout quand l’API a renvoyé 200 OK
 * @throws en cas d’erreur réseau ou serveur
 */
export async function submitResults(
  results: KnowledgeResultDto[]
): Promise<void> {
  try {
    // on n’attend pas de contenu en retour (204 ou 200 sans corps)
    await API.post<void>(`${endpoint}/results`, results);
  } catch (error) {
    console.error("Failed to post quiz results:", error);
    throw error;
  }
}
