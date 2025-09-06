import { UserDto } from "../../services/dto/UserDto";

export interface Photo {
  id: number;
  url: string;
  status: "PENDING" | "APPROVED"; // aligné avec enum PhotoStatus
  submittedAt: string; // ISO string (vient du LocalDateTime backend)
  submittedBy: UserDto;
  approvedAt?: string;
  approvedBy?: UserDto;
}