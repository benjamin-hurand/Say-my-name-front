import "./styles/searchBar.css"
import SearchIcon from "@mui/icons-material/Search";

interface SearchBarProps {
	search: string;
	setSearch: (value: string) => void;
	handleFilter: () => void;
  }

export const SearchBar = ({ search, setSearch, handleFilter }: SearchBarProps) => {
	const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
		  handleFilter();
		}
	  };

	const handleBlur = () => {
        handleFilter();  // You can call the same function or a different one if needed
    };

	return (
		<div className="searchBar">
			<SearchIcon className="searchBar__icon" />
			<input 
				placeholder="Filtre..." 
				className="searchBar__input" 
				value={search} 
				onChange={(e) => setSearch(e.target.value)}
				onKeyDown={onKeyDown}
				onBlur={handleBlur} 
			/>
		</div>
	)
}