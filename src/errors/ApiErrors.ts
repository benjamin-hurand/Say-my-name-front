// src/errors/ApiErrors.ts

/**
 * Base pour toutes les erreurs d'API liées aux ChallengeAttempts
 */
export class ApiError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = this.constructor.name;
      // Pour que instanceof fonctionne même après transpilation
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  
  /** Tentative non trouvée (HTTP 404) */
  export class AttemptNotFoundError extends ApiError {
    constructor(attemptId?: number | string) {
      super(`Attempt not found${attemptId !== undefined ? `: ${attemptId}` : ''}`);
    }
  }
  
  /** Tentative déjà démarrée (HTTP 409 sur /continue) */
  export class ChallengeAlreadyStartedError extends ApiError {
    constructor(attemptId?: number | string) {
      super(`Attempt already started${attemptId !== undefined ? `: ${attemptId}` : ''}`);
    }
  }
  
  /** Tentative déjà terminée (HTTP 409 sur /stop) */
  export class ChallengeAlreadyEndedError extends ApiError {
    constructor(attemptId?: number | string) {
      super(`Attempt already ended${attemptId !== undefined ? `: ${attemptId}` : ''}`);
    }
  }
  