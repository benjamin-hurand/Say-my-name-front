// src/contexts/CourseStatsContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { CourseStatsDto } from '../services/dto/courses/CourseStatsDto';
import { getCourseStats } from '../services/business/courses/course.service';
import { useCourse } from './CoursesContext';

type StatsCacheEntry = {
  data: CourseStatsDto;
  fetchedAt: number; // epoch ms
};

type CourseStatsContextValue = {
  // compat : stats & loading reflètent le cours sélectionné (s’il existe)
  stats: CourseStatsDto | null;
  loading: boolean;
  error: any;

  // multi-courses
  get: (courseId: number) => CourseStatsDto | null;
  isLoading: (courseId: number) => boolean;
  refresh: (courseId: number, opts?: { force?: boolean; ttlMs?: number }) => Promise<CourseStatsDto>;
  prefetch: (courseIds: number[], opts?: { ttlMs?: number }) => Promise<void>;
  invalidate: (courseId?: number) => void;
  set: (courseId: number, stats: CourseStatsDto) => void;
};

const CourseStatsContext = createContext<CourseStatsContextValue | undefined>(undefined);

const DEFAULT_TTL = 60_000; // 60s

export const CourseStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedCourseId } = useCourse();

  const [cache, setCache] = useState<Record<number, StatsCacheEntry>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [errorById, setErrorById] = useState<Record<number, any>>({});

  // ⬇️ Correction ici : valeur optionnelle dans le record
  const inFlight = useRef<Record<number, Promise<CourseStatsDto> | undefined>>({});

  const set = useCallback((courseId: number, data: CourseStatsDto) => {
    setCache(prev => ({ ...prev, [courseId]: { data, fetchedAt: Date.now() } }));
    setErrorById(prev => {
      const { [courseId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const markLoading = useCallback((courseId: number, on: boolean) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      if (on) next.add(courseId);
      else next.delete(courseId);
      return next;
    });
  }, []);

  const shouldRefetch = useCallback((courseId: number, ttlMs: number) => {
    const entry = cache[courseId];
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > ttlMs;
  }, [cache]);

  const refresh = useCallback(async (courseId: number, opts?: { force?: boolean; ttlMs?: number }) => {
    const ttlMs = opts?.ttlMs ?? DEFAULT_TTL;
    const force = !!opts?.force;

    if (!force && !shouldRefetch(courseId, ttlMs) && cache[courseId]) {
      return cache[courseId].data;
    }

    // ⬇️ Correction ici : lis dans une variable optionnelle
    const existing = inFlight.current[courseId];
    if (existing) {
      return existing;
    }

    markLoading(courseId, true);
    const p = getCourseStats(courseId)
      .then((data) => {
        set(courseId, data);
        return data;
      })
      .catch((err) => {
        setErrorById(prev => ({ ...prev, [courseId]: err }));
        throw err;
      })
      .finally(() => {
        markLoading(courseId, false);
        // ⬇️ nettoie l’inflight
        delete inFlight.current[courseId];
      });

    inFlight.current[courseId] = p;
    return p;
  }, [cache, set, markLoading, shouldRefetch]);

  const prefetch = useCallback(async (courseIds: number[], opts?: { ttlMs?: number }) => {
    await Promise.all(
      courseIds.map(id => refresh(id, { ttlMs: opts?.ttlMs }))
    );
  }, [refresh]);

  const get = useCallback((courseId: number) => cache[courseId]?.data ?? null, [cache]);

  const invalidate = useCallback((courseId?: number) => {
    if (courseId == null) {
      setCache({});
      setErrorById({});
      inFlight.current = {};
      setLoadingIds(new Set());
      return;
    }
    setCache(prev => {
      const { [courseId]: _, ...rest } = prev;
      return rest;
    });
    setErrorById(prev => {
      const { [courseId]: __, ...rest } = prev;
      return rest;
    });
    delete inFlight.current[courseId];
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(courseId);
      return next;
    });
  }, []);

  // ---- valeurs “compat” pour le cours sélectionné ----
  const stats = useMemo(() => {
    if (selectedCourseId == null) return null;
    return cache[selectedCourseId]?.data ?? null;
  }, [selectedCourseId, cache]);

  const loading = useMemo(() => {
    if (selectedCourseId == null) return false;
    return loadingIds.has(selectedCourseId);
  }, [selectedCourseId, loadingIds]);

  const error = useMemo(() => {
    if (selectedCourseId == null) return null;
    return errorById[selectedCourseId] ?? null;
  }, [selectedCourseId, errorById]);

  const value = useMemo<CourseStatsContextValue>(() => ({
    stats,
    loading,
    error,
    get,
    isLoading: (id: number) => loadingIds.has(id),
    refresh,
    prefetch,
    invalidate,
    set,
  }), [stats, loading, error, get, loadingIds, refresh, prefetch, invalidate, set]);

  return <CourseStatsContext.Provider value={value}>{children}</CourseStatsContext.Provider>;
};

export function useCourseStats() {
  const ctx = useContext(CourseStatsContext);
  if (!ctx) throw new Error('useCourseStats must be used within a CourseStatsProvider');
  return ctx;
}
