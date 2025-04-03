// FilterAndSortBar.tsx
import React, { useState, useEffect } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SortModal, { SortCriterion } from './SortModal';
import InlineSortBar from './InlineSortBar';
import InlineFiltersBar from './InlineFiltersBar';
import { ChallengeFilters, initialFilters } from './FilterAndSortBar.types';
import { getSortCriteria, SortCriterionDto } from '../../../../services/business/challenges/sortCriteria.service';

const FilterAndSortBar: React.FC<{
  onSortChange: (criteria: SortCriterion[]) => void;
  onFilterChange: (filters: ChallengeFilters) => void;
}> = ({ onSortChange, onFilterChange }) => {
  const navigate = useNavigate();

  // États pour activer les vues inline pour tri et filtres
  const [sortInlineActive, setSortInlineActive] = useState(false);
  const [filtersInlineActive, setFiltersInlineActive] = useState(false);

  // TRI : on démarre avec un tableau vide que l'on va remplir via l'API
  const [currentSortCriteria, setCurrentSortCriteria] = useState<SortCriterion[]>([]);

  // FILTRES
  const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);

  // Récupération des critères de tri depuis l'API lors du montage du composant
  useEffect(() => {
    async function fetchSortCriteria() {
      try {
        const criteriaDtos: SortCriterionDto[] = await getSortCriteria();
        // Par exemple, on peut mapper la clé en minuscule pour correspondre aux identifiants attendus
        const criteria: SortCriterion[] = criteriaDtos.map((dto) => ({
          id: dto.key.toLowerCase(),
          label: dto.label,
          // Ici, on définit l'ordre par défaut pour la date de création comme "desc", sinon null
          order: dto.key === "CREATION_DATE" ? "desc" : null,
        }));
        setCurrentSortCriteria(criteria);
      } catch (error) {
        console.error("Error fetching sort criteria:", error);
      }
    }
    fetchSortCriteria();
  }, []);

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
