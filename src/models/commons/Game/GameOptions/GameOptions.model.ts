import { GameMode } from "../GameMode/GameMode.model";
import { GameFilter } from "./GameFilter.model";
import { GamePopulationScope } from "./GamePopulationScope.model";
import { GameRepetitionPattern } from "./GameRepetitionPattern.model";
import { GameSortBy } from "./GameSortBy.model";

export interface GameOptions {
    id: number,
    gameMode: GameMode | null,
    filters: GameFilter[],
    sortBy: GameSortBy[],
    populationScope?: GamePopulationScope,
    repetitionPattern: GameRepetitionPattern,
    initialGiven: boolean,
    typosFriendly: boolean
}