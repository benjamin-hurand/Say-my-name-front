import { Attribute } from "./Attribute";
import { Person } from "./Person";

export interface PersonAttribute {
    id: number,
    attribute: Attribute,
    value: string,
    person: Person
}