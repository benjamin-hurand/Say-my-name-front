import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Attribute } from '../models/commons/Attribute';
import { getAttributes, getFilters } from '../services/business/attributes/attribute.service';
import { getGameModes } from '../services/business/gamemodes/gameMode.service';
import { GameMode } from '../models/commons/Game/GameMode/GameMode.model';
import { fetchCurrentSeason } from '../services/business/challenges/challenge.service';
import { getPopulationList } from '../services/business/courses/population.service';
import { PopulationDto } from '../services/dto/courses/PopulationDto';

interface SeasonPeriod {
  start: Date;
  end: Date;
}

interface GlobalDataContextType {
  attributes: Attribute[];
  filters: Attribute[];
  sorts: Attribute[];
  modes: GameMode[];
  seasonPeriod: SeasonPeriod;
  competitiveSeason: number;
  populations: PopulationDto[];
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export const GlobalDataProvider = ({ children }: { children: ReactNode }) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [filters, setFilters] = useState<Attribute[]>([]);
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [modes, setModes] = useState<GameMode[]>([]);
  const [seasonPeriod, setSeasonPeriod] = useState<SeasonPeriod>({ start: new Date(), end: new Date() });
  const [competitiveSeason, setCompetitiveSeason] = useState<number>(0);
  const [populations, setPopulations] = useState<PopulationDto[]>([]);

  // Calcul de la semaine en cours (lundi à dimanche)
  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0=dim, 1=lun...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setSeasonPeriod({ start: monday, end: sunday });
  }, []);

  // 1) Tous les attributs avec options ENUM (pas besoin des stats ici)
  useEffect(() => {
    (async () => {
      try {
        const allAttributes = await getAttributes({ options: true });
        setAttributes(allAttributes);
        setSorts(allAttributes.filter(attr => Boolean(attr.sort)));
      } catch (error) {
        console.error("Error fetching attributes:", error);
      }
    })();
  }, []);

  // 2) Filtres avec stats observées + options ENUM (expand=stats,options)
  useEffect(() => {
    (async () => {
      try {
        const filt = await getFilters({ stats: true, options: true });
        setFilters(filt);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    })();
  }, []);

  // Modes de jeu
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

  // Saison actuelle
  useEffect(() => {
    (async () => {
      try {
        const season = await fetchCurrentSeason();
        if (season?.seasonNumber) {
          setCompetitiveSeason(season.seasonNumber);
        }
      } catch (error) {
        console.error("Error fetching current season", error);
      }
    })();
  }, []);

  // Populations
  useEffect(() => {
    (async () => {
      try {
        const pops = await getPopulationList();
        if (pops) {
          setPopulations(pops);
        }
      } catch (error) {
        console.error("Error fetching populations", error);
      }
    })();
  }, []);

  return (
    <GlobalDataContext.Provider
      value={{ attributes, filters, sorts, modes, seasonPeriod, competitiveSeason, populations }}
    >
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
