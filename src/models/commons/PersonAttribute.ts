import { Attribute } from "./Attribute";
import { Person } from "./Person";

export interface PersonAttribute {
    id?: number,
    attribute: Attribute,
    value: string,
    person: Person
}

export interface ResultAttr {
  attribute: { id: number; name: string }
  value: string
  isCorrect: boolean            // vrai/faux
  isTarget: boolean             // si c’est l’attribut demandé (ex. prénom)
}