// src/components/ModeCard.tsx
import React from 'react';
import Chip from '@mui/material/Chip';
import { GameMode } from '../../../models/commons/Game/GameMode/GameMode.model';

interface ModeCardProps {
  mode: GameMode;
  isSelected: boolean;
  onSelect: (mode: GameMode) => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ mode, isSelected, onSelect }) => (
  <Chip
    label={mode.title}
    onClick={() => onSelect(mode)}
    color={isSelected ? 'primary' : 'default'}
    style={{ margin: 4, cursor: 'pointer' }}
  />
);

export default ModeCard;
