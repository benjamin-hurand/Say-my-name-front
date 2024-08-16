import { GameModeAttribute } from "./GameModeAttribute.model";

export interface GameMode {
    id: number,
    title: string,
    description: string,
    attributes: GameModeAttribute[], 
    operator: string
}