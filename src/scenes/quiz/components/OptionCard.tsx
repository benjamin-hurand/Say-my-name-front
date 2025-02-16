// src/components/OptionCard.tsx
import React from 'react';
import Chip from '@mui/material/Chip';

interface OptionCardProps {
  option: string;
  isSelected: boolean;
  onSelect: (option: string) => void;
}

const OptionCard: React.FC<OptionCardProps> = React.forwardRef<HTMLDivElement, OptionCardProps>(
  ({ option, isSelected, onSelect, ...props }, ref) => (
    <Chip
      ref={ref}
      label={option}
      onClick={() => onSelect(option)}
      color={isSelected ? 'primary' : 'default'}
      style={{ margin: 4, cursor: 'pointer' }}
      {...props}  // Spread the rest of the props to the Chip component
    />
  )
);

OptionCard.displayName = 'OptionCard'; // Adding display name for debugging

export default OptionCard;

