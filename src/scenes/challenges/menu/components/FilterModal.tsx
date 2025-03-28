// FiltersModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Chip, Stack, TextField } from '@mui/material';
import CustomRangeModal from './CustomRangeModal';
import { ChallengeFilters, defaultFilters } from './FilterAndSortBar.types';

interface FiltersModalProps {
  open: boolean;
  initialFilters: ChallengeFilters;
  onApply: (filters: ChallengeFilters) => void;
  onClose: () => void;
}

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

const FiltersModal: React.FC<FiltersModalProps> = ({ open, initialFilters, onApply, onClose }) => {
  const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);
  const [participantsModalOpen, setParticipantsModalOpen] = useState<boolean>(false);
  const [questionsModalOpen, setQuestionsModalOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(filters.dateRange ? filters.dateRange.start : '');
  const [endDate, setEndDate] = useState<string>(filters.dateRange ? filters.dateRange.end : '');

  useEffect(() => {
    setFilters(initialFilters);
    setStartDate(initialFilters.dateRange ? initialFilters.dateRange.start : '');
    setEndDate(initialFilters.dateRange ? initialFilters.dateRange.end : '');
  }, [initialFilters]);

  const toggleFilter = (category: keyof Pick<ChallengeFilters, 'mode' | 'performance' | 'panel'>, option: string) => {
    setFilters(prev => {
      const current = prev[category] as string[];
      const newArray = current.includes(option) ? current.filter(item => item !== option) : [...current, option];
      return { ...prev, [category]: newArray };
    });
  };

  const selectPredefinedRange = (category: 'participantsRange' | 'questionsRange', range: { min: number; max: number }) => {
    setFilters(prev => ({ ...prev, [category]: range }));
  };

  const handleCustomRangeApply = (category: 'participantsRange' | 'questionsRange', range: { min: number; max: number }) => {
    setFilters(prev => ({ ...prev, [category]: range }));
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartDate(value);
      setFilters(prev => ({ ...prev, dateRange: { start: value, end: endDate } }));
    } else {
      setEndDate(value);
      setFilters(prev => ({ ...prev, dateRange: { start: startDate, end: value } }));
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setStartDate('');
    setEndDate('');
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Filtrer les challenges</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Mode */}
            <Box>
              <Box sx={{ mb: 1 }}>Mode :</Box>
              <Stack direction="row" spacing={1}>
                {modeOptions.map(option => (
                  <Chip
                    key={option}
                    label={option}
                    color={filters.mode.includes(option) ? 'primary' : 'default'}
                    onClick={() => toggleFilter('mode', option)}
                  />
                ))}
              </Stack>
            </Box>
            {/* Performance */}
            <Box>
              <Box sx={{ mb: 1 }}>Performance :</Box>
              <Stack direction="row" spacing={1}>
                {performanceOptions.map(option => (
                  <Chip
                    key={option}
                    label={option}
                    color={filters.performance.includes(option) ? 'primary' : 'default'}
                    onClick={() => toggleFilter('performance', option)}
                  />
                ))}
              </Stack>
            </Box>
            {/* Participants Range */}
            <Box>
              <Box sx={{ mb: 1 }}>Nombre de participants :</Box>
              <Stack direction="row" spacing={1}>
                {participantsPredefined.map(item => (
                  <Chip
                    key={item.label}
                    label={item.label}
                    color={
                      filters.participantsRange &&
                      filters.participantsRange.min === item.range.min &&
                      filters.participantsRange.max === item.range.max
                        ? 'primary'
                        : 'default'
                    }
                    onClick={() => selectPredefinedRange('participantsRange', item.range)}
                  />
                ))}
                <Chip
                  label="Personnalisé"
                  color={!filters.participantsRange ? 'default' : 'primary'}
                  onClick={() => setParticipantsModalOpen(true)}
                />
              </Stack>
            </Box>
            {/* Questions Range */}
            <Box>
              <Box sx={{ mb: 1 }}>Nombre de questions :</Box>
              <Stack direction="row" spacing={1}>
                {questionsPredefined.map(item => (
                  <Chip
                    key={item.label}
                    label={item.label}
                    color={
                      filters.questionsRange &&
                      filters.questionsRange.min === item.range.min &&
                      filters.questionsRange.max === item.range.max
                        ? 'primary'
                        : 'default'
                    }
                    onClick={() => selectPredefinedRange('questionsRange', item.range)}
                  />
                ))}
                <Chip
                  label="Personnalisé"
                  color={!filters.questionsRange ? 'default' : 'primary'}
                  onClick={() => setQuestionsModalOpen(true)}
                />
              </Stack>
            </Box>
            {/* Panel de questions */}
            <Box>
              <Box sx={{ mb: 1 }}>Panel de questions :</Box>
              <Stack direction="row" spacing={1}>
                {panelOptions.map(option => (
                  <Chip
                    key={option}
                    label={option}
                    color={filters.panel.includes(option) ? 'primary' : 'default'}
                    onClick={() => toggleFilter('panel', option)}
                  />
                ))}
              </Stack>
            </Box>
            {/* Date de création */}
            <Box>
              <Box sx={{ mb: 1 }}>Date de création :</Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Début"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fin"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Box>
            {/* Bouton de réinitialisation */}
            <Box>
              <Button variant="outlined" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button onClick={handleApply} variant="contained">Appliquer</Button>
        </DialogActions>
      </Dialog>

      {/* Modales pour les ranges personnalisés */}
      <CustomRangeModal
        open={participantsModalOpen}
        label="participants"
        initialRange={filters.participantsRange || { min: 0, max: 100 }}
        onClose={() => setParticipantsModalOpen(false)}
        onApply={(range) => handleCustomRangeApply('participantsRange', range)}
      />
      <CustomRangeModal
        open={questionsModalOpen}
        label="questions"
        initialRange={filters.questionsRange || { min: 0, max: 20 }}
        onClose={() => setQuestionsModalOpen(false)}
        onApply={(range) => handleCustomRangeApply('questionsRange', range)}
      />
    </>
  );
};

export default FiltersModal;
