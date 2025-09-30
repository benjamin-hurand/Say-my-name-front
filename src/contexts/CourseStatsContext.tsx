import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { CourseStatsDto } from '../services/dto/courses/CourseStatsDto';
import { getCourseStats, getUserCourseStats } from '../services/business/courses/course.service';
import { useCourse } from './CoursesContext';

type StatsCacheEntry = {
  data: CourseStatsDto;
  progressPercent: number; // dérivé, 0..100
  fetchedAt: number;       // epoch ms
};

type CourseStatsContextValue = {
  // sélection courante (compat)
  stats: CourseStatsDto | null;
  progress: number | null; // progression (%) du cours sélectionné
  loading: boolean;
  error: any;

  // multi-courses
  get: (courseId: number) => CourseStatsDto | null;
  getProgress: (courseId: number) => number | null; // progression (%) pour un cours
  isLoading: (courseId: number) => boolean;
  refresh: (
    courseId: number,
    opts?: { force?: boolean; ttlMs?: number }
  ) => Promise<CourseStatsDto>;
  prefetch: (courseIds: number[], opts?: { ttlMs?: number }) => Promise<void>;
  refreshForUser: (userId: number, opts?: { ttlMs?: number }) => Promise<void>;
  invalidate: (courseId?: number) => void;
  set: (courseId: number, stats: CourseStatsDto) => void;

  // util exposé si besoin ailleurs
  computeProgressPercent: (s?: CourseStatsDto | null) => number;
};

const CourseStatsContext = createContext<CourseStatsContextValue | undefined>(undefined);

const DEFAULT_TTL = 60_000; // 60s

export const CourseStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedCourseId } = useCourse();

  const [cache, setCache] = useState<Record<number, StatsCacheEntry>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [errorById, setErrorById] = useState<Record<number, any>>({});

  const inFlight = useRef<Record<number, Promise<CourseStatsDto> | undefined>>({});

  // ---- Calcul centralisé de progression ----
  const computeProgressPercent = useCallback((s?: CourseStatsDto | null) => {
    if (!s) return 0;
    const u = s.unknown ?? 0;
    const d = s.discovered ?? 0;
    const l = s.learned ?? 0;
    const m = s.mastered ?? 0;
    const total = u + d + l + m;
    if (total <= 0) return 0;
    const earned = d * 1 + l * 2 + m * 4;
    const max = total * 4;
    return Math.max(0, Math.min(100, Math.round((earned / max) * 100)));
  }, []);

  const set = useCallback((courseId: number, data: CourseStatsDto) => {
    const progressPercent = computeProgressPercent(data);
    setCache(prev => ({ ...prev, [courseId]: { data, progressPercent, fetchedAt: Date.now() } }));
    setErrorById(prev => {
      const { [courseId]: _, ...rest } = prev;
      return rest;
    });
  }, [computeProgressPercent]);

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

    const existing = inFlight.current[courseId];
    if (existing) return existing;

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
        delete inFlight.current[courseId];
      });

    inFlight.current[courseId] = p;
    return p;
  }, [cache, set, markLoading, shouldRefetch]);

  const prefetch = useCallback(async (courseIds: number[], opts?: { ttlMs?: number }) => {
    await Promise.all(courseIds.map(id => refresh(id, { ttlMs: opts?.ttlMs })));
  }, [refresh]);

  const refreshForUser = useCallback(async (userId: number, opts?: { ttlMs?: number }) => {
    const ttlMs = opts?.ttlMs ?? DEFAULT_TTL;
    const list = await getUserCourseStats(userId);
    for (const s of list) {
      const entry = cache[s.courseId];
      const expired = !entry || (Date.now() - entry.fetchedAt > ttlMs);
      if (expired) set(s.courseId, s);
    }
  }, [cache, set]);

  const get = useCallback((courseId: number) => cache[courseId]?.data ?? null, [cache]);
  const getProgress = useCallback((courseId: number) =>
    (cache[courseId]?.progressPercent ?? null), [cache]);

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

  const progress = useMemo(() => {
    if (selectedCourseId == null) return null;
    const p = cache[selectedCourseId]?.progressPercent;
    return typeof p === 'number' ? p : null;
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
    progress,
    loading,
    error,
    get,
    getProgress,
    isLoading: (id: number) => loadingIds.has(id),
    refresh,
    prefetch,
    refreshForUser,
    invalidate,
    set,
    computeProgressPercent,
  }), [
    stats,
    progress,
    loading,
    error,
    get,
    getProgress,
    loadingIds,
    refresh,
    prefetch,
    refreshForUser,
    invalidate,
    set,
    computeProgressPercent,
  ]);

  return <CourseStatsContext.Provider value={value}>{children}</CourseStatsContext.Provider>;
};

export function useCourseStats() {
  const ctx = useContext(CourseStatsContext);
  if (!ctx) throw new Error('useCourseStats must be used within a CourseStatsProvider');
  return ctx;
}
