import { PersonAttributeExtraLite } from "../../models/commons/PersonAttribute";

export interface PersonDto {
    id: number;
    personAttributes: PersonAttributeExtraLite[]
    photoUrl: string | null;
}