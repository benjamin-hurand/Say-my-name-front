import { Challenge } from "../../models/commons/Game/Challenge"

export interface CreatedChallengeVersionDto {
    versionNumber: number,
    startDate: string
    firstSeasonNumber: number,
    challenge: Challenge
    questionCount: number
}