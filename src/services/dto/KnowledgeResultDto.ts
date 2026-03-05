export interface KnowledgeResultDto {
    knowledgeId: number;
    gactId: number;
    isCorrect: boolean;
    helpUsed: boolean;
    courseId: number | null;
    courseQuestionAttemptId: number | null;
    questionRound: number | null;
}