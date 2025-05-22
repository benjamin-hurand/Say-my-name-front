// src/contexts/CourseContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CourseDto } from '../services/dto/courses/CourseDto';

interface CourseContextValue {
  selectedCourse: CourseDto | null;
  setSelectedCourse: (course: CourseDto | null) => void;
}

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCourse, setSelectedCourse] = useState<CourseDto | null>(null);
  return (
    <CourseContext.Provider value={{ selectedCourse, setSelectedCourse }}>
      {children}
    </CourseContext.Provider>
  );
};

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return ctx;
}
