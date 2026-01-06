import { UserShortDto } from "../../services/dto/UserShortDto";

export interface Photo {
  id: number;
  url: string;
  status: "PENDING" | "APPROVED"; // aligné avec enum PhotoStatus
  submittedAt: string; // ISO string (vient du LocalDateTime backend)
  submittedBy: UserShortDto;
  approvedAt?: string;
  approvedBy?: UserShortDto;
}