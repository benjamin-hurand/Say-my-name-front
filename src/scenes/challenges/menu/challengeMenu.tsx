import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Skeleton,
  Stack
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InfoIcon from '@mui/icons-material/Info';
import { useThemeColorContext } from '../../../contexts/ThemeColorContext';
import FilterAndSortBar from './components/FilterAndSortBar';
import { useNavigate } from 'react-router-dom';
import StatusBubble from './components/StatusBubble';
import { createChallengeAttempt, getChallengesList } from '../../../services/business/challenges/challenge.service';
import { ChallengeCardDto } from '../../../services/dto/ChallengeCardDto';
import { ChallengeMenuDto } from '../../../services/dto/ChallengeMenuDto';
import { ChallengeFilters, initialFilters } from './components/FilterAndSortBar.types';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { AddChallengeAttemptDto } from '../../../services/dto/ChallengeAttemptDto';
import { useAttempt } from '../../../contexts/ChallengeAttemptContext';

// Délai avant d’afficher le skeleton
const MIN_DELAY_BEFORE_SKELETON = 300; // ms
// Durée minimum pendant laquelle le skeleton reste visible
const MIN_DISPLAY_TIME_SKELETON = 300; // ms

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
  const { user } = useAuth();
  const { setCurrentAttempt } = useAttempt();
  const navigate = useNavigate();

  // Champ de recherche
  const [search, setSearch] = useState<string>('');

  // États pour filtres et tris
  const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);
  const [sorts, setSorts] = useState(initialSorts);

  // Liste des challenges récupérés
  const [challengeList, setChallengeList] = useState<ChallengeCardDto[]>([]);

  // État de la modale
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeCardDto | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // État technique de chargement
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * showSkeleton = true => on affiche les skeletons
   * showSkeleton = false => on affiche la liste ou le message "Aucun challenge"
   */
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);

  // Timers pour la logique de double-délai
  const timerShowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Valeurs fixes pour cet exemple
  const userId = user?.id || 0;
  const seasonStart = new Date().toISOString();

  // -----------
  // Fonctions de gestion des timers pour le squelette
  // -----------

  const startLoading = () => {
    setIsLoading(true);

    // Si un précédent timerHide existe, on l'annule (cas où on enchaîne direct un nouveau fetch)
    if (timerHideRef.current) {
      clearTimeout(timerHideRef.current);
      timerHideRef.current = null;
    }

    // Timer qui, au bout de MIN_DELAY_BEFORE_SKELETON ms, affichera le squelette si on est toujours en loading
    timerShowRef.current = setTimeout(() => {
      // On vérifie encore isLoading, au cas où le fetch a fini entre-temps
      if (isLoading) {
        setShowSkeleton(true);
      }
    }, MIN_DELAY_BEFORE_SKELETON);
  };

  const stopLoading = () => {
    setIsLoading(false);

    // Si on avait un timerShow non déclenché, on l'annule
    if (timerShowRef.current) {
      clearTimeout(timerShowRef.current);
      timerShowRef.current = null;
    }

    // Si le squelette est effectivement affiché, on le maintient un minimum de temps
    if (showSkeleton) {
      timerHideRef.current = setTimeout(() => {
        setShowSkeleton(false);
        timerHideRef.current = null;
      }, MIN_DISPLAY_TIME_SKELETON);
    }
  };

  // -----------
  // Appel API
  // -----------
  const fetchChallenges = async () => {
    startLoading();
    try {
      const challengeMenuDto: ChallengeMenuDto = {
        userId,
        seasonStart,
        search,
        filters,
        sorts,
      };

      const challenges = await getChallengesList(challengeMenuDto);
      setChallengeList(challenges);
    } catch (error) {
      console.error("Error fetching challenges list:", error);
    } finally {
      stopLoading();
    }
  };

  // Version debounce de fetchChallenges (500ms)
  const debouncedFetchChallenges = useCallback(debounce(fetchChallenges, 500), [search, filters, sorts]);

  useEffect(() => {
    debouncedFetchChallenges();
  }, [search, filters, sorts, debouncedFetchChallenges]);

  // Handlers de modal
  const handleOpenModal = (challenge: ChallengeCardDto) => {
    setSelectedChallenge(challenge);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedChallenge(null);
  };

  const handleParticipate = async (challenge: ChallengeCardDto) => {
    try {
      console.log(
        "Tentative de participation au challenge :",
        JSON.stringify(challenge)
      );

      const payload: AddChallengeAttemptDto = {
        userId: user!.id,
        challengeVersionId: challenge.version.id,
      };

      const attempt = await createChallengeAttempt(payload);
      setCurrentAttempt(attempt);

      // on redirige vers le quiz avec l’ID de la tentative créée
      navigate(`/challenges/${attempt.id}`);
    } catch (e) {
      console.error("Erreur lors de la création de la tentative :", e);
    }
  };
  

  const handleCreateChallenge = () => {
    navigate('/challenges/new');
  };

  // Tooltip pour la performance
  const getStatusTooltip = (challenge: ChallengeCardDto): string => {
    if (challenge.attempt.bestQuestionScore === null) {
      return "Vous n'avez jamais tenté ce challenge";
    }
    if (challenge.attempt.bestQuestionScore < challenge.version.questionCount) {
      return `Meilleur score : ${challenge.attempt.bestQuestionScore} / ${challenge.version.questionCount}`;
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
          className="menu"
          variant="outlined"
          fullWidth
          onClick={handleCreateChallenge}
          sx={{ whiteSpace: 'nowrap', boxShadow: `0 0 4px ${color}`, textShadow: `0 0 4px ${color}` }}
        >
          + Créer un challenge
        </Button>
      </Box>

      {/* Liste des challenges (ou skeleton, ou message "Aucun challenge trouvé") */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }} className="scrollable-content">
        {showSkeleton ? (
          // -------------------------------------------------
          // 1) SKELETONS en cas de chargement "réel" (>300ms)
          // -------------------------------------------------
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="50%" />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Skeleton variant="rectangular" width={100} height={24} />
                  <Skeleton variant="rectangular" width={60} height={24} />
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="70%" />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Skeleton variant="rectangular" width={100} height={24} />
                  <Skeleton variant="rectangular" width={60} height={24} />
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Skeleton variant="rectangular" width={100} height={24} />
                  <Skeleton variant="rectangular" width={60} height={24} />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        ) : challengeList.length === 0 ? (
          // ----------------------------------------
          // 2) AUCUN CHALLENGE TROUVÉ
          // ----------------------------------------
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              textAlign: 'center',
              padding: 2
            }}
          >
            <Box sx={{ fontSize: 48, opacity: 0.5 }}>😔</Box>
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              Aucun challenge trouvé
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: 1, opacity: 0.7 }}>
              Essayez de modifier vos filtres ou créez un nouveau challenge !
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateChallenge}
              sx={{ textTransform: 'none' }}
            >
              Créer un challenge
            </Button>
          </Box>
        ) : (
          // ----------------------------------------
          // 3) LISTE DES CHALLENGES
          // ----------------------------------------
          challengeList.map((challengeCard) => (
            <Card
              key={challengeCard.challenge.id}
              sx={{ mb: 1, cursor: 'pointer' }}
              onClick={() => handleOpenModal(challengeCard)}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{getCardTitle(challengeCard)}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`${challengeCard.version.questionCount} questions`}
                      variant="outlined"
                      size="medium"
                    />
                    <Chip
                      icon={<PeopleIcon fontSize="small" />}
                      label={challengeCard.attempt.nbParticipants}
                      variant="outlined"
                      size="medium"
                    />
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
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
              {/* Colonne de gauche */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Informations générales
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Mode :</strong> {selectedChallenge.challenge.gameMode.title}{" "}
                  <Tooltip title={selectedChallenge.challenge.gameMode.description}>
                    <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
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
                    <span>{formatDate(selectedChallenge.challenge.creationDate)}</span>
                  </Tooltip>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Créateur :</strong> {selectedChallenge.challenge.creator.username}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" gutterBottom>
                  <strong>Description :</strong> {selectedChallenge.challenge.description}
                </Typography>
              </Box>
              {/* Colonne de droite */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Version & Performance
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Version :</strong> {selectedChallenge.version.versionNumber}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Début :</strong>{" "}
                  <Tooltip title={formatDate(selectedChallenge.version.startDate, true)}>
                    <span>{formatDate(selectedChallenge.version.startDate)}</span>
                  </Tooltip>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Fin :</strong>{" "}
                  {selectedChallenge.version.endDate ? (
                    <Tooltip title={formatDate(selectedChallenge.version.endDate, true)}>
                      <span>{formatDate(selectedChallenge.version.endDate)}</span>
                    </Tooltip>
                  ) : (
                    "N/A"
                  )}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Nb Questions :</strong> {selectedChallenge.version.questionCount}
                </Typography>
                <Divider sx={{ my: 1 }} />
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
                  <strong>Début tentative :</strong>{" "}
                  <Tooltip title={formatDate(selectedChallenge.attempt.attemptStartDate, true)}>
                    <span>{formatDate(selectedChallenge.attempt.attemptStartDate)}</span>
                  </Tooltip>
                </Typography>
              </Box>
            </Box>
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
