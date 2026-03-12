import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { Attribute } from "../models/commons/Attribute/Attribute";
import { Concept } from "../models/commons/Concept/Concept";

import { getAttributes, getFilters } from "../services/business/attributes/attribute.service";
import { getConcepts } from "../services/business/concept/concept.service";

import { useAuth } from "./AuthContext";

interface TenantDataContextType {
  attributes: Attribute[];
  filters: Attribute[];
  sorts: Attribute[];
  concepts: Concept[];
  /** utile pour l'UX (skeleton/loader) */
  loading: boolean;
}

const TenantDataContext = createContext<TenantDataContextType | undefined>(undefined);

export const TenantDataProvider = ({ children }: { children: ReactNode }) => {
  const { activeTenant } = useAuth();
  const orgId = activeTenant?.tenant.id ?? null;

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [filters, setFilters] = useState<Attribute[]>([]);
  const [sorts, setSorts] = useState<Attribute[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!orgId) {
      setAttributes([]);
      setFilters([]);
      setSorts([]);
      setConcepts([]);
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [allAttributes, allFilterAttributes, allConcepts] = await Promise.all([
          getAttributes({ options: true }),
          getFilters({ stats: true, options: true }),
          getConcepts(),
        ]);

        if (cancelled) return;

        setAttributes(allAttributes);
        setSorts(allAttributes.filter((attr) => Boolean(attr.sort)));
        setFilters(allFilterAttributes);
        setConcepts(allConcepts);
      } catch (error) {
        if (!cancelled) {
          console.error("[TenantData] Error fetching tenant data:", error);
        }
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
      concepts,
      loading,
    }),
    [attributes, filters, sorts, concepts, loading]
  );

  return <TenantDataContext.Provider value={value}>{children}</TenantDataContext.Provider>;
};

export const useTenantData = () => {
  const context = useContext(TenantDataContext);
  if (!context) {
    throw new Error("useTenantData must be used within a TenantDataProvider");
  }
  return context;
};