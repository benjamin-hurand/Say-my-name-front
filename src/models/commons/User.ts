import { UserOrganizationDto } from "../../services/dto/organization/UserOrganizationDto";
import { UserOrganization } from "../organizations/UserOrganization";

export interface User {
    id: number;
    username: string;
    email: string;
    roles: string;
    srsAlgorithm: SrsAlgorithm;
    organizations: UserOrganizationDto[];
}

export enum SrsAlgorithm {
  SM2  = 'SM2',
  PFA  = 'PFA',
  FSRS = 'FSRS',
}