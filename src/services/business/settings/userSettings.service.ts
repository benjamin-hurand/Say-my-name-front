// src/services/business/settings/userSettings.service.ts
import API from "../../api/apiUtils"; // axios préconfiguré (baseURL '/api', auth, etc.)
import { SrsAlgorithm } from "../../../models/commons/User";

/** Miroir de UserSettingsDto côté BE */
export interface UserSettingsDto {
  srsAlgorithm: SrsAlgorithm;
}

/** Miroir de UpdateUserSettingsDto (PATCH partiel) */
export interface UpdateUserSettingsDto {
  srsAlgorithm?: SrsAlgorithm | null;
}

const BASE = "/profile/settings"; // -> /api/profile/settings via API

/** GET /api/profile/settings */
export async function getMySettings(opts?: { signal?: AbortSignal }): Promise<UserSettingsDto> {
  const { data } = await API.get<UserSettingsDto>(BASE, { signal: opts?.signal });
  return data;
}

/** PATCH /api/profile/settings (partiel), renvoie l’état complet à jour */
export async function updateMySettings(
  partial: UpdateUserSettingsDto,
  opts?: { signal?: AbortSignal }
): Promise<UserSettingsDto> {
  const { data } = await API.patch<UserSettingsDto>(BASE, partial, { signal: opts?.signal });
  return data;
}

/** Helpers ciblés SRS (utilisés par ta SettingsPage) */
export async function getMySrsAlgorithm(opts?: { signal?: AbortSignal }): Promise<SrsAlgorithm> {
  const { srsAlgorithm } = await getMySettings(opts);
  return srsAlgorithm;
}

export async function updateMySrsAlgorithm(
  algo: SrsAlgorithm,
  opts?: { signal?: AbortSignal }
): Promise<SrsAlgorithm> {
  const { srsAlgorithm } = await updateMySettings({ srsAlgorithm: algo }, opts);
  return srsAlgorithm;
}
