// src/models/challenges/challengeCard.dto.ts

export interface ChallengeCardDto {
    challenge: ChallengeInfoDto;
    version: ChallengeVersionDto;
    attempt: ChallengeAttemptDto;
  }
  
  export interface ChallengeInfoDto {
    id: number;               // correspond à getChallengeId()
    description: string;      // correspond à getDescription()
    creationDate: string;     // correspond à getCreationDate() (format ISO)
    filter: ChallengeFilterDto;  // regroupant les infos du filtre d'attribut
    gameMode: ChallengeGameModeDto; // regroupant le titre et la description du game mode
    creator: ChallengeCreatorDto;   // regroupant l'id et le username du créateur
  }
  
  export interface ChallengeFilterDto {
    attributeId: number;      // getFilterAttributeId()
    attributeName: string;    // getAttributeName()
    filterType: string;       // getFilterType()
    minValue: string;         // getMinFilterValue()
    maxValue: string;         // getMaxFilterValue()
  }
  
  export interface ChallengeGameModeDto {
    id: number;
    title: string;            // getGameModeTitle()
    description: string;      // getGameModeDescription()
  }
  
  export interface ChallengeCreatorDto {
    id: number;               // getCreatorId()
    username: string;         // getCreatorUsername()
  }
  
  export interface ChallengeVersionDto {
    id: number;               // getChallengeVersionId()
    versionNumber: number;    // getVersionNumber()
    startDate: string;        // getVersionStartDate() (format ISO)
    endDate: string;          // getVersionEndDate() (format ISO)
    questionCount: number;    // getQuestionCount()
  }
  
  export interface ChallengeAttemptDto {
    nbParticipants: number;       // getNbParticipants()
    bestQuestionScore: number;      // getBestQuestionScore()
    bestTimeMs: number;             // getBestTimeMs()
    attemptStartDate: string;       // getAttemptStartDate() (format ISO)
  }
  