import { GamePopulationScope } from "../../models/commons/Game/GameOptions/GamePopulationScope.model";

export interface ReducedGameModeDto {
    id: number;
    operator: string;
    attributeIds: number[];
  }
  
  export interface ReducedGameAttributeFilterDto {
    attributeId: number;
    minValue: string;
    maxValue: string;
  }
  
  export interface ReducedGameAttributeSortDto {
    attributeId: number;
    order: string;
  }
  
  export interface ReducedGameOptionsDto {
    id: number;
    gameMode: ReducedGameModeDto;
    filters: ReducedGameAttributeFilterDto[];
    sortBy: ReducedGameAttributeSortDto[];
    populationScope?: GamePopulationScope;
  }
  