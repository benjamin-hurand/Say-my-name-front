// src/components/layout/WithOrgLayout.tsx
import { Outlet } from "react-router-dom";
import { TenantDataProvider } from "../../contexts/TenantDataContext";
import { PersonsDirectoryProvider } from "../../contexts/PersonsDirectoryContext";
import { useRouteHistoryTracker } from "./hooks/usePreviousRoute";

export default function WithOrgLayout() {
  useRouteHistoryTracker();

  return (
    <TenantDataProvider>
      <PersonsDirectoryProvider>
        <Outlet />
      </PersonsDirectoryProvider>
    </TenantDataProvider>
  );
}
