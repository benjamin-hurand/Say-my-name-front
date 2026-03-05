// src/contexts/OrgDataContext.tsx
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Attribute } from "../models/commons/Attribute/Attribute";
import { getAttributes, getFilters } from "../services/business/attributes/attribute.service";
import { useAuth } from "./AuthContext";

interface TenantDataContextType {
  attributes: Attribute[];
  filters: Attribute[];
  sorts: Attribute[];
  /** utile pour l'UX (skeleton/loader) */
  loading: boolean;
}

const TenantDataContext = createContext<TenantDataContextType | undefined>(undefined);

export const TenantDataProvider = ({ children }: { children: ReactNode }) => {
  const { activeTenant } = useAuth();
  const orgId = activeTenant?.tenantId ?? null;

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [filters, setFilters] = useState<Attribute[]>([]);
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 1) Reset data quand il n'y a plus d'orga (logout) ou quand l'orga change
  useEffect(() => {
    if (!orgId) {
      setAttributes([]);
      setFilters([]);
      setSorts([]);
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
        const [allAttributes, allFilterAttributes] = await Promise.all([
          getAttributes({ options: true }),
          getFilters({ stats: true, options: true }),
        ]);

        if (cancelled) return;

        setAttributes(allAttributes);
        setSorts(allAttributes.filter((attr) => Boolean(attr.sort)));
        setFilters(allFilterAttributes);

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
      loading,
    }),
    [attributes, filters, sorts, loading]
  );

  return <TenantDataContext.Provider value={value}>{children}</TenantDataContext.Provider>;
};

export const useTenantData = () => {
  const context = useContext(TenantDataContext);
  if (!context) throw new Error("useTenantData must be used within a TenantDataProvider");
  return context;
};
