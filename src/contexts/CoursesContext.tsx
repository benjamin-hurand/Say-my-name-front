// src/contexts/CoursesContext.tsx
import React, { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import { CourseDto } from '../services/dto/courses/CourseDto';
import { getCurrentCourse } from '../services/business/courses/course.service';

type CoursesContextValue = {
  // sélection courante (compat)
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

  // chargements
  loading: boolean;
  refreshCurrentCourse: (userId: number) => Promise<CourseDto | null>;

  // utilitaires
  resetAll: () => void;
};

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coursesById, setCoursesById] = useState<Record<number, CourseDto>>({});
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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

  const getCourseFromCache = useCallback((courseId: number) => coursesById[courseId], [coursesById]);

  const listCourses = useCallback(() => Object.values(coursesById), [coursesById]);

  const refreshCurrentCourse = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const course = await getCurrentCourse(userId);
      if (course) {
        upsertCourse(course);
        // si rien sélectionné on sélectionne celui-ci
        setSelectedCourseId(prev => prev ?? course.id);
        return course;
      } else {
        // pas de course actif
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, [upsertCourse]);

  const resetAll = useCallback(() => {
    setCoursesById({});
    setSelectedCourseId(null);
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
    loading,
    refreshCurrentCourse,
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
    loading,
    refreshCurrentCourse,
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
