import { PersonDto } from "../../../../models/commons/PersonDto";
import { ChangeRequestSummary } from "../../../../models/commons/Profile/ChangeRequest";
import { User } from "../../../../models/commons/User";
import { PersonEmailDto } from "./PersonEmailDto";

export interface AdminPersonDetailsDto {
  person: PersonDto;
  user: User | null;
  changeRequests: ChangeRequestSummary[];
  emails: PersonEmailDto[];
}
