import { ReactNode } from "react"
import "./styles/button.css"

interface ButtonProps {
	children?: ReactNode
	handleClick?: () => void
	style?: string
}

export const Button = ({children, handleClick, style="filled"}: ButtonProps) => {
	return (
		<button className={"button" + " button__" + style} onClick={handleClick}>
			{children}
		</button>
	)
}