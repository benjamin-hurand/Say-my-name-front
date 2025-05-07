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
import { ChallengeFilters } from './FilterAndSortBar.types';
import { useGlobalData } from '../../../../contexts/GlobalDataContext';
import { Attribute } from '../../../../models/commons/Attribute';
import { getUserPerformances, UserPerformanceDto } from '../../../../services/business/challenges/userPerformance.service';

type FilterCategory =
  | 'mode'
  | 'performance'
  | 'panel'
  | 'participantsRange'
  | 'questionsRange'
  | 'dateRange'
  | null;

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
  onBack: () => void; // Retour à la vue principale
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
  const { modes, filters } = useGlobalData();
  
  const [performances, setPerformances] = useState<UserPerformanceDto[]>([]);
  
  // On utilise un state local pour gérer les filtres en cours de modification
  const [localFilters, setLocalFilters] = useState<ChallengeFilters>(initialFilters);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(null);
  // Pour la saisie personnalisée des ranges (participants, questions, date)
  const [customRange, setCustomRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [customRangeActive, setCustomRangeActive] = useState<boolean>(false);
  // Pour la gestion du panel (filtre d'attribut)
  const [activePanelAttribute, setActivePanelAttribute] = useState<Attribute | null>(null);
  const [panelRange, setPanelRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  useEffect(() => {
      (async () => {
        try {
          const fetched = await getUserPerformances();
          setPerformances(fetched);
        } catch (error) {
          console.error("Erreur récupération des performances :", error);
        }
      })();
    }, []);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const resetFilters = () => {
    setLocalFilters(initialFilters);
    onFiltersChange(initialFilters);
  };

  // Liste des catégories sous forme de chips (niveau B)
  const chipsData: ChipData[] = [
    { label: 'Mode', category: 'mode' },
    { label: 'Performance', category: 'performance' },
    { label: 'Panel', category: 'panel' },
    { label: 'Participants', category: 'participantsRange' },
    { label: 'Questions', category: 'questionsRange' },
    { label: 'Date', category: 'dateRange' },
  ];

  // Vue principale : résumé par catégorie
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
                  ? localFilters.gameModeIds.length > 0
                    ? 'primary'
                    : 'default'
                  : chip.category === 'performance'
                  ? localFilters.userPerformances.length > 0
                    ? 'primary'
                    : 'default'
                  : chip.category === 'panel'
                  ? localFilters.attributeFilter !== null
                    ? 'primary'
                    : 'default'
                  : chip.category === 'participantsRange'
                  ? localFilters.participantsRangeMin !== null && localFilters.participantsRangeMax !== null
                    ? 'primary'
                    : 'default'
                  : chip.category === 'questionsRange'
                  ? localFilters.questionsRangeMin !== null && localFilters.questionsRangeMax !== null
                    ? 'primary'
                    : 'default'
                  : chip.category === 'dateRange'
                  ? localFilters.dateRangeMin !== null && localFilters.dateRangeMax !== null
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

  // Vue pour la catégorie Mode
  if (activeCategory === 'mode') {
    const selected = localFilters.gameModeIds;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => setActiveCategory(null)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Mode :
        </Typography>
        {modes.map((mode) => (
          <Chip
            key={mode.id}
            label={mode.title}
            color={selected.includes(mode.id) ? 'primary' : 'default'}
            onClick={() => {
              const newSelected = selected.includes(mode.id)
                ? selected.filter((id) => id !== mode.id)
                : [...selected, mode.id];
              const updated = { ...localFilters, gameModeIds: newSelected };
              setLocalFilters(updated);
              onFiltersChange(updated);
            }}
          />
        ))}
      </Box>
    );
  }

  // Vue pour la catégorie Performance
  if (activeCategory === 'performance') {
    const selected = localFilters.userPerformances;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => setActiveCategory(null)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Performance :
        </Typography>
        {performances.map((perf) => (
          <Chip
            key={perf.key}
            label={perf.label}
            color={selected.includes(perf.key) ? 'primary' : 'default'}
            onClick={() => {
              const newSelected = selected.includes(perf.key)
                ? selected.filter((item) => item !== perf.key)
                : [...selected, perf.key];
              const updated = { ...localFilters, userPerformances: newSelected };
              setLocalFilters(updated);
              onFiltersChange(updated);
            }}
          />
        ))}
      </Box>
    );
  }

  // Vue pour la catégorie Panel (filtre d'attribut unique)
  if (activeCategory === 'panel') {
    if (activePanelAttribute) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setActivePanelAttribute(null)}>
            <ArrowBackIcon />
          </IconButton>
          <TextField
            label="Min"
            value={panelRange.min}
            onChange={(e) => setPanelRange({ ...panelRange, min: e.target.value })}
            size="small"
            type={
              activePanelAttribute.type === 'number'
                ? 'number'
                : activePanelAttribute.type === 'date'
                ? 'date'
                : 'text'
            }
            InputLabelProps={activePanelAttribute.type === 'date' ? { shrink: true } : {}}
          />
          <TextField
            label="Max"
            value={panelRange.max}
            onChange={(e) => setPanelRange({ ...panelRange, max: e.target.value })}
            size="small"
            type={
              activePanelAttribute.type === 'number'
                ? 'number'
                : activePanelAttribute.type === 'date'
                ? 'date'
                : 'text'
            }
            InputLabelProps={activePanelAttribute.type === 'date' ? { shrink: true } : {}}
          />
          <Chip
            label="OK"
            color="primary"
            onClick={() => {
              if (panelRange.min !== '' && panelRange.max !== '') {
                const newAttributeFilter = {
                  attributeId: activePanelAttribute.id,
                  minValue: panelRange.min,
                  maxValue: panelRange.max,
                };
                const updated = { ...localFilters, attributeFilter: newAttributeFilter };
                setLocalFilters(updated);
                onFiltersChange(updated);
                setActivePanelAttribute(null);
                setPanelRange({ min: '', max: '' });
              }
            }}
          />
          <IconButton onClick={() => setActivePanelAttribute(null)}>
            <CloseIcon />
          </IconButton>
        </Box>
      );
    } else {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setActiveCategory(null)}>
            <ArrowBackIcon />
          </IconButton>
          <Stack direction="row" spacing={1}>
            {filters.map((attribute) => (
              <Chip
                key={attribute.id}
                label={attribute.name}
                color={
                  localFilters.attributeFilter && localFilters.attributeFilter.attributeId === attribute.id
                    ? 'primary'
                    : 'default'
                }
                onClick={() => {
                  setActivePanelAttribute(attribute);
                  if (localFilters.attributeFilter && localFilters.attributeFilter.attributeId === attribute.id) {
                    setPanelRange({ min: localFilters.attributeFilter.minValue, max: localFilters.attributeFilter.maxValue });
                  } else {
                    setPanelRange({ min: '', max: '' });
                  }
                }}
              />
            ))}
          </Stack>
        </Box>
      );
    }
  }

  // Vue pour la catégorie Participants
  if (activeCategory === 'participantsRange') {
    const predefined = participantsPredefined;
    const currentRange =
      localFilters.participantsRangeMin !== null && localFilters.participantsRangeMax !== null
        ? { min: localFilters.participantsRangeMin, max: localFilters.participantsRangeMax }
        : null;
    const isCustom =
      currentRange &&
      !predefined.some(
        (item) => currentRange.min === item.range.min && currentRange.max === item.range.max
      );
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
                  const updated = { ...localFilters, participantsRangeMin: range.min, participantsRangeMax: range.max };
                  setLocalFilters(updated);
                  onFiltersChange(updated);
                  setCustomRangeActive(false);
                  setActiveCategory(null);
                }
              }}
            />
            <IconButton
              onClick={() => {
                const updated = { ...localFilters, participantsRangeMin: null, participantsRangeMax: null };
                setLocalFilters(updated);
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
            Participants :
          </Typography>
          {predefined.map((item) => (
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
                  const updated = { ...localFilters, participantsRangeMin: null, participantsRangeMax: null };
                  setLocalFilters(updated);
                  onFiltersChange(updated);
                } else {
                  const updated = { ...localFilters, participantsRangeMin: item.range.min, participantsRangeMax: item.range.max };
                  setLocalFilters(updated);
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
                    const updated = { ...localFilters, participantsRangeMin: null, participantsRangeMax: null };
                    setLocalFilters(updated);
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

  // Vue pour la catégorie Questions
  if (activeCategory === 'questionsRange') {
    const predefined = questionsPredefined;
    const currentRange =
      localFilters.questionsRangeMin !== null && localFilters.questionsRangeMax !== null
        ? { min: localFilters.questionsRangeMin, max: localFilters.questionsRangeMax }
        : null;
    const isCustom =
      currentRange &&
      !predefined.some(
        (item) => currentRange.min === item.range.min && currentRange.max === item.range.max
      );
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
                  const updated = { ...localFilters, questionsRangeMin: range.min, questionsRangeMax: range.max };
                  setLocalFilters(updated);
                  onFiltersChange(updated);
                  setCustomRangeActive(false);
                  setActiveCategory(null);
                }
              }}
            />
            <IconButton
              onClick={() => {
                const updated = { ...localFilters, questionsRangeMin: null, questionsRangeMax: null };
                setLocalFilters(updated);
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
            Questions :
          </Typography>
          {predefined.map((item) => (
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
                  const updated = { ...localFilters, questionsRangeMin: null, questionsRangeMax: null };
                  setLocalFilters(updated);
                  onFiltersChange(updated);
                } else {
                  const updated = { ...localFilters, questionsRangeMin: item.range.min, questionsRangeMax: item.range.max };
                  setLocalFilters(updated);
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
                    const updated = { ...localFilters, questionsRangeMin: null, questionsRangeMax: null };
                    setLocalFilters(updated);
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

  // Vue pour la catégorie Date
  if (activeCategory === 'dateRange') {
    const currentDateRange =
      localFilters.dateRangeMin !== null && localFilters.dateRangeMax !== null
        ? { start: localFilters.dateRangeMin, end: localFilters.dateRangeMax }
        : null;
    const handleCustomDateEntry = () => {
      if (currentDateRange && !predefinedDateRanges.some((l) => isPredefinedDate(currentDateRange, l))) {
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
                  const updated = { 
                    ...localFilters, 
                    dateRangeMin: customRange.min, 
                    dateRangeMax: customRange.max 
                  };
                  setLocalFilters(updated);
                  onFiltersChange(updated);
                  setCustomRangeActive(false);
                  setActiveCategory(null);
                }
              }}
            />
            <IconButton
              onClick={() => {
                const updated = { ...localFilters, dateRangeMin: null, dateRangeMax: null };
                setLocalFilters(updated);
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
          {predefinedDateRanges.map((label) => (
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
                  const updated = { ...localFilters, dateRangeMin: null, dateRangeMax: null };
                  setLocalFilters(updated);
                  onFiltersChange(updated);
                } else {
                  const updated = { ...localFilters, dateRangeMin: range.start, dateRangeMax: range.end };
                  setLocalFilters(updated);
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
              !predefinedDateRanges.some((l) => isPredefinedDate(currentDateRange, l))
                ? () => {
                    const updated = { ...localFilters, dateRangeMin: null, dateRangeMax: null };
                    setLocalFilters(updated);
                    onFiltersChange(updated);
                  }
                : undefined
            }
            color={
              currentDateRange &&
              !predefinedDateRanges.some((l) => isPredefinedDate(currentDateRange, l))
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
