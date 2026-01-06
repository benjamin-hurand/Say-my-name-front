import { PersonDto } from "../../models/commons/PersonDto";
import { ChangeRequestSummary } from "../../models/commons/Profile/ChangeRequest";
import { User } from "../../models/commons/User";
import { ProfileXpSummaryDto } from "./leaderboard/XpSummaryDto";

export type PersonLinkAction = "DISABLED" | "DIRECT" | "REQUEST";

export interface ProfileOnboardingDto {
  createPerson: PersonLinkAction;
  pickPerson: PersonLinkAction;
}

export interface ProfileResponseDto {
  user: User;
  person: PersonDto | null;
  changeRequests: ChangeRequestSummary[];
  onboarding?: ProfileOnboardingDto; // présent surtout quand person == null
  xpSummary: ProfileXpSummaryDto;
}
