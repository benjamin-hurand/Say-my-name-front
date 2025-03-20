import { Attribute } from "../../Attribute";

export interface GameSortBy {
    id: number,
    attribute: Attribute,
    order: 'ASC' | 'DESC'
}