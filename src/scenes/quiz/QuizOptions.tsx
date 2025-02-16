// QuizOptions.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormGroup,
  Divider,
  Chip,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AddFilterModal } from './components/AddFilterModal';
import { AddSortModal } from './components/AddSortModal';
import { GameRepetitionPattern } from '../../models/commons/Game/GameOptions/GameRepetitionPattern.model';
import { Attribute } from '../../models/commons/Attribute';
import { GameSortBy } from '../../models/commons/Game/GameOptions/GameSortBy.model';
import { GameFilter } from '../../models/commons/Game/GameOptions/GameFilter.model';

interface QuizOptionsProps {
  color: string;
  toggleOptions: (saveChanges?: boolean) => void;
  renderModes: () => React.ReactNode;
  renderFilters: () => React.ReactNode;
  openFilterModal: boolean;
  setOpenFilterModal: (open: boolean) => void;
  availableFilters: Attribute[];
  handleAddFilter: (filter: GameFilter) => void;
  renderSortingMethods: () => React.ReactNode;
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
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  color,
  toggleOptions,
  renderModes,
  renderFilters,
  openFilterModal,
  setOpenFilterModal,
  availableFilters,
  handleAddFilter,
  renderSortingMethods,
  openSortModal,
  setOpenSortModal,
  availableSorts,
  handleAddSortingMethod,
  renderRepetitionOptions,
  tempSelectedRepetitionPattern,
  repeatSettings,
  setRepeatSettings,
  renderHelpsOptions,
  hasCriticalChanges
}) => {
  // Local state for confirmation dialog
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const handleSaveClick = () => {
    if (hasCriticalChanges) {
      console.log('dialog should open');
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
    // Optionally, you could also revert changes by calling toggleOptions(false)
    // or simply keep the dialog closed.
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
        <Divider>
          <Typography variant="h6">Mode</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderModes()}
        </Box>
        <Divider>
          <Typography variant="h6">Filters</Typography>
        </Divider>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {renderFilters()}
          </Box>
          <Button onClick={() => setOpenFilterModal(true)} variant="contained" size="small">
            Add filter
          </Button>
        </Box>
        <AddFilterModal
          open={openFilterModal}
          attributes={availableFilters}
          onSave={handleAddFilter}
          onClose={() => setOpenFilterModal(false)}
        />
        <Divider>
          <Typography variant="h6">Sorting Methods</Typography>
        </Divider>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {renderSortingMethods()}
          </Box>
          <Button onClick={() => setOpenSortModal(true)} variant="contained" size="small">
            Add Sorting Method
          </Button>
        </Box>
        <AddSortModal
          open={openSortModal}
          attributes={availableSorts}
          onSave={handleAddSortingMethod}
          onClose={() => setOpenSortModal(false)}
        />
        <Divider>
          <Typography variant="h6">Learning repetition</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderRepetitionOptions()}
        </Box>
        <Divider>
          <Typography variant="h6">Helps</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderHelpsOptions()}
        </Box>
      </FormGroup>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: '7vh',
          marginTop: '15px',
        }}
      >
        <Button variant="outlined" className="menu nobg" onClick={() => toggleOptions(false)} sx={{ marginRight: '1vw' }}>
          Cancel
        </Button>
        <Button variant="contained" className="menu" onClick={handleSaveClick}>
          Save Options
        </Button>
      </Box>
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
