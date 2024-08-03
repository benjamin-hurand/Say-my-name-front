import React, { createContext, useState, useContext, ReactNode, FunctionComponent } from 'react';
import { neonColors } from '../models/commons/NeonColors';

interface ColorContextType {
    color: string;
    changeColor: (newColor: string) => void;
    randomizeColor: () => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const useColor = (): ColorContextType => {
    const context = useContext(ColorContext);
    if (!context) {
        throw new Error('useColor must be used within a ColorProvider');
    }
    return context;
};

interface ColorProviderProps {
    children: ReactNode;
}

export const ColorProvider: FunctionComponent<ColorProviderProps> = ({ children }) => {
    const [color, setColor] = useState<string>(neonColors[0]); // Start with the first neon color

    const changeColor = (newColor: string) => {
        setColor(newColor);
    };

    const randomizeColor = () => {
        const randomIndex = Math.floor(Math.random() * neonColors.length);
        setColor(neonColors[randomIndex]);
    };

    const value = { color, changeColor, randomizeColor };

    return (
        <ColorContext.Provider value={value}>
            {children}
        </ColorContext.Provider>
    );
};