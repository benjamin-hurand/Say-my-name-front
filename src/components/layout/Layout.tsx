import { ReactNode } from "react"
import { Footer } from "./components/footer/Footer"
import "./layout.css";

export const Layout = ({ children, isMenu = false }: { children: ReactNode, isMenu?: boolean }) => {
	return (
		<div className="layout">
			<div className="layout__content container">
				{children}
			</div>
			<Footer isMenu={isMenu}/>
		</div>

	)
}