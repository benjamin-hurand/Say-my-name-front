// FilterAndSortBar.tsx
import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import SortModal, { SortCriterion } from './SortModal';
import { useNavigate } from 'react-router-dom';
import { ChallengeFilters, defaultFilters } from './FilterAndSortBar.types';

const FilterAndSortBar: React.FC<{
  onSortChange: (criteria: SortCriterion[]) => void;
  onFilterChange: (filters: ChallengeFilters) => void;
}> = ({ onSortChange, onFilterChange }) => {
  const navigate = useNavigate();

  // TRI
  const [sortModalOpen, setSortModalOpen] = useState<boolean>(false);
  const defaultSortCriteria: SortCriterion[] = [
    { id: 'popularity', label: 'Popularité', order: null },
    { id: 'length', label: 'Longueur', order: null },
    { id: 'performance', label: 'Performance', order: null },
    { id: 'createdAt', label: 'Date de création', order: 'desc' },
  ];
  const [currentSortCriteria, setCurrentSortCriteria] = useState<SortCriterion[]>(defaultSortCriteria);

  // FILTRES (les filtres seront gérés sur la page dédiée)
  const [filters] = useState<ChallengeFilters>(defaultFilters);

  const handleOpenSortModal = () => {
    setSortModalOpen(true);
  };
  const handleCloseSortModal = () => {
    setSortModalOpen(false);
  };
  const handleApplySort = (criteria: SortCriterion[]) => {
    setCurrentSortCriteria(criteria);
    onSortChange(criteria);
  };

  // Ici, le bouton "Filtrer" navigue vers la page de filtres
  const handleOpenFiltersPage = () => {
    navigate("/challenges/filters");
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={handleOpenFiltersPage}>
          Filtrer
        </Button>
        <Button variant="outlined" onClick={handleOpenSortModal}>
          Options de tri
        </Button>
      </Stack>

      <SortModal
        open={sortModalOpen}
        initialCriteria={currentSortCriteria}
        onClose={handleCloseSortModal}
        onApply={handleApplySort}
      />
    </Box>
  );
};

export default FilterAndSortBar;
