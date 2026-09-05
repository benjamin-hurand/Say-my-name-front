// src/scenes/admin/AdminLayout.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/header/Header";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import "./admin-layout.css";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/change-requests", label: "Change Requests" },
  { to: "/admin/persons", label: "Persons" },
  { to: "/admin/attributes", label: "Attributes" },
  { to: "/admin/members", label: "Members & invitations" },
];

const MIN_SIDEBAR = 180;
const MAX_SIDEBAR = 420;
const DEFAULT_SIDEBAR = 260;

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const { color } = useThemeColorContext();
  const navigate = useNavigate();
  const location = useLocation();

  const attributesNavLabel = t("ATTRIBUTE_PAGE.TITLE", { defaultValue: "Champs" });

  // 👉 Routes qui doivent être en plein largeur (fluid)
  const isFluid = useMemo(() => {
    return (
      location.pathname.startsWith("/admin/persons") ||
      location.pathname.startsWith("/admin/change-requests") ||
      location.pathname.startsWith("/admin/members")
    );
  }, [location.pathname]);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem("admin.sidebarWidth");
    return saved ? Number(saved) : DEFAULT_SIDEBAR;
  });
  const [resizing, setResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWRef = useRef<number>(sidebarWidth);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing) return;
      const dx = e.clientX - startXRef.current;
      const next = Math.min(
        MAX_SIDEBAR,
        Math.max(MIN_SIDEBAR, startWRef.current + dx)
      );
      setSidebarWidth(next);
    };
    const onUp = () => {
      if (!resizing) return;
      setResizing(false);
      localStorage.setItem("admin.sidebarWidth", String(sidebarWidth));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing, sidebarWidth]);

  const title = useMemo(() => {
    if (location.pathname.startsWith("/admin/persons"))
      return "Admin · Persons";
    if (location.pathname.startsWith("/admin/attributes"))
      return `Admin · ${attributesNavLabel}`;
    if (location.pathname.startsWith("/admin/change-requests"))
      return "Admin · Change Requests";
    if (location.pathname.startsWith("/admin/members"))
      return "Admin · Members & invitations";
    return "Admin · Dashboard";
  }, [location.pathname, attributesNavLabel]);

  return (
    <div className="admin-layout">
      <Header color={color} title={title} variant="glass" onBack="/" />

      <div className="admin-shell">
        <aside
          className="admin-sidebar admin-glass"
          style={{ width: sidebarWidth }}
          aria-label="Navigation d’administration"
        >
          <div className="admin-sidebar__section">
            <div className="admin-sidebar__title">Navigation</div>
            <nav className="admin-nav">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end as boolean | undefined}
                  className={({ isActive }) =>
                    "admin-nav__link" +
                    (isActive ? " admin-nav__link--active" : "")
                  }
                >
                  {link.to === "/admin/attributes" ? attributesNavLabel : link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="admin-sidebar__section admin-sidebar__section--actions">
            <button
              className="admin-button admin-button--primary"
              onClick={() => navigate("/")}
              title="Retour à l’application"
            >
              Retour app
            </button>
          </div>

          <div
            className={
              "admin-resizer" +
              (resizing ? " admin-resizer--active" : "")
            }
            onMouseDown={(e) => {
              setResizing(true);
              startXRef.current = e.clientX;
              startWRef.current = sidebarWidth;
            }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionner la barre latérale"
          />
        </aside>

        <main className="admin-content">
          <div
            className={`admin-content__inner admin-glass-weak ${
              isFluid ? "admin-content__inner--fluid" : ""
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
