// FilterAndSortBar.tsx
import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SortModal, { SortCriterion } from './SortModal';
import InlineSortBar from './InlineSortBar';
import InlineFiltersBar from './InlineFiltersBar';
import { ChallengeFilters, defaultFilters } from './FilterAndSortBar.types';

const FilterAndSortBar: React.FC<{
  onSortChange: (criteria: SortCriterion[]) => void;
  onFilterChange: (filters: ChallengeFilters) => void;
}> = ({ onSortChange, onFilterChange }) => {
  const navigate = useNavigate();

  // États pour activer les vues inline pour tri et filtres
  const [sortInlineActive, setSortInlineActive] = useState(false);
  const [filtersInlineActive, setFiltersInlineActive] = useState(false);

  // TRI
  const defaultSortCriteria: SortCriterion[] = [
    { id: 'popularity', label: 'Popularité', order: null },
    { id: 'length', label: 'Longueur', order: null },
    { id: 'performance', label: 'Performance', order: null },
    { id: 'createdAt', label: 'Date de création', order: 'desc' },
  ];
  const [currentSortCriteria, setCurrentSortCriteria] = useState<SortCriterion[]>(defaultSortCriteria);

  // FILTRES
  const [filters, setFilters] = useState<ChallengeFilters>(defaultFilters);

  // Handlers pour le tri inline
  const handleInlineSortChange = (criteria: SortCriterion[]) => {
    setCurrentSortCriteria(criteria);
    onSortChange(criteria);
  };
  const handleActivateInlineSort = () => {
    // Désactiver la vue inline des filtres si elle est active
    setFiltersInlineActive(false);
    setSortInlineActive(true);
  };
  const handleDeactivateInlineSort = () => {
    setSortInlineActive(false);
  };

  // Handlers pour le filtre inline
  const handleActivateInlineFilters = () => {
    // Désactiver la vue inline de tri si elle est active
    setSortInlineActive(false);
    setFiltersInlineActive(true);
  };
  const handleDeactivateInlineFilters = () => {
    setFiltersInlineActive(false);
  };
  const handleApplyInlineFilters = (newFilters: ChallengeFilters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Si une vue inline est active, l'afficher en priorité
  if (sortInlineActive) {
    return (
      <InlineSortBar
        criteria={currentSortCriteria}
        onCriteriaChange={handleInlineSortChange}
        onBack={handleDeactivateInlineSort}
      />
    );
  }
  if (filtersInlineActive) {
    return (
      <InlineFiltersBar
        initialFilters={filters}
        onFiltersChange={handleApplyInlineFilters}
        onBack={handleDeactivateInlineFilters}
      />
    );
  }

  // Vue par défaut : affiche deux boutons pour activer les vues inline
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
      <Button
        className="menu"
        variant="outlined"
        size="small"
        onClick={handleActivateInlineFilters}
        sx={{ flex: 1 }}
      >
        Filtrer
      </Button>
      <Button
        className="menu"
        variant="outlined"
        size="small"
        onClick={handleActivateInlineSort}
        sx={{ flex: 1 }}
      >
        Options de tri
      </Button>
    </Box>
  );
};

export default FilterAndSortBar;
