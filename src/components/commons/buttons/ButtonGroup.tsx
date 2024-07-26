import "./styles/buttonGroup.css"

interface ButtonGroupProps {
	button_list: number[];
	current: number;
	setCurrent: (str: number) => void;
	pageMax: number;
}

export const ButtonGroup = ({ button_list, current, setCurrent, pageMax }: ButtonGroupProps) => {
    return (
        <ul className="buttonGroup">
            {button_list.map(
                (str, index) => // Added index here
                    <button 
                        key={str} // Using 'str' as the key
                        className={"buttonGroup__item" + (current == str ? " buttonGroup__focus" : "")}
                        onClick={() => { 
							if(pageMax !== 0) {
								if (str === -1) {
									setCurrent(pageMax);
								} else if (str === 0) {
									setCurrent(1);
								} else {
									setCurrent(str);
								}
							} 
                        }}
                    >
                        {str === 0 ? <li>&laquo;</li> : (str === -1 ? <li>&raquo;</li> : <li>{str}</li>)}
                    </button>
            )}
        </ul>
    )
}
