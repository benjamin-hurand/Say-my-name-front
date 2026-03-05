import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { CourseDto, CreateCourseDto, PopulationScope } from '../services/dto/courses/CourseDto';
import {
  getCurrentCourse,
  getUserCourses,
  createOrResumeCourse,
  focusCourse,
} from '../services/business/courses/course.service';

type CoursesContextValue = {
  // sélection courante
  selectedCourse: CourseDto | null;
  selectedCourseId: number | null;
  setSelectedCourse: (course: CourseDto | null) => void;
  setSelectedCourseId: (id: number | null) => void;

  // cache multi-courses
  coursesById: Record<number, CourseDto>;
  upsertCourse: (course: CourseDto) => void;
  removeCourse: (courseId: number) => void;
  getCourseFromCache: (courseId: number) => CourseDto | undefined;
  listCourses: () => CourseDto[];
  findCourseByTargetAttributeId: (targetAttributeId: number) => CourseDto | undefined;

  // chargements / API
  loading: boolean;
  refreshCurrentCourse: () => Promise<CourseDto | null>;
  refreshUserCourses: () => Promise<CourseDto[]>;
  createOrResume: (targetAttributeId: number, scope?: PopulationScope) => Promise<CourseDto>;
  focus: (courseId: number) => Promise<void>;

  // utilitaires
  resetAll: () => void;
};

const LOCAL_SELECTED_ID = 'smn:selectedCourseId';

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coursesById, setCoursesById] = useState<Record<number, CourseDto>>({});
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Hydrate la sélection depuis localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_SELECTED_ID);
    if (raw) {
      const id = Number(raw);
      if (!Number.isNaN(id)) setSelectedCourseId(id);
    }
  }, []);

  // Persiste la sélection
  useEffect(() => {
    if (selectedCourseId == null) {
      localStorage.removeItem(LOCAL_SELECTED_ID);
    } else {
      localStorage.setItem(LOCAL_SELECTED_ID, String(selectedCourseId));
    }
  }, [selectedCourseId]);

  const selectedCourse = useMemo(
    () => (selectedCourseId != null ? coursesById[selectedCourseId] ?? null : null),
    [selectedCourseId, coursesById]
  );

  const upsertCourse = useCallback((course: CourseDto) => {
    setCoursesById(prev => {
      if (prev[course.id] && prev[course.id] === course) return prev;
      return { ...prev, [course.id]: course };
    });
  }, []);

  const removeCourse = useCallback((courseId: number) => {
    setCoursesById(prev => {
      const { [courseId]: _, ...rest } = prev;
      return rest;
    });
    setSelectedCourseId(prev => (prev === courseId ? null : prev));
  }, []);

  const setSelectedCourseCompat = useCallback((course: CourseDto | null) => {
    if (!course) {
      setSelectedCourseId(null);
      return;
    }
    upsertCourse(course);
    setSelectedCourseId(course.id);
  }, [upsertCourse]);

  const getCourseFromCache = useCallback(
    (courseId: number) => coursesById[courseId],
    [coursesById]
  );

  const listCourses = useCallback(() => Object.values(coursesById), [coursesById]);

  const findCourseByTargetAttributeId = useCallback(
    (targetAttributeId: number) => Object.values(coursesById).find(c => c.targetAttributeId === targetAttributeId),
    [coursesById]
  );

  const refreshCurrentCourse = useCallback(async () => {
    setLoading(true);
    try {
      const course = await getCurrentCourse();
      if (course) {
        upsertCourse(course);
        // si rien sélectionné on sélectionne celui-ci
        setSelectedCourseId(prev => prev ?? course.id);
        return course;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [upsertCourse]);

  const refreshUserCourses = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getUserCourses();
      // upsert tous + sélectionne le premier si rien sélectionné
      setCoursesById(prev => {
        const next = { ...prev };
        for (const c of list) next[c.id] = c;
        return next;
      });
      if (list.length > 0) {
        setSelectedCourseId(prev => prev ?? list[0].id);
      } else {
        setSelectedCourseId(null);
      }
      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrResume = useCallback(async (targetAttributeId: number, scope: PopulationScope = 'FOLLOWED') => {
    setLoading(true);
    try {
      const payload: CreateCourseDto = { targetAttributeId, populationScope: scope };
      const course = await createOrResumeCourse(payload);
      upsertCourse(course);
      setSelectedCourseId(course.id);
      // marque le focus côté back (utile pour /current)
      await focusCourse(course.id);
      return course;
    } finally {
      setLoading(false);
    }
  }, [upsertCourse]);

  const focus = useCallback(async (courseId: number) => {
    await focusCourse(courseId);
    setSelectedCourseId(courseId);
  }, []);

  const resetAll = useCallback(() => {
    setCoursesById({});
    setSelectedCourseId(null);
    localStorage.removeItem(LOCAL_SELECTED_ID);
  }, []);

  const value = useMemo<CoursesContextValue>(() => ({
    selectedCourse,
    selectedCourseId,
    setSelectedCourse: setSelectedCourseCompat,
    setSelectedCourseId,
    coursesById,
    upsertCourse,
    removeCourse,
    getCourseFromCache,
    listCourses,
    findCourseByTargetAttributeId: findCourseByTargetAttributeId,
    loading,
    refreshCurrentCourse,
    refreshUserCourses,
    createOrResume,
    focus,
    resetAll,
  }), [
    selectedCourse,
    selectedCourseId,
    setSelectedCourseCompat,
    setSelectedCourseId,
    coursesById,
    upsertCourse,
    removeCourse,
    getCourseFromCache,
    listCourses,
    findCourseByTargetAttributeId,
    loading,
    refreshCurrentCourse,
    refreshUserCourses,
    createOrResume,
    focus,
    resetAll,
  ]);

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
};

export function useCourse() {
  const ctx = useContext(CoursesContext);
  if (!ctx) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return ctx;
}
