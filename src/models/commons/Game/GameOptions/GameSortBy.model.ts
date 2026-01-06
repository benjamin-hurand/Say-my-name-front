import { Attribute } from "../../Attribute/Attribute";

export interface GameSortBy {
    id: number,
    attribute: Attribute,
    order: 'ASC' | 'DESC'
}