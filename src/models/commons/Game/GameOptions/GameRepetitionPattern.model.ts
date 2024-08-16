export interface GameRepetitionPattern {
    patternName: string,
    frequency: number,
    quantity: number
}

export const repetitionPatterns = {
    never: { patternName: "never", frequency: 0, quantity: 0 },
    often: { patternName: "often", frequency: 3, quantity: 1 },
    always: { patternName: "always", frequency: 1, quantity: 1 },
    custom: { patternName: "custom", frequency: 1, quantity: 1 }
};