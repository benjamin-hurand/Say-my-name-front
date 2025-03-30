// InlineFiltersBar.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReplayIcon from '@mui/icons-material/Replay';
import CloseIcon from '@mui/icons-material/Close';
import { ChallengeFilters, defaultFilters } from './FilterAndSortBar.types';

type FilterCategory =
  | 'mode'
  | 'performance'
  | 'panel'
  | 'participantsRange'
  | 'questionsRange'
  | 'dateRange'
  | null;

const modeOptions = ['Prénom', 'Nom', 'Prénom & Nom'];
const performanceOptions = ['Réussi', 'Podium', 'Achevé', 'Nouveau', 'Pas commencé'];
const panelOptions = ['A-D', 'E-H', 'I-L', 'M-P', 'Q-Z'];
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
const predefinedDateRanges = ["Aujourd'hui", "Cette semaine", "Ce mois-ci"];

const getPredefinedDateRange = (label: string): { start: string; end: string } => {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  if (label === "Aujourd'hui") {
    return { start: formatDate(today), end: formatDate(today) };
  } else if (label === "Cette semaine") {
    const day = today.getDay();
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

const isPredefinedDate = (range: { start: string; end: string }, label: string): boolean => {
  const predefined = getPredefinedDateRange(label);
  return predefined.start === range.start && predefined.end === range.end;
};

interface InlineFiltersBarProps {
  initialFilters: ChallengeFilters;
  onFiltersChange: (filters: ChallengeFilters) => void;
  onBack: () => void; // Retour à la vue principale (boutons "Filtrer" et "Options de tri")
}

interface ChipData {
  label: string;
  category: Exclude<FilterCategory, null>;
}

const InlineFiltersBar: React.FC<InlineFiltersBarProps> = ({
  initialFilters,
  onFiltersChange,
  onBack,
}) => {
  const [filters, setFilters] = useState<ChallengeFilters>(initialFilters);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(null);
  // Pour la saisie personnalisée (applicable aux plages numériques et dates)
  const [customRange, setCustomRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  // Pour activer la vue custom dans une catégorie range
  const [customRangeActive, setCustomRangeActive] = useState<boolean>(false);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  // Construction de la liste de chips pour le niveau B (affichage du résumé)
  const chipsData: ChipData[] = [
    { label: 'Mode', category: 'mode' },
    { label: 'Performance', category: 'performance' },
    { label: 'Panel', category: 'panel' },
    { label: 'Participants', category: 'participantsRange' },
    { label: 'Questions', category: 'questionsRange' },
    { label: 'Date', category: 'dateRange' },
  ];

  // Vue principale : résumé de chaque catégorie avec chip (niveau B)
  if (!activeCategory) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', position: 'relative' }}>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
          {chipsData.map((chip, index) => (
            <Chip
              key={index}
              label={chip.label}
              color={
                chip.category === 'mode'
                  ? filters.mode.length > 0
                    ? 'primary'
                    : 'default'
                  : chip.category === 'performance'
                  ? filters.performance.length > 0
                    ? 'primary'
                    : 'default'
                  : chip.category === 'panel'
                  ? filters.panel.length > 0
                    ? 'primary'
                    : 'default'
                  : chip.category === 'participantsRange'
                  ? filters.participantsRange
                    ? 'primary'
                    : 'default'
                  : chip.category === 'questionsRange'
                  ? filters.questionsRange
                    ? 'primary'
                    : 'default'
                  : chip.category === 'dateRange'
                  ? filters.dateRange
                    ? 'primary'
                    : 'default'
                  : 'default'
              }
              onClick={() => setActiveCategory(chip.category)}
            />
          ))}
        </Stack>
        <Box sx={{ position: 'absolute', right: 0 }}>
          <IconButton onClick={resetFilters}>
            <ReplayIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // Vue pour catégories simples : Mode, Performance, Panel (niveau C)
  if (activeCategory === 'mode' || activeCategory === 'performance' || activeCategory === 'panel') {
    const options =
      activeCategory === 'mode'
        ? modeOptions
        : activeCategory === 'performance'
        ? performanceOptions
        : panelOptions;
    const selected = filters[activeCategory] as string[];
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => setActiveCategory(null)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} :
        </Typography>
        {options.map(opt => (
          <Chip
            key={opt}
            label={opt}
            color={selected.includes(opt) ? 'primary' : 'default'}
            onClick={() => {
              const newSelected = selected.includes(opt)
                ? selected.filter(item => item !== opt)
                : [...selected, opt];
              const updated = { ...filters, [activeCategory]: newSelected };
              setFilters(updated);
              onFiltersChange(updated);
            }}
          />
        ))}
      </Box>
    );
  }

  // Vue pour les catégories range : Participants ou Questions (niveau C/D)
  if (activeCategory === 'participantsRange' || activeCategory === 'questionsRange') {
    const predefined = activeCategory === 'participantsRange' ? participantsPredefined : questionsPredefined;
    const currentRange =
      activeCategory === 'participantsRange' ? filters.participantsRange : filters.questionsRange;
    // Vérifier si la plage sélectionnée est personnalisée (non prédéfinie)
    const isCustom =
      currentRange &&
      !predefined.some(
        item => currentRange.min === item.range.min && currentRange.max === item.range.max
      );
    // Fonction pour activer la saisie custom et pré-remplir si une plage existe déjà
    const handleCustomEntry = () => {
      if (currentRange) {
        setCustomRange({ min: currentRange.min.toString(), max: currentRange.max.toString() });
      } else {
        setCustomRange({ min: '', max: '' });
      }
      setCustomRangeActive(true);
    };

    if (customRangeActive) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setCustomRangeActive(false)}>
            <ArrowBackIcon />
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Min"
              value={customRange.min}
              onChange={(e) => setCustomRange({ ...customRange, min: e.target.value })}
              size="small"
              type="number"
            />
            <TextField
              label="Max"
              value={customRange.max}
              onChange={(e) => setCustomRange({ ...customRange, max: e.target.value })}
              size="small"
              type="number"
            />
            <Chip
              label="OK"
              color="primary"
              onClick={() => {
                if (customRange.min !== '' && customRange.max !== '') {
                  const range = { min: Number(customRange.min), max: Number(customRange.max) };
                  const updated = { ...filters, [activeCategory]: range };
                  setFilters(updated);
                  onFiltersChange(updated);
                  setCustomRangeActive(false);
                  setActiveCategory(null);
                }
              }}
            />
            {/* Bouton pour supprimer la sélection custom */}
            <IconButton
              onClick={() => {
                const updated = { ...filters, [activeCategory]: null };
                setFilters(updated);
                onFiltersChange(updated);
                setCustomRange({ min: '', max: '' });
                setCustomRangeActive(false);
                setActiveCategory(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      );
    } else {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <IconButton onClick={() => setActiveCategory(null)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {activeCategory === 'participantsRange' ? 'Participants :' : 'Questions :'}
          </Typography>
          {predefined.map(item => (
            <Chip
              key={item.label}
              label={item.label}
              color={
                currentRange &&
                currentRange.min === item.range.min &&
                currentRange.max === item.range.max
                  ? 'primary'
                  : 'default'
              }
              onClick={() => {
                if (
                  currentRange &&
                  currentRange.min === item.range.min &&
                  currentRange.max === item.range.max
                ) {
                  // Désélection si déjà sélectionné
                  const updated = { ...filters, [activeCategory]: null };
                  setFilters(updated);
                  onFiltersChange(updated);
                } else {
                  const updated = { ...filters, [activeCategory]: item.range };
                  setFilters(updated);
                  onFiltersChange(updated);
                }
              }}
            />
          ))}
          <Chip
            label="Personnalisé"
            onClick={handleCustomEntry}
            onDelete={
              isCustom
                ? () => {
                    const updated = { ...filters, [activeCategory]: null };
                    setFilters(updated);
                    onFiltersChange(updated);
                  }
                : undefined
            }
            color={isCustom ? 'primary' : 'default'}
          />
        </Box>
      );
    }
  }

  // Vue pour le filtre de date (niveau C/D)
  if (activeCategory === 'dateRange') {
    const currentDateRange = filters.dateRange;
    const handleCustomDateEntry = () => {
      // Si une date custom est déjà sélectionnée, pré-remplir les inputs
      if (currentDateRange && !predefinedDateRanges.some(l => isPredefinedDate(currentDateRange, l))) {
        setCustomRange({ min: currentDateRange.start, max: currentDateRange.end });
      } else {
        setCustomRange({ min: '', max: '' });
      }
      setCustomRangeActive(true);
    };

    if (customRangeActive) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setCustomRangeActive(false)}>
            <ArrowBackIcon />
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Début"
              type="date"
              value={customRange.min}
              onChange={(e) => setCustomRange({ ...customRange, min: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fin"
              type="date"
              value={customRange.max}
              onChange={(e) => setCustomRange({ ...customRange, max: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Chip
              label="OK"
              color="primary"
              onClick={() => {
                if (customRange.min !== '' && customRange.max !== '') {
                  const updated = { ...filters, dateRange: { start: customRange.min, end: customRange.max } };
                  setFilters(updated);
                  onFiltersChange(updated);
                  setCustomRangeActive(false);
                  setActiveCategory(null);
                }
              }}
            />
            <IconButton
              onClick={() => {
                const updated = { ...filters, dateRange: null };
                setFilters(updated);
                onFiltersChange(updated);
                setCustomRange({ min: '', max: '' });
                setCustomRangeActive(false);
                setActiveCategory(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      );
    } else {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <IconButton onClick={() => setActiveCategory(null)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Date :
          </Typography>
          {predefinedDateRanges.map(label => (
            <Chip
              key={label}
              label={label}
              color={
                currentDateRange && isPredefinedDate(currentDateRange, label)
                  ? 'primary'
                  : 'default'
              }
              onClick={() => {
                const range = getPredefinedDateRange(label);
                if (currentDateRange && isPredefinedDate(currentDateRange, label)) {
                  // Désélection
                  const updated = { ...filters, dateRange: null };
                  setFilters(updated);
                  onFiltersChange(updated);
                } else {
                  const updated = { ...filters, dateRange: range };
                  setFilters(updated);
                  onFiltersChange(updated);
                }
              }}
            />
          ))}
          <Chip
            label="Personnalisé"
            onClick={handleCustomDateEntry}
            onDelete={
              currentDateRange &&
              !predefinedDateRanges.some(l => isPredefinedDate(currentDateRange, l))
                ? () => {
                    const updated = { ...filters, dateRange: null };
                    setFilters(updated);
                    onFiltersChange(updated);
                  }
                : undefined
            }
            color={
              currentDateRange &&
              !predefinedDateRanges.some(l => isPredefinedDate(currentDateRange, l))
                ? 'primary'
                : 'default'
            }
          />
        </Box>
      );
    }
  }

  return null;
};

export default InlineFiltersBar;
