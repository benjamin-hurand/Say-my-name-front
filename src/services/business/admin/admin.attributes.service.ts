import API from "../../api/apiUtils";
import type { Attribute } from "../../../models/commons/Attribute/Attribute";
import type {
  CreateAttributePayload,
  UpdateAttributePayload,
} from "../../../models/commons/Attribute/Attribute.dto";

const ADMIN_ENDPOINT = "/admin";

export async function getAdminAttributes(): Promise<Attribute[]> {
  const { data } = await API.get<Attribute[]>(`${ADMIN_ENDPOINT}/attributes`);
  return data;
}

export async function createAdminAttribute(payload: CreateAttributePayload): Promise<Attribute> {
  const { data } = await API.post<Attribute>(`${ADMIN_ENDPOINT}/attributes`, payload);
  return data;
}

export async function updateAdminAttribute(
  id: number,
  payload: UpdateAttributePayload,
): Promise<Attribute> {
  const { data } = await API.put<Attribute>(`${ADMIN_ENDPOINT}/attributes/${id}`, payload);
  return data;
}

export async function deleteAdminAttribute(id: number): Promise<void> {
  await API.delete(`${ADMIN_ENDPOINT}/attributes/${id}`);
}

export async function reorderAdminAttributes(items: { id: number; displayOrder: number }[]): Promise<void> {
  await API.patch(`${ADMIN_ENDPOINT}/attributes/reorder`, items);
}
