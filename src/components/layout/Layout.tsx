import { ReactNode } from "react"
import { Footer } from "./components/footer/Footer"
import { ColorProvider } from "../../contexts/ColorContext"

export const Layout = ({children}: {children: ReactNode}) => {
	return (
		<div className="layout">
			<ColorProvider>
				<div className="layout__content container">
					{children}
				</div>
				<Footer />
			</ColorProvider>
		</div>

	)
}