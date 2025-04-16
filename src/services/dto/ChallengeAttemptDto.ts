export interface AddChallengeAttemptDto {
    userId: number;
    challengeVersionId: number;
  }
  
  export interface ChallengeQuestionDto {
    // à compléter selon les champs de votre DTO Java
    personId: number;
    photoUrl: string;
    // …
  }
  
  export interface CreatedChallengeAttemptDto {
    id: number;
    userId: number;
    challengeVersionId: number;
    challengeEntries: ChallengeQuestionDto[];
  }