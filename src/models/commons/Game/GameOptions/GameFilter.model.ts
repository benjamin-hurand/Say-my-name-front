import { Attribute } from "../../Attribute/Attribute";

export interface GameFilter {
    id: number,
    attribute: Attribute,
    minValue: string,
    maxValue: string
}
