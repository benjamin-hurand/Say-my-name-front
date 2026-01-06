import { UserShortDto } from "../../../services/dto/UserShortDto";
import { PersonAttributeMinimalDto } from "../PersonAttribute";

export type ChangeAction = "UPDATE" | "DELETE" | "CREATE";
export type ChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "CANCELED";

export type ChangeRequestItemStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED";

export type ChangeRequest = {
  id: number;
  action: ChangeAction;
  status: ChangeRequestStatus;
  proposedValue: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  attributeId: number;
  attributeName: string;
  personAttributeId: number | null;
};

export interface ChangeRequestItemSummary {
  id: number;
  personAttribute: PersonAttributeMinimalDto | null; // null pour CREATE
  action: ChangeAction;
  proposedValue: string | null; // null pour DELETE
  decision?: ChangeRequestItemStatus; // uniquement si résolu
}

export interface ChangeRequestSummary {
  id: number;
  requester: UserShortDto | null;
  attributeId: number | null; // clé pour retrouver le label côté front
  requestReason: string | null;
  status: ChangeRequestStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  resolvedBy: UserShortDto | null;
  resolvedAt: string | null; // ISO
  resolutionComment: string | null;
  items: ChangeRequestItemSummary[];

  personId?: number;
  personSummary?: {
    displayName: string; // construit à partir des primaires ACTUELS
    photoUrl?: string;
  };
  attributePreview?: {
    baselineFutureValues: PersonAttributeMinimalDto[];
    finalIfApproved: string[] | null;
  };
  resolutionSummary?: {
    total: number;
    approvedItems: number;
    rejectedItems: number;
  };
  counters?: {
    total: number; // nombre d'items
    byAction: Partial<Record<ChangeAction, number>>;
  };
}
