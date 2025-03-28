// QuizOptions.tsx
import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormGroup,
  Divider,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Tooltip,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AddSortModal } from './components/AddSortModal';
import AddFilterModal from './components/AddFilterModal';
import { GameSortBy } from '../../models/commons/Game/GameOptions/GameSortBy.model';
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model';
import { GameRepetitionPattern, repetitionPatterns } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { DraggableSortingMethods } from './components/DraggableSortingMethods';
import ModeCard from './components/ModeCard';
import { useQuizOptions } from '../../contexts/QuizOptionsContext';
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import OptionCard from './components/OptionCard';
import { useNavigate } from 'react-router-dom';

interface QuizOptionsProps {
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
}) => {
  // Navigation
  const navigate = useNavigate();

  // Local state for confirmation dialog
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // RECUP DEPUIS CONTEXT
  const { color } = useThemeColorContext();
  const {
    modes, selectedMode, setSelectedMode, tempSelectedMode, setTempSelectedMode,
    availableFilters, selectedFilters, setSelectedFilters, tempSelectedFilters, setTempSelectedFilters,
    availableSorts, selectedSortingMethods, setSelectedSortingMethods, tempSelectedSortingMethods, setTempSelectedSortingMethods,
    selectedRepetitionPattern, setSelectedRepetitionPattern, tempSelectedRepetitionPattern, setTempSelectedRepetitionPattern,
    selectedHelps, setSelectedHelps, tempSelectedHelps, setTempSelectedHelps
  } = useQuizOptions();

  // MODES
  const renderModes = () => {
      return modes.map((mode) => (
          <ModeCard
              key={mode.id}
              mode={mode}
              isSelected={tempSelectedMode?.id === mode.id}
              onSelect={() => setTempSelectedMode(mode)}
          />
      ));
  };

  // FILTERS
  const [editingFilter, setEditingFilter] = useState<GameFilter | undefined>();
  const [openFilterModal, setOpenFilterModal] = useState(false);

  const renderFilters = () => {
      if (tempSelectedFilters.length === 0) {
          return <Chip label="No filters" disabled />;
      }
      return tempSelectedFilters.map((filter, index) => (
          <Chip
              key={index}
              label={`${filter.attribute.name} [${filter.minValue} - ${filter.maxValue}]`}
              onClick={() => handleEditFilter(index)}
              onDelete={() => handleDeleteFilter(filter.id)}
          />
      ));
  };

  const handleSaveFilter = (filter: GameFilter) => {
      if (editingFilter) {
        // Update existing filter based on its id.
        setTempSelectedFilters(prevFilters =>
          prevFilters.map(f => (f.id === editingFilter.id ? filter : f))
        );
        setEditingFilter(undefined);
      } else {
        // Add new filter.
        setTempSelectedFilters(prevFilters => [...prevFilters, filter]);
      }
      setOpenFilterModal(false);
  };

  const handleEditFilter = (index: number) => {
    // Retrieve the filter to be edited (from tempSelectedFilters)
    const filterToEdit = tempSelectedFilters[index];
    // Set a state that indicates “editing mode” and which filter is being edited
    setEditingFilter(filterToEdit);
    // Open the addFilterModal with the editing prop populated
    setOpenFilterModal(true);
  };

  const handleDeleteFilter = (filterId: number) => {
    const newFilters = tempSelectedFilters.filter(filter => filter.id !== filterId);
    setTempSelectedFilters(newFilters);
  };

  const closeFilterModal = () => {
    setOpenFilterModal(false);
    if (editingFilter) {
      setEditingFilter(undefined);
    }
  };


  // SORTS
  const [editingSort, setEditingSort] = useState<GameSortBy | undefined>();
  const [openSortModal, setOpenSortModal] = useState(false);

  const handleSaveSortingMethod = (sortBy: GameSortBy) => {
      // console.log('Save : ', JSON.stringify(sortBy));
      // console.log('With editingSort: ', JSON.stringify(editingSort));
      // console.log('With tempSelectedSortingMethods: ', JSON.stringify(tempSelectedSortingMethods));
      if (editingSort) {
          // console.log('ya editingSort, on remplace celui de base');
          // Update existing sort based on its id.
          setTempSelectedSortingMethods(prevSorts =>
            prevSorts.map(s => (s.id === editingSort.id ? sortBy : s))
          );
          setEditingSort(undefined);
        } else {
          // console.log('ya pas editingSort, on rajoute normalement');
          // Add new sort.
          setTempSelectedSortingMethods(prevSorts => [...prevSorts, sortBy]);
        }
        setOpenSortModal(false);
  };

  const handleEditSort = (index: number) => {
    const sortToEdit = tempSelectedSortingMethods[index];
    setEditingSort(sortToEdit);
    setOpenSortModal(true);
  }; 

  const handleDeleteSortingMethod = (sortId: number) => {
    const newSorts = tempSelectedSortingMethods.filter(sort => sort.id !== sortId);
    setTempSelectedSortingMethods(newSorts);
};  

  const closeSortModal = () => {
    setOpenSortModal(false);
    if (editingSort) {
      setEditingSort(undefined);
    }
  };

  // REPETITIONS
  const renderRepetitionOptions = () => {
    return Object.keys(repetitionPatterns).map((option) => (
        <Tooltip key={option} title={
        option.toLowerCase() === 'optimal'
            ? 'Optimal: We will automatically schedule reviews based on your performance.'
            : option.toLowerCase() === 'immediate'
            ? 'Immediate: The question will repeat right away if answered incorrectly.'
            : 'Never: Do not repeat this question.'
        }>
        <OptionCard
            option={option.charAt(0).toUpperCase() + option.slice(1)}
            isSelected={tempSelectedRepetitionPattern.patternName === option.toLowerCase()}
            onSelect={() => handleSelectRepetition(option)}
        />
        </Tooltip>
    ));
  };

  const handleSelectRepetition = (option: string) => {
      const pattern: GameRepetitionPattern = repetitionPatterns[option.toLowerCase() as keyof typeof repetitionPatterns];
      setTempSelectedRepetitionPattern(pattern);
  }; 

  // HELPS
  const helpOptions: {
    key: string;
    label: string;
  }[] = [
    { key: 'typosFriendly', label: 'Typos friendly' },
    { key: 'initialGiven', label: 'Initial given' }
  ];
  const renderHelpsOptions = () => {
    return helpOptions.map((option) => (
      <OptionCard
        key={option.key}
        option={option.label}
        isSelected={tempSelectedHelps[option.key]}
        onSelect={() => handleSelectHelps(option.key)}
      />
    ));
  };
  
  const handleSelectHelps = (key: string) => {
    // Toggle the boolean for the specific help option.
    setTempSelectedHelps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  //GLOBAL SAVE
  const hasCriticalChanges = useMemo(() => {
        return (
          JSON.stringify(tempSelectedMode) !== JSON.stringify(selectedMode) ||
          JSON.stringify(tempSelectedFilters) !== JSON.stringify(selectedFilters) ||
          JSON.stringify(tempSelectedSortingMethods) !== JSON.stringify(selectedSortingMethods)
        );
      }, [tempSelectedMode, selectedMode, tempSelectedFilters, selectedFilters, tempSelectedSortingMethods, selectedSortingMethods]);
      
  const handleSaveClick = () => {
    if (hasCriticalChanges) {
      setOpenConfirmDialog(true);
    } else {
      goToQuiz(true);
    }
  };

  const handleConfirmSave = () => {
    setOpenConfirmDialog(false);
    goToQuiz(true);
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false);
  };

  const goToQuiz = (saveChanges: boolean = false) => {
    if (saveChanges) {
      setSelectedMode(tempSelectedMode);
      setSelectedFilters(tempSelectedFilters);
      setSelectedSortingMethods(tempSelectedSortingMethods);
      setSelectedRepetitionPattern(tempSelectedRepetitionPattern);
      setSelectedHelps(tempSelectedHelps);
    } else {
        // Revert interim states to last committed state if changes were made but user cancelled
        setTempSelectedMode(selectedMode);
        setTempSelectedFilters(selectedFilters);
        setTempSelectedSortingMethods(selectedSortingMethods);
        setTempSelectedRepetitionPattern(selectedRepetitionPattern);
        setTempSelectedHelps(selectedHelps);
    }
    navigate('/quiz' , { replace: true });
  }

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
          {renderModes()}
        </Box>

        {/* Filters */}
        <Divider>
          <Typography variant="h6">Filters</Typography>
        </Divider>
        {/* 
          Sépare la zone des chips (avec flexWrap) et le bouton (avec whiteSpace: 'nowrap').
        */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            width: '100%',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {renderFilters()}
          </Box>
          <Box sx={{ flexShrink: 0, marginTop: '8px' }}>
          <Tooltip title={availableFilters.length === 0 ? "Aucun filtre disponible" : ""}>
            <span>
              <Button
                onClick={() => setOpenFilterModal(true)}
                variant="contained"
                size="small"
                disabled={availableFilters.length === 0}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add filter
              </Button>
            </span>
          </Tooltip>
          </Box>
        </Box>
        <AddFilterModal
          open={openFilterModal}
          attributes={availableFilters}
          onSave={handleSaveFilter}
          onClose={closeFilterModal}
          initialFilter={editingFilter}
          handleDeleteFilter={handleDeleteFilter}
        />

        {/* Sorting Methods */}
        <Divider>
          <Typography variant="h6">Sorting Methods</Typography>
        </Divider>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            width: '100%',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <DraggableSortingMethods
              tempSelectedSortingMethods={tempSelectedSortingMethods}
              setTempSelectedSortingMethods={setTempSelectedSortingMethods}
              handleEditSort={handleEditSort}
              handleDeleteSortingMethod={handleDeleteSortingMethod}
            />
          </Box>
          <Box sx={{ flexShrink: 0, marginTop: '8px' }}>
            <Tooltip title={availableSorts.length === 0 ? "Aucun tri disponible" : ""}>
              <span>
                <Button
                  onClick={() => setOpenSortModal(true)}
                  variant="contained"
                  size="small"
                  sx={{
                    whiteSpace: 'nowrap', // Empêche le texte de passer à la ligne
                  }}
                  disabled={availableSorts.length === 0}
                >
                  Add Sorting Method
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <AddSortModal
          open={openSortModal}
          availableAttributes={availableSorts}
          onSave={handleSaveSortingMethod}
          onClose={closeSortModal}
          initialSort={editingSort}
          handleDeleteSort={handleDeleteSortingMethod}
        />

        {/* Learning repetition */}
        <Divider>
          <Typography variant="h6">Learning repetition</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderRepetitionOptions()}
        </Box>

        {/* Helps */}
        <Divider>
          <Typography variant="h6">Helps</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderHelpsOptions()}
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
          className="menu nobg"
          onClick={() => goToQuiz(false)}
          sx={{ marginRight: '1vw' }}
        >
          Cancel
        </Button>
        <Button variant="contained" className="menu" onClick={handleSaveClick}>
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
    </Box>
  );
};

export default QuizOptions;
