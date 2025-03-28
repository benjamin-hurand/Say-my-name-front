// FiltersPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormGroup,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useChallenges } from '../../../contexts/ChallengesContext';
import CustomRangeModal from './components/CustomRangeModal';
import CustomDateRangeModal from './components/CustomDateRangeModal';
import { ChallengeFilters, defaultFilters } from './components/FilterAndSortBar.types';

const modeOptions = ['Prénom', 'Nom', 'Prénom & Nom'];
const performanceOptions = ['Réussi', 'Podium', 'Achevé', 'Nouveau', 'Pas commencé'];
const participantsPredefined = [
  { label: '0-10', range: { min: 0, max: 10 } },
  { label: '10-100', range: { min: 10, max: 100 } },
  { label: '100+', range: { min: 100, max: 1000 } },
];
const questionsPredefined = [
  { label: '0-10', range: { min: 0, max: 10 } },
  { label: '10-20', range: { min: 10, max: 20 } },
  { label: '20+', range: { min: 20, max: 100 } },
];
const panelOptions = ['A-D', 'E-H', 'I-L', 'M-P', 'Q-Z'];

const predefinedDateRanges = ['Aujourd\'hui', 'Cette semaine', 'Ce mois-ci'];

const getPredefinedDateRange = (label: string): { start: string; end: string } => {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  if (label === "Aujourd'hui") {
    return { start: formatDate(today), end: formatDate(today) };
  } else if (label === "Cette semaine") {
    const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: formatDate(monday), end: formatDate(sunday) };
  } else if (label === "Ce mois-ci") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: formatDate(start), end: formatDate(end) };
  }
  return { start: '', end: '' };
};

const FiltersPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters } = useChallenges();

  const [localFilters, setLocalFilters] = useState<ChallengeFilters>(filters);
  const [openParticipantsModal, setOpenParticipantsModal] = useState<boolean>(false);
  const [openQuestionsModal, setOpenQuestionsModal] = useState<boolean>(false);
  const [openCustomDateModal, setOpenCustomDateModal] = useState<boolean>(false);
  const [selectedPredefinedDate, setSelectedPredefinedDate] = useState<string>('');

  // Pour afficher le chip sélectionné, on conserve également localement la plage de date
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(
    localFilters.dateRange
  );

  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);

  useEffect(() => {
    setLocalFilters(filters);
    setDateRange(filters.dateRange);
  }, [filters]);

  const toggleFilter = (category: keyof Pick<ChallengeFilters, 'mode' | 'performance' | 'panel'>, option: string) => {
    setLocalFilters(prev => {
      const current = prev[category] as string[];
      const newArray = current.includes(option) ? current.filter(item => item !== option) : [...current, option];
      return { ...prev, [category]: newArray };
    });
  };

  const selectPredefinedRange = (category: 'participantsRange' | 'questionsRange', range: { min: number; max: number }) => {
    setLocalFilters(prev => ({ ...prev, [category]: range }));
  };

  const handleCustomRangeApply = (category: 'participantsRange' | 'questionsRange', range: { min: number; max: number }) => {
    setLocalFilters(prev => ({ ...prev, [category]: range }));
  };

  const handlePredefinedDateClick = (label: string) => {
    const range = getPredefinedDateRange(label);
    setDateRange(range);
    setLocalFilters(prev => ({ ...prev, dateRange: range }));
    setSelectedPredefinedDate(label);
  };

  const handleCustomDateApply = (range: { start: string; end: string }) => {
    setDateRange(range);
    setLocalFilters(prev => ({ ...prev, dateRange: range }));
    setSelectedPredefinedDate(''); // Aucun chip prédéfini sélectionné
  };

  const resetFilters = () => {
    setLocalFilters(defaultFilters);
    setDateRange(null);
    setSelectedPredefinedDate('');
  };

  const handleSaveOptions = () => {
    setOpenConfirmDialog(true);
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirmSave = () => {
    setOpenConfirmDialog(false);
    setFilters(localFilters);
    navigate("/challenges");
  };

  return (
    <Box
      sx={{
        padding: '20px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <FormGroup sx={{ width: '100%' }}>
        {/* Mode */}
        <Divider>
          <Typography variant="h6">Mode</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {modeOptions.map((mode) => (
            <Chip
              key={mode}
              label={mode}
              color={localFilters.mode.includes(mode) ? 'primary' : 'default'}
              onClick={() => toggleFilter('mode', mode)}
            />
          ))}
        </Box>

        {/* Performance */}
        <Divider sx={{ marginTop: '16px' }}>
          <Typography variant="h6">Performance</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {performanceOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              color={localFilters.performance.includes(option) ? 'primary' : 'default'}
              onClick={() => toggleFilter('performance', option)}
            />
          ))}
        </Box>

        {/* Participants */}
        <Divider sx={{ marginTop: '16px' }}>
          <Typography variant="h6">Nombre de participants</Typography>
        </Divider>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '8px' }}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {participantsPredefined.map(item => (
              <Chip
                key={item.label}
                label={item.label}
                color={
                  localFilters.participantsRange &&
                  localFilters.participantsRange.min === item.range.min &&
                  localFilters.participantsRange.max === item.range.max
                    ? 'primary'
                    : 'default'
                }
                onClick={() => selectPredefinedRange('participantsRange', item.range)}
              />
            ))}
            <Chip
              label="Personnalisé"
              color={!localFilters.participantsRange ? 'default' : 'primary'}
              onClick={() => setOpenParticipantsModal(true)}
            />
          </Box>
        </Box>

        {/* Questions */}
        <Divider sx={{ marginTop: '16px' }}>
          <Typography variant="h6">Nombre de questions</Typography>
        </Divider>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '8px' }}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {questionsPredefined.map(item => (
              <Chip
                key={item.label}
                label={item.label}
                color={
                  localFilters.questionsRange &&
                  localFilters.questionsRange.min === item.range.min &&
                  localFilters.questionsRange.max === item.range.max
                    ? 'primary'
                    : 'default'
                }
                onClick={() => selectPredefinedRange('questionsRange', item.range)}
              />
            ))}
            <Chip
              label="Personnalisé"
              color={!localFilters.questionsRange ? 'default' : 'primary'}
              onClick={() => setOpenQuestionsModal(true)}
            />
          </Box>
        </Box>

        {/* Panel de questions */}
        <Divider sx={{ marginTop: '16px' }}>
          <Typography variant="h6">Panel de questions</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {panelOptions.map(option => (
            <Chip
              key={option}
              label={option}
              color={localFilters.panel.includes(option) ? 'primary' : 'default'}
              onClick={() => toggleFilter('panel', option)}
            />
          ))}
        </Box>

        {/* Date de création - Prédefini */}
        <Divider sx={{ marginTop: '16px' }}>
          <Typography variant="h6">Date de création</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {predefinedDateRanges.map(label => (
            <Chip
              key={label}
              label={label}
              color={selectedPredefinedDate === label ? 'primary' : 'default'}
              onClick={() => handlePredefinedDateClick(label)}
            />
          ))}
          <Chip
            label="Personnalisé"
            color={!selectedPredefinedDate && dateRange ? 'primary' : 'default'}
            onClick={() => setOpenCustomDateModal(true)}
          />
        </Box>
      </FormGroup>

      {/* Footer Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: '7vh',
          marginTop: '15px',
        }}
      >
        <Button
          variant="outlined"
          onClick={() => {
            navigate("/challenges");
          }}
          sx={{ marginRight: '1vw' }}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSaveOptions}>
          Save Options
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCancelSave}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Reset Quiz Progress?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Changing the mode, filters, or sorting methods will reset your current progress and history.
            Are you sure you want to apply these new options? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmSave} color="primary" autoFocus>
            Yes, Reset Progress
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modales pour les ranges personnalisés */}
      <CustomRangeModal
        open={openParticipantsModal}
        label="participants"
        initialRange={localFilters.participantsRange || { min: 0, max: 100 }}
        onClose={() => setOpenParticipantsModal(false)}
        onApply={(range) => handleCustomRangeApply('participantsRange', range)}
      />
      <CustomRangeModal
        open={openQuestionsModal}
        label="questions"
        initialRange={localFilters.questionsRange || { min: 0, max: 20 }}
        onClose={() => setOpenQuestionsModal(false)}
        onApply={(range) => handleCustomRangeApply('questionsRange', range)}
      />

      {/* Modal pour date personnalisée */}
      <CustomDateRangeModal
        open={openCustomDateModal}
        initialRange={dateRange || { start: '', end: '' }}
        onClose={() => setOpenCustomDateModal(false)}
        onApply={(range) => handleCustomDateApply(range)}
      />
    </Box>
  );
};

export default FiltersPage;
