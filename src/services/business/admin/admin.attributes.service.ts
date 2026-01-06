import API from "../../api/apiUtils";
import type { Attribute } from "../../../models/commons/Attribute/Attribute";
import type {
  CreateAttributePayload,
  UpdateAttributePayload,
  AttributeUsageDto,
} from "../../../models/commons/Attribute/Attribute.dto";

const ADMIN_ENDPOINT = "/admin";

export async function createAdminAttribute(payload: CreateAttributePayload): Promise<Attribute> {
  const { data } = await API.post<Attribute>(`${ADMIN_ENDPOINT}/attributes`, payload);
  return data;
}

export async function updateAdminAttribute(
  id: number,
  payload: UpdateAttributePayload,
  opts?: { useIfMatch?: boolean }
): Promise<Attribute> {
  const maybeVersion = (payload as any)?.version;
  const headers =
    opts?.useIfMatch && maybeVersion != null
      ? { "If-Match": `W/"${maybeVersion}"` }
      : undefined;

  const { data } = await API.put<Attribute>(`${ADMIN_ENDPOINT}/attributes/${id}`, payload, { headers });
  return data;
}

export async function deleteAdminAttribute(id: number): Promise<void> {
  await API.delete(`${ADMIN_ENDPOINT}/attributes/${id}`);
}

export async function reorderAdminAttributes(items: { id: number; displayOrder: number }[]): Promise<void> {
  await API.patch(`${ADMIN_ENDPOINT}/attributes/reorder`, items);
}

export async function getAdminAttributeUsage(id: number): Promise<AttributeUsageDto> {
  const { data } = await API.get<AttributeUsageDto>(`${ADMIN_ENDPOINT}/attributes/usage/${id}`);
  return data;
}
