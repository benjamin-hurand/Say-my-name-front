import { GameMode } from "../GameMode/GameMode.model";
import { GameFilter } from "./GameFilter.model";
import { GameRepetitionPattern } from "./GameRepetitionPattern.model";
import { GameSortBy } from "./GameSortBy.model";

export interface GameOptions {
    id: number,
    gameMode: GameMode,
    filters: GameFilter[],
    sortBy: GameSortBy[],
    repetitionPattern: GameRepetitionPattern,
    typosFriendly: boolean,
    initialGiven: boolean
}