// src/services/business/admin/admin.service.ts
import { AttributeValuesResponseDto } from "../../../models/commons/PersonAttribute";
import { AttributeChanges } from "../../../models/commons/Profile/AttributesChanges";
import API from "../../api/apiUtils";
import { AdminPersonDetailsDto } from "../../dto/person/admin/AdminPersonDetailsDto";
import { AdminPersonCardDto } from "../../dto/person/search/PersonCardDtos";
import { PersonSearchRequestDto } from "../../dto/person/search/PersonSearchRequestDto";

// Endpoints
const ADMIN_ENDPOINT = "/admin";

/** Récupère les KPIs globaux (persons, attributes) */
export async function fetchAdminKpis(): Promise<{ persons: number; attributes: number}> {
  const res = await API.get(`${ADMIN_ENDPOINT}/kpis`);
  return res.data;
}

/** Recherche paginée des personnes côté admin */
export async function searchPersonsForAdmin(
  criteria: PersonSearchRequestDto,
  pageable: { page?: number; size?: number }
): Promise<{ content: AdminPersonCardDto[]; totalElements: number; totalPages: number; number: number }> {
  const params = new URLSearchParams();
  if (pageable.page !== undefined) params.append("page", pageable.page.toString());
  if (pageable.size !== undefined) params.append("size", pageable.size.toString());

  const res = await API.post(`${ADMIN_ENDPOINT}/persons/search?${params.toString()}`, criteria);
  return res.data;
}

/** Ton endpoint existant (un seul attribut) */
export async function updatePersonForAdmin(
  personId: number,
  attributeId: number,
  changes: AttributeChanges
): Promise<AttributeValuesResponseDto> {
  const { data } = await API.post<AttributeValuesResponseDto>(
    `${ADMIN_ENDPOINT}/persons/${personId}/attributes/${attributeId}/bulk`,
    changes
  );
  return data;
}

/** helper: delta vide ? */
export function isEmptyChanges(c?: AttributeChanges | null): boolean {
  if (!c) return true;
  const cr = Array.isArray(c.create) ? c.create.length : 0;
  const up = Array.isArray(c.update) ? c.update.length : 0;
  const del = Array.isArray(c.delete) ? c.delete.length : 0;
  return cr + up + del === 0;
}

/** Multi-attributes: n’envoie que les deltas non vides */
export async function updateManyPersonAttributesForAdmin(
  personId: number,
  changesByAttributeId: Record<number, AttributeChanges>
): Promise<{ results: Record<number, AttributeValuesResponseDto | null>; errors: Record<number, unknown> }> {
  const entries = Object.entries(changesByAttributeId)
    .map(([k, v]) => [Number(k), v] as [number, AttributeChanges])
    .filter(([, changes]) => !isEmptyChanges(changes)); // 👈 prune vide

  const results: Record<number, AttributeValuesResponseDto | null> = {};
  const errors: Record<number, unknown> = {};

  if (entries.length === 0) {
    return { results, errors }; // rien à faire
  }

  await Promise.all(
    entries.map(async ([attrId, changes]) => {
      try {
        const res = await updatePersonForAdmin(personId, attrId, changes);
        results[attrId] = res;
      } catch (e) {
        results[attrId] = null;
        errors[attrId] = e;
      }
    })
  );

  return { results, errors };
}

// Détails complets pour Admin (actuel + futur + change requests)
export async function getAdminPersonDetails(
  personId: number,
  opts?: { includeFuture?: boolean; includeChangeRequests?: boolean }
): Promise<AdminPersonDetailsDto> {
  const params = new URLSearchParams();
  if (opts?.includeFuture) params.set("includeFuture", "true");
  if (opts?.includeChangeRequests) params.set("includeChangeRequests", "true");

  const { data } = await API.get<AdminPersonDetailsDto>(
    `${ADMIN_ENDPOINT}/persons/${personId}/details${params.toString() ? `?${params}` : ""}`
  );
  return data;
}