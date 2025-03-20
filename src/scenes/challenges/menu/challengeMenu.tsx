// ChallengeMenu.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Challenge {
  id: number;
  title: string;
  mode: string;
  participants: number;
  status: string; // "Validé" ou "En attente"
}

// Données factices pour illustration
const dummyChallenges: Challenge[] = [
  { id: 1, title: 'Challenge A', mode: 'Prénom', participants: 15, status: 'Validé' },
  { id: 2, title: 'Challenge B', mode: 'Prénom & Nom', participants: 5, status: 'En attente' },
  { id: 3, title: 'Challenge C', mode: 'Prénom', participants: 20, status: 'Validé' },
  { id: 4, title: 'Challenge D', mode: 'Prénom', participants: 12, status: 'Validé' },
  { id: 5, title: 'Challenge E', mode: 'Prénom & Nom', participants: 7, status: 'En attente' },
  { id: 6, title: 'Challenge F', mode: 'Prénom', participants: 25, status: 'Validé' },
  // Ajoutez autant de challenges pour tester le scroll...
];

const ChallengeMenu: React.FC = () => {
  const [search, setSearch] = useState<string>('');

  const handleBack = () => {
    // Rediriger vers le menu principal
    console.log('Retour au menu principal');
  };

  const handleCreateChallenge = () => {
    // Rediriger vers le formulaire de création de challenge
    console.log('Créer un challenge');
  };

  const handleParticipate = (challenge: Challenge) => {
    // Rediriger vers le challenge sélectionné
    console.log('Participer au challenge', challenge);
  };

  const handleMesChallenges = () => {
    // Rediriger vers la page "Mes Challenges"
    console.log('Accès à Mes Challenges');
  };

  return (
    <Box
      sx={{
        padding: '20px',
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Barre de recherche et filtres */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
        <TextField
          label="Recherche de challenge..."
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '90%', sm: '60%', md: '40%' } }}
        />
      </Box>

      {/* Bouton "Créer un Challenge" */}
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" onClick={handleCreateChallenge} sx={{ whiteSpace: 'nowrap' }}>
          Créer un Challenge
        </Button>
      </Box>

      {/* Zone scrollable pour la liste des challenges */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          flexGrow: 1,          // Prend l'espace restant
          overflowY: 'auto',    // Permet le scroll vertical
          mb: 2,
        }}
      >
        {dummyChallenges
          .filter((challenge) =>
            challenge.title.toLowerCase().includes(search.toLowerCase())
          )
          .map((challenge) => (
            <Card key={challenge.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{challenge.title}</Typography>
                <Typography variant="body2">Mode : {challenge.mode}</Typography>
                <Typography variant="body2">Participants : {challenge.participants}</Typography>
                <Typography variant="body2">Statut : {challenge.status}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleParticipate(challenge)}>
                  Cliquez ici pour participer
                </Button>
              </CardActions>
            </Card>
          ))}
      </Box>

      {/* Lien "Mes Challenges" fixé en bas */}
      <Box sx={{ mt: 2 }}>
        <Button variant="text" onClick={handleMesChallenges}>
          Mes Challenges
        </Button>
      </Box>
    </Box>
  );
};

export default ChallengeMenu;
