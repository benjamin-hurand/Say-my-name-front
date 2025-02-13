// src/components/OptionCard.tsx
import React from 'react';
import Chip from '@mui/material/Chip';

interface OptionCardProps {
  option: string;
  isSelected: boolean;
  onSelect: (option: string) => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ option, isSelected, onSelect }) => (
  <Chip
    label={option}
    onClick={() => onSelect(option)}
    color={isSelected ? 'primary' : 'default'}
    style={{ margin: 4, cursor: 'pointer' }}
  />
);

export default OptionCard;
