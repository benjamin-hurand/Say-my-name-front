import { PersonAttribute } from "./PersonAttribute";
import { Photo } from "./Photo";

export interface Profile {
    id: number;
    photo: Photo | null;
    attributes: PersonAttribute[]
}