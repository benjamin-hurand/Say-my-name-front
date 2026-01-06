import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { fetchAdminKpis } from "../services/business/admin/admin.service";
import { OrgDataProvider, useOrgData } from "./OrgDataContext";

// Types du contexte
interface AdminDataContextType {
  kpis: { persons: number; attributes: number } | null;
  refreshKpis: () => Promise<void>;

  // On expose aussi globalData (attributes, modes, etc.)
  globalData: ReturnType<typeof useOrgData>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const globalData = useOrgData();

  const [kpis, setKpis] = useState<AdminDataContextType["kpis"]>(null);

  // --- KPIs ---
  const refreshKpis = async () => {
    try {
      const data = await fetchAdminKpis();
      setKpis(data);
    } catch (err) {
      console.error("Erreur chargement KPIs admin", err);
      setKpis(null);
    }
  };

  useEffect(() => {
    refreshKpis();
  }, []);


  return (
    <AdminDataContext.Provider value={{ kpis, refreshKpis, globalData }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within an AdminDataProvider");
  return ctx;
};

// HOC pratique pour inclure GlobalDataProvider automatiquement
export const AdminDataLayout = ({ children }: { children: ReactNode }) => (
  <OrgDataProvider>
    <AdminDataProvider>{children}</AdminDataProvider>
  </OrgDataProvider>
);
