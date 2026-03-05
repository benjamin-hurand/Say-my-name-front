// GlobalDataLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TenantDataProvider } from '../../contexts/TenantDataContext';
import { PersonsDirectoryProvider } from '../../contexts/PersonsDirectoryContext';
import { useRouteHistoryTracker } from './hooks/usePreviousRoute';

const GlobalDataLayout: React.FC = () => {
  useRouteHistoryTracker();
  return (
    <TenantDataProvider>
      <PersonsDirectoryProvider>
        <Outlet />
      </PersonsDirectoryProvider>
    </TenantDataProvider>
  );
};

export default GlobalDataLayout;
