import "./styles/dropDown.css"

interface Option {
	code: string
	name: string
}

interface DropDownProps {
	name: string
	options: Option[]
}

export const DropDown = ({name, options}: DropDownProps) => {
	return (
		<div className="dropDown">
			<select name={name} className="dropDown__select">
				{options.map(
					(option) => 
						<option className="dropDown__option" value={option.code}>{option.name}</option>
				)}
			</select>
		</div>
	)
}