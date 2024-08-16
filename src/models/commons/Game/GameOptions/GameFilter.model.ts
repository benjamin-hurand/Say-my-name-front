import { Attribute } from "../../Attribute";

export interface GameFilter {
    id: number,
    attribute: Attribute,
    minValue: string,
    maxValue: string
}
