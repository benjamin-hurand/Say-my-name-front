// ChallengeMenu.tsx
import React, { useState } from 'react';
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
import { useThemeColorContext } from '../../../contexts/ThemeColorContext';
import FilterAndSortBar from './components/FilterAndSortBar';
import { useNavigate } from 'react-router-dom';
import { SortCriterion } from './components/SortModal';
import StatusBubble from './components/StatusBubble';
import { ChallengeFilters, defaultFilters } from './components/FilterAndSortBar.types';

interface Challenge {
  id: number;
  title: string;         
  mode: string;          
  participants: number;
  status: string;
  numQuestions: number;
  details: string;
  userCompleted: boolean;
  userScore: number | null;
  userTimeScore: string | null;
  createdAt: string;
}

const dummyChallenges: Challenge[] = [
  {
    id: 1,
    title: 'Promo 2025 – Prénom',
    mode: 'Prénom',
    participants: 7,
    status: 'En attente',
    numQuestions: 10,
    details: 'Ce challenge vous permet d’apprendre les prénoms de la promo 2025.',
    userCompleted: false,
    userScore: null,
    userTimeScore: null,
    createdAt: '2025-04-10',
  },
  {
    id: 2,
    title: 'Promo 2025 – Prénom & Nom',
    mode: 'Prénom & Nom',
    participants: 15,
    status: 'Validé',
    numQuestions: 12,
    details: 'Ce challenge vous permet d’apprendre les prénoms et noms de la promo 2025.',
    userCompleted: false,
    userScore: null,
    userTimeScore: null,
    createdAt: '2025-04-11',
  },
  {
    id: 3,
    title: 'Promo 2025 – Prénom',
    mode: 'Prénom',
    participants: 20,
    status: 'Validé',
    numQuestions: 8,
    details: 'Testez vos connaissances sur les prénoms de la promo 2025.',
    userCompleted: true,
    userScore: 75,
    userTimeScore: null,
    createdAt: '2025-04-09',
  },
  {
    id: 4,
    title: 'Promo 2025 – Prénom',
    mode: 'Prénom',
    participants: 9,
    status: 'En attente',
    numQuestions: 10,
    details: 'Challenge en attente de validation (nombre de participants insuffisant).',
    userCompleted: false,
    userScore: null,
    userTimeScore: null,
    createdAt: '2025-04-12',
  },
  {
    id: 5,
    title: 'Promo 2025 – Prénom & Nom',
    mode: 'Prénom & Nom',
    participants: 11,
    status: 'Validé',
    numQuestions: 15,
    details: 'Challenge complet pour apprendre prénoms et noms.',
    userCompleted: true,
    userScore: 100,
    userTimeScore: '2:37',
    createdAt: '2025-04-08',
  },
];

const getPerformanceValue = (challenge: Challenge): number => {
  if (challenge.status === 'En attente') return 0;
  return challenge.userScore ?? 0;
};

const compareChallenges = (a: Challenge, b: Challenge, criteria: SortCriterion[]): number => {
  for (const crit of criteria) {
    let comp = 0;
    switch (crit.id) {
      case 'popularity':
        comp = a.participants - b.participants;
        break;
      case 'length':
        comp = a.numQuestions - b.numQuestions;
        break;
      case 'performance':
        const getPerf = (c: Challenge) => (c.userCompleted ? (c.userScore === 100 ? 100 : c.userScore || 0) : 0);
        comp = getPerf(a) - getPerf(b);
        break;
      case 'createdAt':
        comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        break;
    }
    if (comp !== 0) {
      return crit.order === 'asc' ? comp : -comp;
    }
  }
  return 0;
};

const getStatusTooltip = (challenge: Challenge) => {
  if (challenge.status === 'En attente') {
    return "Challenge en attente de validation";
  }
  if (challenge.status === 'Validé' && !challenge.userCompleted) {
    return "Challenge validé, à faire";
  }
  if (
    challenge.status === 'Validé' &&
    challenge.userCompleted &&
    challenge.userScore !== null &&
    challenge.userScore < 100
  ) {
    return `Score : ${challenge.userScore}%`;
  }
  if (
    challenge.status === 'Validé' &&
    challenge.userCompleted &&
    challenge.userScore === 100
  ) {
    return `Challenge réussi en ${challenge.userTimeScore}`;
  }
  return "";
};

const ChallengeMenu: React.FC = () => {
  const { color } = useThemeColorContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>('');
  
  // Modal de détails
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // États de tri et filtres
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { id: 'popularity', label: 'Popularité', order: 'desc' },
    { id: 'length', label: 'Longueur', order: 'asc' },
    { id: 'performance', label: 'Performance', order: 'desc' },
    { id: 'createdAt', label: 'Date de création', order: 'desc' },
  ]);
  const [filters, setFilters] = useState<ChallengeFilters>(defaultFilters);

  const handleSortChange = (criteria: SortCriterion[]) => {
    setSortCriteria(criteria);
  };

  const handleFilterChange = (newFilters: ChallengeFilters) => {
    setFilters(newFilters);
  };

  const handleOpenModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedChallenge(null);
  };

  const handleParticipate = (challenge: Challenge) => {
    console.log('Participer au challenge', challenge);
    // Navigation vers le challenge
  };

  const handleCreateChallenge = () => {
    navigate('/challenges/new');
  };

  const handleMesChallenges = () => {
    console.log('Accès à Mes Challenges');
    // Navigation vers "Mes Challenges"
  };

  // Appliquer les filtres aux challenges puis trier
  const filteredChallenges = dummyChallenges.filter(challenge =>
    challenge.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAndSortedChallenges = filteredChallenges
    .filter(challenge => {
      // Filtre par mode
      if (filters.mode.length > 0 && !filters.mode.includes(challenge.mode)) return false;
      // Filtre par performance
      if (filters.performance.length > 0) {
        let perf = '';
        if (!challenge.userCompleted) {
          perf = 'Pas commencé';
        } else if (challenge.userScore === 100) {
          perf = 'Réussi';
        } else {
          perf = 'Achevé';
        }
        if (!filters.performance.includes(perf)) return false;
      }
      // Filtre par nombre de participants
      if (filters.participantsRange) {
        if (challenge.participants < filters.participantsRange.min || challenge.participants > filters.participantsRange.max)
          return false;
      }
      // Filtre par nombre de questions
      if (filters.questionsRange) {
        if (challenge.numQuestions < filters.questionsRange.min || challenge.numQuestions > filters.questionsRange.max)
          return false;
      }
      // Filtre par panel de questions
      if (filters.panel.length > 0) {
        const firstLetter = challenge.title.charAt(0).toUpperCase();
        let match = false;
        for (const range of filters.panel) {
          const [start, end] = range.split('-');
          if (firstLetter >= start && firstLetter <= end) {
            match = true;
            break;
          }
        }
        if (!match) return false;
      }
      // Filtre par date de création
      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        const challengeDate = new Date(challenge.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (challengeDate < startDate || challengeDate > endDate) return false;
      }
      return true;
    })
    .sort((a, b) => compareChallenges(a, b, sortCriteria));

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 600,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        padding: 2,
      }}
    >
      {/* Barre de recherche */}
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
        <FilterAndSortBar onSortChange={handleSortChange} onFilterChange={handleFilterChange} />
      </Box>

      {/* Bouton "Créer un challenge" */}
      <Box sx={{ mb: 2 }}>
        <Button
          className="menu"
          onClick={handleCreateChallenge}
          variant="outlined"
          fullWidth
          sx={{
            whiteSpace: 'nowrap',
            boxShadow: `0 0 4px ${color}`,
            textShadow: `0 0 4px ${color}`,
          }}
        >
          + Créer un challenge
        </Button>
      </Box>

      {/* Liste des challenges */}
      <Box
        className="scrollable-content"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        {filteredAndSortedChallenges.map((challenge) => (
          <Card key={challenge.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => handleOpenModal(challenge)}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{challenge.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label={`${challenge.numQuestions} questions`} variant="outlined" size="medium" sx={{ pl: 1, pr: 1 }} />
                  <Chip
                    icon={<PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    label={challenge.participants}
                    variant="outlined"
                    size="medium"
                    sx={{ pl: 1, pr: 1 }}
                  />
                </Box>
              </Box>
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title={
                  challenge.status === 'En attente'
                    ? "Challenge en attente de validation"
                    : challenge.status === 'Validé' && !challenge.userCompleted
                      ? "Challenge validé, à faire"
                      : challenge.status === 'Validé' && challenge.userCompleted && challenge.userScore !== null && challenge.userScore < 100
                        ? `Score : ${challenge.userScore}%`
                        : challenge.status === 'Validé' && challenge.userCompleted && challenge.userScore === 100
                          ? `Challenge réussi en ${challenge.userTimeScore}`
                          : ""
                }>
                  <span>
                    <StatusBubble challenge={challenge} />
                  </span>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Modal des détails du challenge */}
      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{selectedChallenge?.title}</DialogTitle>
        <DialogContent dividers>
          {selectedChallenge && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Mode :</strong> {selectedChallenge.mode}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Participants :</strong> {selectedChallenge.participants}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Statut :</strong> {selectedChallenge.status}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Nombre de questions :</strong> {selectedChallenge.numQuestions}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" gutterBottom>
                {selectedChallenge.details}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Annuler</Button>
          <Button onClick={() => { if (selectedChallenge) handleParticipate(selectedChallenge); }} variant="contained">
            Participer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengeMenu;
