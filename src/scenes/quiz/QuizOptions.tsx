// QuizOptions.tsx
import React, { useState } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AddSortModal } from './components/AddSortModal';
import { GameRepetitionPattern } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { Attribute } from '../../models/commons/Attribute';
import { GameSortBy } from '../../models/commons/Game/GameOptions/GameSortBy.model';
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model';
import AddFilterModal from './components/AddFilterModal';
import { DraggableSortingMethods } from './components/DraggableSortingMethods';

interface QuizOptionsProps {
  color: string;
  toggleOptions: (saveChanges?: boolean) => void;
  renderModes: () => React.ReactNode;
  renderFilters: () => React.ReactNode;
  openFilterModal: boolean;
  setOpenFilterModal: (open: boolean) => void;
  availableFilters: Attribute[];
  handleSaveFilter: (filter: GameFilter) => void;
  tempSelectedSortingMethods: GameSortBy[];
  setTempSelectedSortingMethods: (methods: GameSortBy[]) => void;
  handleEditSort: (sortId: number) => void;
  openSortModal: boolean;
  setOpenSortModal: (open: boolean) => void;
  availableSorts: Attribute[];
  handleAddSortingMethod: (sortBy: GameSortBy) => void;
  renderRepetitionOptions: () => React.ReactNode;
  tempSelectedRepetitionPattern: GameRepetitionPattern;
  repeatSettings: {
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  };
  setRepeatSettings: (settings: {
    initialEasinessFactor: number;
    initialInterval: number;
    secondInterval: number;
  }) => void;
  renderHelpsOptions: () => React.ReactNode;
  hasCriticalChanges: boolean;
  initialFilter: GameFilter | undefined;
  initialSort: GameSortBy | undefined;
  setEditingFilter: (initialFilter: GameFilter | undefined) => void;
  setEditingSort: (initialSort: GameSortBy | undefined) => void;
  handleDeleteFilter: (filterId: number) => void;
  handleDeleteSort: (sortId: number) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  color,
  toggleOptions,
  renderModes,
  renderFilters,
  openFilterModal,
  setOpenFilterModal,
  availableFilters,
  handleSaveFilter,
  tempSelectedSortingMethods,
  setTempSelectedSortingMethods,
  handleEditSort,
  openSortModal,
  setOpenSortModal,
  availableSorts,
  handleAddSortingMethod,
  renderRepetitionOptions,
  tempSelectedRepetitionPattern,
  repeatSettings,
  setRepeatSettings,
  renderHelpsOptions,
  hasCriticalChanges,
  initialFilter,
  initialSort,
  setEditingFilter,
  setEditingSort,
  handleDeleteFilter,
  handleDeleteSort,
}) => {
  // Local state for confirmation dialog
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const closeFilterModal = () => {
    setOpenFilterModal(false);
    if (initialFilter) {
      setEditingFilter(undefined);
    }
  };

  const closeSortModal = () => {
    setOpenSortModal(false);
    if (initialSort) {
      setEditingSort(undefined);
    }
  };

  const handleSaveClick = () => {
    if (hasCriticalChanges) {
      setOpenConfirmDialog(true);
    } else {
      toggleOptions(true);
    }
  };

  const handleConfirmSave = () => {
    setOpenConfirmDialog(false);
    toggleOptions(true);
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false);
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
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '1vh',
        }}
      >
        <IconButton
          onClick={() => toggleOptions(false)}
          sx={{
            color: color,
            boxShadow: `0 0 8px ${color}`,
            transition: 'box-shadow 0.2s ease-in-out',
            backdropFilter: 'blur(6px)',
          }}
          aria-label="Back to quiz"
        >
          <ArrowBackIcon style={{ color }} />
        </IconButton>
        <Typography variant="h4" style={{ color: color, textShadow: `0 0 8px ${color}` }}>
          Quiz Options
        </Typography>
      </Box>

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
          initialFilter={initialFilter}
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
              handleDeleteSortingMethod={handleDeleteSort}
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
          onSave={handleAddSortingMethod}
          onClose={closeSortModal}
          initialSort={initialSort}
          handleDeleteSort={handleDeleteSort}
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
          onClick={() => toggleOptions(false)}
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
