// src/services/business/change-requests/changeRequests.builders.ts

import { SubmitChangeRequestRequest } from "../../dto/ChangeRequestsDto";

export function buildCreateRequest(
  personId: number,
  attributeId: number,
  proposedValue: string,
  reason: string
): SubmitChangeRequestRequest {
  return { personId, attributeId, action: "CREATE", proposedValue, reason };
}

export function buildUpdateRequest(
  personId: number,
  attributeId: number,
  personAttributeId: number,
  proposedValue: string,
  reason: string
): SubmitChangeRequestRequest {
  return {
    personId,
    attributeId,
    personAttributeId,
    action: "UPDATE",
    proposedValue,
    reason,
  };
}

export function buildDeleteRequest(
  personId: number,
  attributeId: number,
  personAttributeId: number,
  reason: string
): SubmitChangeRequestRequest {
  return { personId, attributeId, personAttributeId, action: "DELETE", reason };
}
