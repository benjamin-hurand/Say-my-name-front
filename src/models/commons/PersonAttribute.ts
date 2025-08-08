import { Attribute } from "./Attribute";

export interface PersonAttribute {
    id?: number,
    attribute: Attribute,
    value: string,
    personId: number
}

export interface ResultAttr {
  attribute: { id: number; name: string }
  value: string
  isCorrect: boolean            // vrai/faux
  isTarget: boolean             // si c’est l’attribut demandé (ex. prénom)
}