// Layout.tsx
import React, { ReactNode } from "react";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import "./layout.css";
import { Outlet, useNavigate } from "react-router-dom";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";

interface LayoutProps {
  children?: ReactNode;
  isMenu?: boolean;
  headerTitle?: string;
  headerTooltip?: string;
  onBack?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, isMenu = false, headerTitle, headerTooltip, onBack }) => {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="layout">
      {headerTitle && (
        <Header color={color} title={headerTitle} tooltip={headerTooltip} onBack={onBack} />
      )}
      <div className="layout__content">
        {children}
        <Outlet />
      </div>
      <Footer isMenu={isMenu} handleHomeClick={handleHomeClick} />
    </div>
  );
};
