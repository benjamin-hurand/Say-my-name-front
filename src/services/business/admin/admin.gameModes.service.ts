import API from "../../api/apiUtils";
import type {
  CreateGameModePayload,
  UpdateGameModePayload,
} from "../../../models/commons/Game/GameMode/GameMode.dto";
import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";

const ADMIN_ENDPOINT = "/admin";

/** POST /api/admin/gamemodes */
export async function createAdminGameMode(payload: CreateGameModePayload): Promise<GameMode> {
  const { data } = await API.post<GameMode>(`${ADMIN_ENDPOINT}/gamemodes`, payload);
  return data;
}

/** PUT /api/admin/gamemodes/{id} */
export async function updateAdminGameMode(
  id: number,
  payload: UpdateGameModePayload,
  opts?: { useIfMatch?: boolean }
): Promise<GameMode> {

  const { data } = await API.put<GameMode>(`${ADMIN_ENDPOINT}/gamemodes/${id}`, payload);
  return data;
}

/** DELETE /api/admin/gamemodes/{id} */
export async function deleteAdminGameMode(id: number): Promise<void> {
  await API.delete(`${ADMIN_ENDPOINT}/gamemodes/${id}`);
}

/** (optionnel) PATCH /api/admin/gamemodes/{id}/attributes — remplace la liste entière */
export async function replaceAdminGameModeAttributes(
  id: number,
  attributes: CreateGameModePayload["attributes"] // mêmes types write
): Promise<void> {
  await API.patch(`${ADMIN_ENDPOINT}/gamemodes/${id}/attributes`, attributes);
}
