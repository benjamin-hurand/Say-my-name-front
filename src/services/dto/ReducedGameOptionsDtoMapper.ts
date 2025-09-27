import { GameOptions } from "../../models/commons/Game/GameOptions/GameOptions.model";
import { ReducedGameAttributeFilterDto, ReducedGameAttributeSortDto, ReducedGameModeDto, ReducedGameOptionsDto } from "./ReducedGameOptionsDto";

export function toReducedGameOptionsDto(gameOptions: GameOptions): ReducedGameOptionsDto {
  // Transformation du gameMode
  const reducedGameMode: ReducedGameModeDto = {
    id: gameOptions.gameMode!.id,
    operator: gameOptions.gameMode!.operator,
    // On suppose que gameOptions.gameMode.attributes est un tableau de type { attribute: { id: number, ... } }
    attributeIds: gameOptions.gameMode!.attributes.map(attr => attr.attribute.id)
  };

  // Transformation des filtres
  const reducedFilters: ReducedGameAttributeFilterDto[] = gameOptions.filters.map(filter => ({
    attributeId: filter.attribute.id,
    minValue: filter.minValue,
    maxValue: filter.maxValue
  }));

  // Transformation des tris
  const reducedSortBy: ReducedGameAttributeSortDto[] = gameOptions.sortBy.map(sort => ({
    attributeId: sort.attribute.id,
    order: sort.order
  }));
  return {
    id: gameOptions.id,
    gameMode: reducedGameMode,
    filters: reducedFilters,
    sortBy: reducedSortBy,
    populationScope: gameOptions.populationScope ?? 'ALL',
  };
}
