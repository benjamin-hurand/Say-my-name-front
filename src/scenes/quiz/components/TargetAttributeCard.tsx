// src/components/ModeCard.tsx
import React from 'react';
import Chip from '@mui/material/Chip';
import { Attribute } from '../../../models/commons/Attribute/Attribute';

interface TargetAttributeCardProps {
  attribute: Attribute;
  isSelected: boolean;
  onSelect: (attr: Attribute) => void;
}

const TargetAttributeCard: React.FC<TargetAttributeCardProps> = ({ attribute, isSelected, onSelect }) => (
  <Chip
    label={attribute.name}
    onClick={() => onSelect(attribute)}
    color={isSelected ? 'primary' : 'default'}
    style={{ margin: 4, cursor: 'pointer' }}
  />
);

export default TargetAttributeCard;
