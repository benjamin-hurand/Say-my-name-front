import { ReducedGameAttributeFilterDto } from "./ReducedGameOptionsDto"

export interface AddChallengeDto {
    description: string,
    gameModeId: number,
    attributeFilter: ReducedGameAttributeFilterDto,
    creatorId: number
}