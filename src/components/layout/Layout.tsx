import { ReactNode } from "react";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import "./layout.css";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import { NavigateFunction, Outlet, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  isMenu?: boolean;
  headerTitle?: string;
  onBack?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  isMenu = false,
  headerTitle,
  onBack
}) => {
  const { color } = useThemeColorContext();
  const navigate: NavigateFunction = useNavigate();

  const handleHomeClick = () => {
		navigate('/', { replace: true });
	};

  return (
    <div className="layout">
      {/* Si un headerTitle est fourni, on affiche le Header */}
      {headerTitle && (
        <Header color={color} title={headerTitle} onBack={onBack}/>
      )}
      <div className="layout__content container">
        {children}
        {/* Outlet pour les routes imbriquées */}
        <Outlet />
      </div>
      <Footer isMenu={isMenu} handleHomeClick={handleHomeClick}/>
    </div>
  );
};
