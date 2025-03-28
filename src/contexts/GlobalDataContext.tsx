// GlobalDataContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Attribute } from '../models/commons/Attribute';
import { getFilters, getSorts } from '../services/business/attributes/attribute.service';
import { getGameModes } from '../services/business/gamemodes/gameMode.service';
import { GameMode } from '../models/commons/Game/GameMode/GameMode.model';

interface GlobalDataContextType {
  filters: Attribute[];
  sorts: Attribute[];
  modes: GameMode[];
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export const GlobalDataProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Attribute[]>([]);
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [modes, setModes] = useState<GameMode[]>([]);

  // Fetch des filtres
  useEffect(() => {
    (async () => {
      try {
        const fetchedFilters: Attribute[] = await getFilters();
        setFilters(fetchedFilters);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    })();
  }, []);

  // Fetch des tris
  useEffect(() => {
    (async () => {
      try {
        const fetchedSorts: Attribute[] = await getSorts();
        setSorts(fetchedSorts);
      } catch (error) {
        console.error('Error fetching sorts:', error);
      }
    })();
  }, []);

  // Fetch des modes de jeu
  useEffect(() => {
    (async () => {
      try {
        const fetchedModes: GameMode[] = await getGameModes();
        setModes(fetchedModes);
      } catch (error) {
        console.error('Error fetching game modes:', error);
      }
    })();
  }, []);

  return (
    <GlobalDataContext.Provider value={{ filters, sorts, modes }}>
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error("useGlobalData must be used within a GlobalDataProvider");
  }
  return context;
};
