import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Box } from '@mui/material';
import { Attribute } from '../../../models/commons/Attribute';
import { GameSortBy } from '../../../models/commons/Game/GameOptions/GameSortBy.model';

const AttributeCard = ({
  attribute,
  isSelected,
  onSelect,
}: {
  attribute: Attribute;
  isSelected: boolean;
  onSelect: (attribute: Attribute) => void;
}) => (
  <Chip
    label={attribute.name}
    onClick={() => onSelect(attribute)}
    color={isSelected ? 'primary' : 'default'}
    style={{ margin: 4, cursor: 'pointer' }}
  />
);

const OrderCard = ({
  order,
  isSelected,
  onSelect,
}: {
  order: 'ASC' | 'DESC';
  isSelected: boolean;
  onSelect: (order: 'ASC' | 'DESC') => void;
}) => (
  <Chip
    label={order}
    onClick={() => onSelect(order)}
    color={isSelected ? 'primary' : 'default'}
    style={{ margin: 4, cursor: 'pointer' }}
  />
);

interface AddSortModalProps {
  open: boolean;
  availableAttributes: Attribute[];
  onSave: (sortBy: GameSortBy) => void;
  onClose: () => void;
  initialSort?: GameSortBy;
  handleDeleteSort: (sortId: number) => void;
}

export const AddSortModal: React.FC<AddSortModalProps> = ({
  open,
  availableAttributes,
  onSave,
  onClose,
  initialSort,
  handleDeleteSort
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<'ASC' | 'DESC'>('ASC');

  // If in edit mode, prepopulate state with the initial sort values.
  useEffect(() => {
    if (initialSort) {
      setSelectedAttribute(initialSort.attribute);
      setSelectedOrder(initialSort.order);
    }
  }, [initialSort]);

  const handleSave = () => {
    if (selectedAttribute) {
      const sortBy: GameSortBy = {
        id: selectedAttribute.id, // Assuming the attribute id is used as the sort identifier
        attribute: selectedAttribute,
        order: selectedOrder,
      };
      onSave(sortBy);
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialSort) {
      handleDeleteSort(initialSort.id);
    }
    onClose();
  };

  const handleSelectAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
  };

  const handleSelectOrder = (order: 'ASC' | 'DESC') => {
    setSelectedOrder(order);
  };

  const attributesToRender: Attribute[] = (initialSort
    ? availableAttributes.find((attr) => attr.id === initialSort.attribute.id)
      ? availableAttributes
      : [initialSort.attribute, ...availableAttributes]
    : availableAttributes
  ).sort((a, b) => a.id - b.id);

  const renderAttributes = () => {
    return attributesToRender.map((attribute) => (
      <AttributeCard
        key={attribute.id}
        attribute={attribute}
        isSelected={selectedAttribute?.id === attribute.id}
        onSelect={handleSelectAttribute}
      />
    ));
  };

  const renderOrders = () => {
    return ['ASC', 'DESC'].map((order) => (
      <OrderCard
        key={order}
        order={order as 'ASC' | 'DESC'}
        isSelected={selectedOrder === order}
        onSelect={handleSelectOrder}
      />
    ));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialSort ? 'Edit Sorting Method' : 'Add a Sorting Method'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {renderAttributes()}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {renderOrders()}
        </Box>
      </DialogContent>
      <DialogActions>
        {initialSort && (
                  <Button variant="outlined" color="error" onClick={handleDelete}>
                    Delete
                  </Button>
          )}
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!selectedAttribute}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
