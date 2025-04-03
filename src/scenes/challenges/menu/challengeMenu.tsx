import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InfoIcon from '@mui/icons-material/Info';
import { useThemeColorContext } from '../../../contexts/ThemeColorContext';
import FilterAndSortBar from './components/FilterAndSortBar';
import { useNavigate } from 'react-router-dom';
import StatusBubble from './components/StatusBubble';
import { getChallengesList } from '../../../services/business/challenges/challenge.service';
import { ChallengeCardDto } from '../../../services/dto/ChallengeCardDto';
import { ChallengeMenuDto } from '../../../services/dto/ChallengeMenuDto';
import { ChallengeFilters, initialFilters } from './components/FilterAndSortBar.types';
import { format, parseISO } from 'date-fns';

// Fonction debounce personnalisée
function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Génère le titre de la carte en combinant le titre du mode et les infos du filtre
const getCardTitle = (challengeCard: ChallengeCardDto): string => {
  const modeTitle = challengeCard.challenge.gameMode.title;
  const filter = challengeCard.challenge.filter;
  if (filter && filter.attributeName && filter.minValue && filter.maxValue) {
    return filter.minValue === filter.maxValue
      ? `${modeTitle} - ${filter.attributeName} ${filter.minValue}`
      : `${modeTitle} - ${filter.attributeName} ${filter.minValue} à ${filter.maxValue}`;
  }
  return modeTitle;
};

// Formatage des dates (affichage standard et complet en tooltip)
const formatDate = (isoString: string, withMs: boolean = false): string => {
  try {
    const date = parseISO(isoString);
    return format(date, withMs ? "dd MMM yyyy, HH:mm:ss.SSS" : "dd MMM yyyy, HH:mm:ss");
  } catch (e) {
    return isoString;
  }
};

// Formatage des durées (en ms) en mm:ss.SSS
const formatTime = (ms: number): string => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const initialSorts: any[] = [];

const ChallengeMenu: React.FC = () => {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();

  // Champ de recherche
  const [search, setSearch] = useState<string>('');

  // États pour filtres et tris
  const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);
  const [sorts, setSorts] = useState(initialSorts);

  // Liste des challenges récupérés
  const [challengeList, setChallengeList] = useState<ChallengeCardDto[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeCardDto | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Valeurs fixes pour cet exemple
  const userId = 1;
  const seasonStart = new Date().toISOString();

  // Fonction qui construit le DTO d'entrée et appelle le service
  const fetchChallenges = async () => {
    const challengeMenuDto: ChallengeMenuDto = {
      userId,
      seasonStart,
      search,
      filters,
      sorts,
    };

    try {
      const challenges = await getChallengesList(challengeMenuDto);
      setChallengeList(challenges);
    } catch (error) {
      console.error("Error fetching challenges list:", error);
    }
  };

  // Version debounce de fetchChallenges (500ms)
  const debouncedFetchChallenges = useCallback(debounce(fetchChallenges, 500), [search, filters, sorts]);

  useEffect(() => {
    debouncedFetchChallenges();
  }, [search, filters, sorts, debouncedFetchChallenges]);

  // Handlers pour la modal
  const handleOpenModal = (challenge: ChallengeCardDto) => {
    setSelectedChallenge(challenge);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedChallenge(null);
  };

  const handleParticipate = (challenge: ChallengeCardDto) => {
    console.log('Participer au challenge', challenge);
    // Implémentez ici la navigation ou la logique de participation
  };

  const handleCreateChallenge = () => {
    navigate('/challenges/new');
  };

  // Exemple utilitaire pour afficher un tooltip sur la performance
  const getStatusTooltip = (challenge: ChallengeCardDto): string => {
    if (challenge.attempt.bestQuestionScore === null) {
      return "Vous n'avez jamais tenté ce challenge";
    }
    if (challenge.attempt.bestQuestionScore < challenge.version.questionCount) {
      return `Meilleur score : ${challenge.attempt.bestQuestionScore}/${challenge.version.questionCount}`;
    }
    return "Challenge réussi !";
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', height: '100%', padding: 2 }}>
      {/* Champ de recherche */}
      <TextField
        label="Recherche de challenge..."
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      {/* Barre de filtres et tris */}
      <Box sx={{ mb: 2 }}>
        <FilterAndSortBar
          onFilterChange={(newFilters) => setFilters(newFilters)}
          onSortChange={(newSorts) => setSorts(newSorts)}
        />
      </Box>

      {/* Bouton "Créer un challenge" */}
      <Box sx={{ mb: 2 }}>
        <Button
          className='menu'
          variant="outlined"
          fullWidth
          onClick={handleCreateChallenge}
          sx={{ whiteSpace: 'nowrap', boxShadow: `0 0 4px ${color}`, textShadow: `0 0 4px ${color}` }}
        >
          + Créer un challenge
        </Button>
      </Box>

      {/* Liste des challenges */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {challengeList.length === 0 ? (
          <Typography variant="body1">Aucun challenge trouvé.</Typography>
        ) : (
          challengeList.map((challengeCard) => (
            <Card key={challengeCard.challenge.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => handleOpenModal(challengeCard)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{getCardTitle(challengeCard)}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={`${challengeCard.version.questionCount} questions`} variant="outlined" size="medium" />
                    <Chip icon={<PeopleIcon fontSize="small" />} label={challengeCard.attempt.nbParticipants} variant="outlined" size="medium" />
                  </Box>
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Tooltip title={getStatusTooltip(challengeCard)}>
                    <span>
                      <StatusBubble challenge={challengeCard} />
                    </span>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Modal des détails du challenge */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{
          style: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(47, 47, 47, 0.9)',
            color: 'white',
            p: 2,
          },
        }}
      >
        <DialogTitle>{selectedChallenge ? getCardTitle(selectedChallenge) : ""}</DialogTitle>
        <DialogContent dividers>
          {selectedChallenge && (
            <>
              {/* Section 1: Informations générales */}
              <Typography variant="body2" gutterBottom>
                <strong>Mode :</strong> {selectedChallenge.challenge.gameMode.title}{" "}
                <Tooltip title={selectedChallenge.challenge.gameMode.description}>
                  <InfoIcon fontSize="small" />
                </Tooltip>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Filtre :</strong> {selectedChallenge.challenge.filter.attributeName}{" "}
                {selectedChallenge.challenge.filter.minValue && selectedChallenge.challenge.filter.maxValue && (
                  selectedChallenge.challenge.filter.minValue === selectedChallenge.challenge.filter.maxValue
                    ? `(${selectedChallenge.challenge.filter.minValue})`
                    : `(${selectedChallenge.challenge.filter.minValue} à ${selectedChallenge.challenge.filter.maxValue})`
                )}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Créé le :</strong>{" "}
                <Tooltip title={formatDate(selectedChallenge.challenge.creationDate, true)}>
                  <span>
                    {formatDate(selectedChallenge.challenge.creationDate)}
                  </span>
                </Tooltip>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Créateur :</strong> {selectedChallenge.challenge.creator.username}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" gutterBottom>
                <strong>Description :</strong> {selectedChallenge.challenge.description}
              </Typography>

              {/* Section 2: Informations sur la version */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Version</Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Numéro :</strong> {selectedChallenge.version.versionNumber}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Début :</strong>{" "}
                  <Tooltip title={formatDate(selectedChallenge.version.startDate, true)}>
                    <span>
                      {formatDate(selectedChallenge.version.startDate)}
                    </span>
                  </Tooltip>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Fin :</strong>{" "}
                  {selectedChallenge.version.endDate ? (
                    <Tooltip title={formatDate(selectedChallenge.version.endDate, true)}>
                      <span>
                        {formatDate(selectedChallenge.version.endDate)}
                      </span>
                    </Tooltip>
                  ) : (
                    "N/A"
                  )}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Nombre de questions :</strong> {selectedChallenge.version.questionCount}
                </Typography>
              </Box>

              {/* Section 3: Performance utilisateur */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Performance</Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Nb Participants :</strong> {selectedChallenge.attempt.nbParticipants}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Meilleur score :</strong>{" "}
                  {selectedChallenge.attempt.bestQuestionScore !== null
                    ? `${selectedChallenge.attempt.bestQuestionScore} / ${selectedChallenge.version.questionCount}`
                    : "Non tenté"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Meilleur temps :</strong>{" "}
                  {selectedChallenge.attempt.bestTimeMs !== null
                    ? formatTime(selectedChallenge.attempt.bestTimeMs)
                    : "Non disponible"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date de début de tentative :</strong>{" "}
                  <Tooltip title={formatDate(selectedChallenge.attempt.attemptStartDate, true)}>
                    <span>
                      {formatDate(selectedChallenge.attempt.attemptStartDate)}
                    </span>
                  </Tooltip>
                </Typography>
              </Box>

              {/* Section 4: Sections supplémentaires */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Mes dernières tentatives</Typography>
                <Typography variant="body2" color="text.secondary">
                  (Données à charger via API)
                </Typography>
              </Box>

              {selectedChallenge.attempt.nbParticipants > 10 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Leaderboard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    (Leaderboard à charger via API)
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Annuler</Button>
          <Button onClick={() => selectedChallenge && handleParticipate(selectedChallenge)} variant="contained">
            Participer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengeMenu;
