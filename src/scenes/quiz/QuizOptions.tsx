// QuizOptions.tsx
import React from 'react';
import {
  Box,
  Button,
  FormGroup,
  Divider,
  Chip,
  TextField,
  Typography,
  IconButton,
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
  filters: Attribute[];
  handleAddFilter: (filter: GameFilter) => void;
  renderSortingMethods: () => React.ReactNode;
  openSortModal: boolean;
  setOpenSortModal: (open: boolean) => void;
  sorts: Attribute[];
  handleAddSortingMethod: (sortBy: GameSortBy) => void;
  renderRepetitionOptions: () => React.ReactNode;
  selectedRepetitionPattern: GameRepetitionPattern;
  repeatSettings: {
    initialRepetitionCount: number;
    initialEasinessFactor: number;
    initialInterval: number | "Infinity";
  };
  setRepeatSettings: (settings: {
    initialRepetitionCount: number;
    initialEasinessFactor: number;
    initialInterval: number | "Infinity";
  }) => void;
  renderHelpsOptions: () => React.ReactNode;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  color,
  toggleOptions,
  renderModes,
  renderFilters,
  openFilterModal,
  setOpenFilterModal,
  filters,
  handleAddFilter,
  renderSortingMethods,
  openSortModal,
  setOpenSortModal,
  sorts,
  handleAddSortingMethod,
  renderRepetitionOptions,
  selectedRepetitionPattern,
  repeatSettings,
  setRepeatSettings,
  renderHelpsOptions,
}) => {
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
          attributes={filters}
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
          attributes={sorts}
          onSave={handleAddSortingMethod}
          onClose={() => setOpenSortModal(false)}
        />
        <Divider>
          <Typography variant="h6">Learning repetition</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderRepetitionOptions()}
        </Box>
        {selectedRepetitionPattern.patternName === 'custom' && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              type="number"
              label="Repetition Count"
              sx={{ m: 1 }}
              value={repeatSettings.initialRepetitionCount}
              onChange={(e) => {
                const newCount = parseInt(e.target.value);
                setRepeatSettings({ ...repeatSettings, initialRepetitionCount: newCount });
              }}
            />
            <TextField
              type="number"
              label="Easiness Factor"
              sx={{ m: 1 }}
              value={repeatSettings.initialEasinessFactor}
              onChange={(e) => {
                const newFactor = parseFloat(e.target.value);
                setRepeatSettings({ ...repeatSettings, initialEasinessFactor: newFactor });
              }}
            />
            <TextField
              type="number"
              label="Initial Interval"
              sx={{ m: 1 }}
              value={repeatSettings.initialInterval === Infinity ? '' : repeatSettings.initialInterval}
              onChange={(e) => {
                const newInterval = parseInt(e.target.value);
                setRepeatSettings({ ...repeatSettings, initialInterval: newInterval });
              }}
            />
          </Box>
        )}


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
        <Button variant="contained" className="menu" onClick={() => toggleOptions(true)}>
          Save Options
        </Button>
      </Box>
    </Box>
  );
};

export default QuizOptions;
