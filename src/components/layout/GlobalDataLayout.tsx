// GlobalDataLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalDataProvider } from '../../contexts/GlobalDataContext';
import { PersonsDirectoryProvider } from '../../contexts/PersonsDirectoryContext';
import { useRouteHistoryTracker } from './hooks/usePreviousRoute';

const GlobalDataLayout: React.FC = () => {
  useRouteHistoryTracker();
  return (
    <GlobalDataProvider>
      <PersonsDirectoryProvider>
        <Outlet />
      </PersonsDirectoryProvider>
    </GlobalDataProvider>
  );
};

export default GlobalDataLayout;
