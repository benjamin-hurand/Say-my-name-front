// GlobalDataLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalDataProvider } from '../../contexts/GlobalDataContext';

const GlobalDataLayout: React.FC = () => {
  return (
    <GlobalDataProvider>
      <Outlet />
    </GlobalDataProvider>
  );
};

export default GlobalDataLayout;
