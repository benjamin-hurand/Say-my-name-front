import { ReactNode } from "react"
import { Footer } from "./components/footer/Footer"
import "./layout.css";

export const Layout = ({children}: {children: ReactNode}) => {
	return (
		<div className="layout">
			<div className="layout__content container">
				{children}
			</div>
			<Footer />
		</div>

	)
}