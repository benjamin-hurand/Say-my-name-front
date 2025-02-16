// GameRepetitionPattern.model.ts
export interface GameRepetitionPattern {
    patternName: string;
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  }
  
  export const repetitionPatterns: { [key: string]: GameRepetitionPattern } = {
    never: { patternName: "never", initialEasinessFactor: 2.5, initialInterval: -1, secondInterval: -1 },
    optimal: { patternName: "optimal", initialEasinessFactor: 2.5, initialInterval: 1, secondInterval: 4 },
    immediate: { patternName: "immediate", initialEasinessFactor: 2.5, initialInterval: 0, secondInterval: 1 }
  };  

  export interface SpacedRepetitionData {
    totalRepetitionCount: number;
    correctRepetitionCount: number;  // n
    easinessFactor: number;   // EF (starts at ~2.5)
    interval: number;         // I, measured in “rounds” (i.e. questions)
  }
  