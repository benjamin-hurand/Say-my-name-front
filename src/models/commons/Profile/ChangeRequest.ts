import { UserDto } from "../../../services/dto/UserDto";

export type ChangeAction = "UPDATE" | "DELETE" | "CREATE";
export type ChangeStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

export type ChangeRequest = {
    id: number;
    action: ChangeAction;
    status: ChangeStatus;
    proposedValue: string;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
    attributeId: number;
    attributeName: string;
    personAttributeId: number | null;
}

export type ChangeRequestItemSummary = {
  id: number;
  attributeId: number | null;       // présent surtout pour CREATE (peut être null selon l’action)
  personAttributeId: number | null; // présent pour UPDATE/DELETE (sinon null)
  action: ChangeAction;
  proposedValue: string | null;     // null pour DELETE
};

export type ChangeRequestSummary = {
  id: number;
  requester: UserDto;
  requestReason: string;
  status: ChangeStatus;
  createdAt: string;                // ISO (LocalDateTime côté back)
  updatedAt: string;                // ISO
  resolvedBy: UserDto | null;
  resolvedAt: string | null;        // ISO
  resolutionComment: string | null;
  items: ChangeRequestItemSummary[];
};
