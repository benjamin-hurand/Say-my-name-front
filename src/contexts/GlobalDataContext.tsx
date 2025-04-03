import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Attribute } from '../models/commons/Attribute';
import { getFilters, getSorts } from '../services/business/attributes/attribute.service';
import { getGameModes } from '../services/business/gamemodes/gameMode.service';
import { GameMode } from '../models/commons/Game/GameMode/GameMode.model';
import { fetchCurrentSeason } from '../services/business/challenges/challenge.service';

interface WeekPeriod {
  start: Date;
  end: Date;
}

interface GlobalDataContextType {
  filters: Attribute[];
  sorts: Attribute[];
  modes: GameMode[];
  currentWeek: WeekPeriod;
  competitiveSeason: number;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export const GlobalDataProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Attribute[]>([]);
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [modes, setModes] = useState<GameMode[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeekPeriod>({ start: new Date(), end: new Date() });
  const [competitiveSeason, setCompetitiveSeason] = useState<number>(0);

  // Calcul de la semaine en cours (lundi à dimanche)
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    // En JavaScript, 0 = dimanche, 1 = lundi, etc.
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setCurrentWeek({ start: monday, end: sunday });
  }, []);

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

  // Récupérer la saison actuelle depuis l'API
  useEffect(() => {
    (async () => {
      try {
        const season = await fetchCurrentSeason();
        if (season && season.seasonNumber) {
          setCompetitiveSeason(season.seasonNumber);
        }
      } catch (error) {
        console.error("Error fetching current season", error);
      }
    })();
  }, []);

  return (
    <GlobalDataContext.Provider value={{ filters, sorts, modes, currentWeek, competitiveSeason }}>
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
