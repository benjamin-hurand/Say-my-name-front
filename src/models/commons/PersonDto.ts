import { PersonAttribute } from "./PersonAttribute";
import { Photo } from "./Photo";

export interface PersonDto {
    id: number;
    displayName: string;
    photos: Photo[];
    attributes: PersonAttribute[];
}
