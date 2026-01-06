// src/services/business/admin/admin.changeRequests.service.ts
import API from "../../api/apiUtils";
import {
  ChangeRequestStatus,
  ChangeRequestSummary,
} from "../../../models/commons/Profile/ChangeRequest";
import { ResolveChangeRequestDto } from "../../dto/admin/change-requests";

const ADMIN_ENDPOINT = "/admin";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number;   // page size
}

export interface ListAdminChangeRequestsParams {
  page?: number;
  size?: number;
  statuses?: ChangeRequestStatus[]; // <- liste de statuts
  personId?: number;
  submittedByUserId?: number;
  attributeId?: number;
  action?: "CREATE" | "UPDATE" | "DELETE";
  sort?: string; // ex: "createdAt,desc"
  q?: string;
  from?: string; // ISO
  to?: string;   // ISO
}

/** GET /api/admin/change-requests */
export async function listAdminChangeRequests(
  params: ListAdminChangeRequestsParams = {}
): Promise<Page<ChangeRequestSummary>> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));

  // ⚠️ IMPORTANT: envoyer statuses comme paramètres répétés
  if (params.statuses && params.statuses.length > 0) {
    for (const st of params.statuses) {
      search.append("statuses", st);
    }
  }

  if (params.personId !== undefined) search.set("personId", String(params.personId));
  if (params.submittedByUserId !== undefined) search.set("submittedByUserId", String(params.submittedByUserId));
  if (params.attributeId !== undefined) search.set("attributeId", String(params.attributeId));
  if (params.action) search.set("action", params.action);
  if (params.sort) search.set("sort", params.sort);
  if (params.q) search.set("q", params.q);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);

  const queryString = search.toString();
  const url = `${ADMIN_ENDPOINT}/change-requests${queryString ? `?${queryString}` : ""}`;

  const { data } = await API.get<Page<ChangeRequestSummary>>(url);
  return data;
}

/** Helper : seulement les PENDING */
export async function listPendingChangeRequests(
  overrides: Omit<ListAdminChangeRequestsParams, "statuses"> = {}
): Promise<Page<ChangeRequestSummary>> {
  return listAdminChangeRequests({
    statuses: ["PENDING"],
    sort: "createdAt,desc",
    ...overrides,
  });
}

/** POST /api/admin/change-requests/{id}/resolve */
export async function resolveChangeRequest(
  changeRequestId: number,
  payload: ResolveChangeRequestDto
): Promise<void> {
  const body = {
    resolutionComment: payload.resolutionComment ?? null,
    decisions: Array.isArray(payload.decisions) ? payload.decisions : [],
  };
  await API.post(`${ADMIN_ENDPOINT}/change-requests/${changeRequestId}/resolve`, body);
}

/** (Optionnel) POST /api/admin/change-requests/_bulk-resolve */
export async function bulkResolveChangeRequests(
  ids: number[],
  decision: "APPROVE" | "REJECT"
): Promise<void> {
  await API.post(`${ADMIN_ENDPOINT}/change-requests/_bulk-resolve`, { ids, decision });
}
