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
