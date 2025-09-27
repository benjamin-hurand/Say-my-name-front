// src/scenes/courses/CreateCourse.tsx
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalData } from '../../contexts/GlobalDataContext';
import { Attribute } from '../../models/commons/Attribute';
import { GameMode } from '../../models/commons/Game/GameMode/GameMode.model';
import { createCourse } from '../../services/business/courses/course.service';
import { CreateCourseDto } from '../../services/dto/courses/CreateCourseDto';
import { notifyError, notifySuccess } from '../../services/notification/toast.service';

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { modes, sorts, populations } = useGlobalData();

  // États locaux
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [sortAttr, setSortAttr] = useState<Attribute | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [selectedPops, setSelectedPops] = useState<number[]>([]);

  // Initialisation
  useEffect(() => {
    if (modes.length) setSelectedMode(modes[0]);
    if (sorts.length) setSortAttr(sorts[0]);
  }, [modes, sorts]);

  // Handlers
  const handleModeChange = (mode: GameMode) => setSelectedMode(mode);
  const handleAttrChange = (e: SelectChangeEvent<number>) => {
    const id = Number(e.target.value);
    const attr = sorts.find(a => a.id === id) || null;
    setSortAttr(attr);
  };
  const toggleOrder = () => setSortOrder(o => (o === 'ASC' ? 'DESC' : 'ASC'));
  const handlePopsChange = (e: SelectChangeEvent<number[]>) => {
    setSelectedPops(e.target.value as number[]);
  };

  const handleCreate = async () => {
    if (!selectedMode || !sortAttr || selectedPops.length === 0) {
      notifyError(t('COURSE_CREATE_FILL_ALL', 'Veuillez tout remplir'));
      return;
    }
    const dto: CreateCourseDto = {
      userId: user!.id,
      gameModeId: selectedMode.id,
      sortingAttributeId: sortAttr.id,
      sortingOrder: sortOrder,
      populationIds: selectedPops,
    };
    try {
      const created = await createCourse(dto);
      notifySuccess(t('COURSE_CREATED', 'Cours créé !'));
      // On redirige vers le quiz
      navigate(`/course/${created.id}/continue`);
    } catch (err: any) {
      notifyError(
        err.response?.data?.message ||
        t('COURSE_CREATE_ERROR', 'Erreur lors de la création du cours')
      );
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        width: '100%',
        maxWidth: '100%',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        {t('COURSE_CREATE_TITLE', 'Nouveau cours')}
      </Typography>

      {/* Choix du mode */}
      <Divider>
        <Typography variant="subtitle1">{t('GAME_MODE', 'Mode')}</Typography>
      </Divider>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {modes.map(m => (
          <Button
            key={m.id}
            variant={selectedMode?.id === m.id ? 'contained' : 'outlined'}
            onClick={() => handleModeChange(m)}
          >
            {m.title}
          </Button>
        ))}
      </Box>

      {/* Tri */}
      <Divider>
        <Typography variant="subtitle1">{t('SORTING', 'Tri')}</Typography>
      </Divider>
      <FormGroup row sx={{ alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="sort-attr-label">{t('ATTRIBUTE', 'Attribut')}</InputLabel>
          <Select
            labelId="sort-attr-label"
            value={sortAttr?.id || ''}
            label={t('ATTRIBUTE', 'Attribut')}
            onChange={handleAttrChange}
          >
            {sorts.map(a => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={toggleOrder}>
          {sortOrder === 'ASC' ? t('ORDER_ASC', 'ASC ↑') : t('ORDER_DESC', 'DESC ↓')}
        </Button>
      </FormGroup>

      {/* Populations */}
      <Divider>
        <Typography variant="subtitle1">{t('POPULATIONS', 'Populations')}</Typography>
      </Divider>
      <FormControl fullWidth>
        <InputLabel id="pop-label">{t('SELECT_POPS', 'Sélectionnez')}</InputLabel>
        <Select
          labelId="pop-label"
          multiple
          value={selectedPops}
          onChange={handlePopsChange}
          input={<OutlinedInput label={t('SELECT_POPS', 'Sélectionnez')} />}
          renderValue={ids => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {ids.map(id => {
                const p = populations.find(p => p.id === id);
                return <Chip key={id} label={p?.title || id} />;
              })}
            </Box>
          )}
        >
          {populations.map(p => (
            <MenuItem key={p.id} value={p.id}>
              {p.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Bouton Créer */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" onClick={handleCreate}>
          {t('CREATE_COURSE', 'Créer le cours')}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateCourse;
