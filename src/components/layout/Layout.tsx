import { ReactNode } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"
import "./styles/layout.css"

export const Layout = ({children}: {children: ReactNode}) => {
	return (
		<div className="layout">
			<Header />
			<div className="layout__content container">
				{children}
			</div>
			<Footer />
		</div>
	)
}