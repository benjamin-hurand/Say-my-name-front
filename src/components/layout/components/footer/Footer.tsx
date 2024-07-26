import "./styles/footer.css"

export const Footer = () => {
	return (
		<div className="footer">
			<div className="footer__container container">
				<div className="footer__contributors footer__item">
					<h2 className="footer__title">Contributeurs</h2>
					<ul className="footer__list">
						<div className="footer__list-col">
							<li className="footer__list-item">Benjamin Hurand</li>
							<li className="footer__list-item">Franck Alonso</li>
							<li className="footer__list-item">Sébastien Dos Santos</li>
						</div>
						<div className="footer__list-col">
							<li className="footer__list-item">Antoine Khow</li>
							<li className="footer__list-item">Oskar Cognet</li>
						</div>
					</ul>
				</div>
				<div className="footer__resources footer__item">
					<h2 className="footer__title">Ressources</h2>
					<ul className="footer__list-col">
						<li className="footer__list-item">Back: <a href="https://git.excilys.com/OskarCognet/equipe3-newrofactory-back" target="_blank" rel="noopener noreferrer">https://git.excilys.com/OskarCognet/equipe3-newrofactory-back</a></li>
						<li className="footer__list-item">Front: <a href="https://git.excilys.com/OskarCognet/equipe3-newrofactory-front" target="_blank" rel="noopener noreferrer">https://git.excilys.com/OskarCognet/equipe3-newrofactory-front</a></li>
						<li className="footer__list-item">MUI: <a href="https://mui.com/material-ui/react-table/" target="_blank" rel="noopener noreferrer">https://mui.com/material-ui/react-table/</a></li>
					</ul>
				</div>
			</div>
		</div>
	)
}