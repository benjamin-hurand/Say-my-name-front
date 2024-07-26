import { IconButton } from "@mui/material"
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import "./styles/headers.css"
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { logout } from "../../services/authService";

export const Header = () => {
	const navigate = useNavigate();

	const handleLogout = () => {
		logout(); 
		navigate('/signin');
	}

	const location = useLocation();
	
	return (
		<div className="header">
			<nav className="header__nav container">
				<ul className="header__list">
					<div className="header__list-start">
					<img src={import.meta.env.VITE_LOGO_PATH} alt="Company Logo" className="header__logo" onClick={() => navigate("/interns")}/>
						<a onClick={() => navigate("/interns")} className={"header__list-item " + (location.pathname == "/interns" ? " header__focus" : "")}>
							<li>Stagiaires</li>
						</a>
						<a onClick={() => navigate("/questions")} className={"header__list-item " + (location.pathname == "/questions" ? " header__focus" : "")}>
							<li>Questions</li>
						</a>
						<a onClick={() => navigate("/chapters")} className={"header__list-item" + (location.pathname == "/chapters" ? " header__focus" : "")}>
							<li>Chapitres</li>
						</a>
						<a onClick={() => navigate("/quizs")} className={"header__list-item" + (location.pathname == "/quizs" ? " header__focus" : "")}>
							<li>Quiz</li>
						</a>
					</div>
					<div className="header__list-end">
						<a className="header__list-item">
							<IconButton onClick={handleLogout} color="inherit" aria-label="logout">
								<ExitToAppIcon /> {/* Icône de déconnexion */}
							</IconButton>
						</a>
					</div>
				</ul>
			</nav>
		</div>
	)
}