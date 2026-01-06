// GlobalDataLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { OrgDataProvider } from '../../contexts/OrgDataContext';
import { PersonsDirectoryProvider } from '../../contexts/PersonsDirectoryContext';
import { useRouteHistoryTracker } from './hooks/usePreviousRoute';

const GlobalDataLayout: React.FC = () => {
  useRouteHistoryTracker();
  return (
    <OrgDataProvider>
      <PersonsDirectoryProvider>
        <Outlet />
      </PersonsDirectoryProvider>
    </OrgDataProvider>
  );
};

export default GlobalDataLayout;
