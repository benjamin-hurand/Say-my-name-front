import { PublicUser } from "../PublicUser";
import { GameMode } from "./GameMode/GameMode.model";
import { GameFilter } from "./GameOptions/GameFilter.model";

export interface Challenge {
    id: number,
    description: string,
    gameMode: GameMode,
    filterAttribute: GameFilter,
    creationDate: string,
    creator: PublicUser
}