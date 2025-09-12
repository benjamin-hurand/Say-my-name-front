// src/services/business/change-requests/changeRequests.builders.ts

import { SubmitChangeRequestDto } from "../../dto/ChangeRequestsDto";

export function buildCreateRequest(
  personId: number,
  attributeId: number,
  proposedValue: string,
  reason: string
): SubmitChangeRequestDto {
  return { personId, attributeId, action: "CREATE", proposedValue, reason };
}

export function buildUpdateRequest(
  personId: number,
  attributeId: number,
  personAttributeId: number,
  proposedValue: string,
  reason: string
): SubmitChangeRequestDto {
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
): SubmitChangeRequestDto {
  return { personId, attributeId, personAttributeId, action: "DELETE", reason };
}
