// src/contexts/OrgDataContext.tsx
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Attribute } from "../models/commons/Attribute/Attribute";
import { GameMode } from "../models/commons/Game/GameMode/GameMode.model";
import { getAttributes, getFilters } from "../services/business/attributes/attribute.service";
import { getGameModes } from "../services/business/gamemodes/gameMode.service";
import { useAuth } from "./AuthContext";

interface OrgDataContextType {
  attributes: Attribute[];
  filters: Attribute[];
  sorts: Attribute[];
  modes: GameMode[];
  /** utile pour l'UX (skeleton/loader) */
  loading: boolean;
}

const OrgDataContext = createContext<OrgDataContextType | undefined>(undefined);

export const OrgDataProvider = ({ children }: { children: ReactNode }) => {
  const { activeOrganization } = useAuth();
  const orgId = activeOrganization?.organizationId ?? null;

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [filters, setFilters] = useState<Attribute[]>([]);
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [modes, setModes] = useState<GameMode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 1) Reset data quand il n'y a plus d'orga (logout) ou quand l'orga change
  useEffect(() => {
    if (!orgId) {
      setAttributes([]);
      setFilters([]);
      setSorts([]);
      setModes([]);
      setLoading(false);
    }
  }, [orgId]);

  // 2) Fetch org data UNIQUEMENT si org présente
  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Un seul point d'orchestration, plus robuste et simple à annuler
        const [allAttributes, filt, fetchedModes] = await Promise.all([
          getAttributes({ options: true }),
          getFilters({ stats: true, options: true }),
          getGameModes(),
        ]);

        if (cancelled) return;

        setAttributes(allAttributes);
        setSorts(allAttributes.filter((attr) => Boolean(attr.sort)));
        setFilters(filt);
        setModes(fetchedModes);

      } catch (error) {
        if (!cancelled) console.error("[OrgData] Error fetching org data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const value = useMemo(
    () => ({
      attributes,
      filters,
      sorts,
      modes,
      loading,
    }),
    [attributes, filters, sorts, modes, loading]
  );

  return <OrgDataContext.Provider value={value}>{children}</OrgDataContext.Provider>;
};

export const useOrgData = () => {
  const context = useContext(OrgDataContext);
  if (!context) throw new Error("useOrgData must be used within a OrgDataProvider");
  return context;
};
