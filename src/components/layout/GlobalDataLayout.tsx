// GlobalDataLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalDataProvider } from '../../contexts/GlobalDataContext';
import { PersonsDirectoryProvider } from '../../contexts/PersonsDirectoryContext';

const GlobalDataLayout: React.FC = () => {
  return (
    <GlobalDataProvider>
      <PersonsDirectoryProvider>
        <Outlet />
      </PersonsDirectoryProvider>
    </GlobalDataProvider>
  );
};

export default GlobalDataLayout;
