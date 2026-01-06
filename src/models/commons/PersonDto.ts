import { PersonAttribute } from "./PersonAttribute";
import { Photo } from "./Photo";

export interface PersonDto {
    id: number;
    photos: Photo[];
    attributes: PersonAttribute[];
}