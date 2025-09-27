// services/business/attributes/attribute.service.ts
import { Attribute } from "../../../models/commons/Attribute";
import API from "../../api/apiUtils";

/** Construit la query string expand=... de façon homogène */
function buildExpandQS(opts?: { stats?: boolean; options?: boolean }) {
  const parts: string[] = [];
  if (opts?.stats) parts.push("stats");
  if (opts?.options) parts.push("options");
  return parts.length ? `?expand=${encodeURIComponent(parts.join(","))}` : "";
}

const endpoint = "/attributes";

/** Tous les attributs (expand optionnel: stats, options) */
export async function getAttributes(opts?: { stats?: boolean; options?: boolean }): Promise<Attribute[]> {
  const qs = buildExpandQS(opts);
  const { data } = await API.get<Attribute[]>(`${endpoint}${qs}`);
  return data ?? [];
}

/** Attributs filtrables (expand optionnel: stats, options) */
export async function getFilters(opts?: { stats?: boolean; options?: boolean }): Promise<Attribute[]> {
  const qs = buildExpandQS(opts);
  const { data } = await API.get<Attribute[]>(`${endpoint}/filters${qs}`);
  return data ?? [];
}

/** Attributs triables (expand optionnel: stats, options) */
export async function getSorts(opts?: { stats?: boolean; options?: boolean }): Promise<Attribute[]> {
  const qs = buildExpandQS(opts);
  const { data } = await API.get<Attribute[]>(`${endpoint}/sorts${qs}`);
  return data ?? [];
}
