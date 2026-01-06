// src/components/layout/WithOrgLayout.tsx
import { Outlet } from "react-router-dom";
import { OrgDataProvider } from "../../contexts/OrgDataContext";
import { PersonsDirectoryProvider } from "../../contexts/PersonsDirectoryContext";
import { useRouteHistoryTracker } from "./hooks/usePreviousRoute";

export default function WithOrgLayout() {
  useRouteHistoryTracker();

  return (
    <OrgDataProvider>
      <PersonsDirectoryProvider>
        <Outlet />
      </PersonsDirectoryProvider>
    </OrgDataProvider>
  );
}
