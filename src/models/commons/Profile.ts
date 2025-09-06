import { PersonAttributeFull } from "./PersonAttribute";
import { Photo } from "./Photo";

export interface Profile {
    id: number;
    photos: Photo[];
    attributes: PersonAttributeFull[];
}