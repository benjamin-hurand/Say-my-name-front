// src/contexts/AdminCRCacheContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ChangeRequestSummary } from "../models/commons/Profile/ChangeRequest";

type CRPage = {
  content: ChangeRequestSummary[];
  totalElements: number;
  totalPages: number;
};

type CacheEntry = {
  page: CRPage;
  fetchedAt: number;         // Date.now()
  reservedHeight?: number;   // hauteur mesurée pour éviter le layout shift
};

type AdminCRCacheState = {
  pendingFirst?: CacheEntry | null;
};

type AdminCRCacheCtx = {
  getPendingFirst: () => CacheEntry | null;
  setPendingFirst: (page: CRPage) => void;
  isFresh: (entry: CacheEntry | null, ttlMs?: number) => boolean;
  getReservedHeight: () => number | null;
  setReservedHeight: (h: number) => void;
  clearPendingFirst: () => void;
};

// TTL par défaut : 60 secondes
const DEFAULT_TTL_MS = 60_000;

const Ctx = createContext<AdminCRCacheCtx | undefined>(undefined);

export const AdminCRCacheProvider: React.FC<{ children: React.ReactNode; ttlMs?: number }> = ({
  children,
}) => {
  const [state, setState] = useState<AdminCRCacheState>({ pendingFirst: null });

  const getPendingFirst = useCallback(() => state.pendingFirst ?? null, [state.pendingFirst]);

  const setPendingFirst = useCallback((page: CRPage) => {
    setState((prev) => ({
      ...prev,
      pendingFirst: {
        page,
        fetchedAt: Date.now(),
        reservedHeight: prev.pendingFirst?.reservedHeight,
      },
    }));
  }, []);

  const isFresh = useCallback((entry: CacheEntry | null, ttlMs: number = DEFAULT_TTL_MS) => {
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < ttlMs;
  }, []);

  const getReservedHeight = useCallback(() => state.pendingFirst?.reservedHeight ?? null, [state.pendingFirst]);
  const setReservedHeight = useCallback((h: number) => {
    setState((prev) => {
      if (!prev.pendingFirst) return prev;
      if (prev.pendingFirst.reservedHeight === h) return prev;
      return {
        ...prev,
        pendingFirst: { ...prev.pendingFirst, reservedHeight: h },
      };
    });
  }, []);

  const clearPendingFirst = useCallback(() => {
    setState((s) => ({ ...s, pendingFirst: null }));
  }, []);

  const value = useMemo<AdminCRCacheCtx>(
    () => ({
      getPendingFirst,
      setPendingFirst,
      isFresh,
      getReservedHeight,
      setReservedHeight,
      clearPendingFirst,
    }),
    [getPendingFirst, setPendingFirst, isFresh, getReservedHeight, setReservedHeight, clearPendingFirst]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAdminCRCache = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminCRCache must be used within AdminCRCacheProvider");
  return ctx;
};
