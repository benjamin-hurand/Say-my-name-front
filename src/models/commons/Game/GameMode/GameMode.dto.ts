// src/models/commons/Game/GameMode/GameMode.dto.ts

// On garde une seule source de vérité pour l'opérateur.
export type LogicalOp = "AND" | "OR";

/** Écriture (ce qu’on envoie au backend) */
export interface GameModeAttributeWriteDto {
  /** id de l'association attribut<->gamemode (facultatif en création) */
  id?: number;
  /** identifiant de l'attribut lié */
  attributeId: number;
}

export interface CreateGameModePayload {
  title: string;
  description?: string | null; // le back peut accepter null ; ton domaine peut mapper vers ""
  operator: LogicalOp;
  attributes: GameModeAttributeWriteDto[];
}

export interface UpdateGameModePayload {
  id: number;
  title: string;
  description?: string | null;
  operator: LogicalOp;
  attributes: GameModeAttributeWriteDto[];
}
