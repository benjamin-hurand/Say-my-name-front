// GameRepetitionPattern.model.ts
export interface GameRepetitionPattern {
    patternName: string;
    initialRepetitionCount: number;
    initialEasinessFactor: number;
    initialInterval: number | "Infinity";
  }
  
  export const repetitionPatterns: { [key: string]: GameRepetitionPattern } = {
    never: { patternName: "never", initialRepetitionCount: 0, initialEasinessFactor: 2.5, initialInterval: Infinity },
    optimal: { patternName: "optimal", initialRepetitionCount: 0, initialEasinessFactor: 2.5, initialInterval: 1 },
    immediate: { patternName: "immediate", initialRepetitionCount: 0, initialEasinessFactor: 2.5, initialInterval: 0 },
    custom: { patternName: "custom", initialRepetitionCount: 0, initialEasinessFactor: 2.5, initialInterval: 1 } // advanced option
  };  

  export interface SpacedRepetitionData {
    repetitionCount: number;  // n
    easinessFactor: number;   // EF (starts at ~2.5)
    interval: number;         // I, measured in “rounds” (i.e. questions)
    nextDueRound: number;     // The round (or question count) when this item is due next
  }
  