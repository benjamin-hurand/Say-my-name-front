import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Box } from '@mui/material';
import { Attribute } from '../../../models/commons/Attribute';
import { GameSortBy } from '../../../models/commons/Game/GameOptions/GameSortBy.model';

const AttributeCard = ({ attribute, isSelected, onSelect }: { attribute: Attribute; isSelected: boolean; onSelect: (attribute: Attribute) => void }) => (
    <Chip
        label={attribute.name}
        onClick={() => onSelect(attribute)}
        color={isSelected ? 'primary' : 'default'}
        style={{ margin: 4, cursor: 'pointer' }}
    />
);

const OrderCard = ({ order, isSelected, onSelect }: { order: 'ASC' | 'DESC'; isSelected: boolean; onSelect: (order: 'ASC' | 'DESC') => void }) => (
    <Chip
        label={order}
        onClick={() => onSelect(order)}
        color={isSelected ? 'primary' : 'default'}
        style={{ margin: 4, cursor: 'pointer' }}
    />
);

interface AddSortModalProps {
    open: boolean;
    attributes: Attribute[];
    onSave: (sortBy: GameSortBy) => void; // Updated to accept a GameSortBy object
    onClose: () => void;
}

export const AddSortModal: React.FC<AddSortModalProps> = ({ open, attributes, onSave, onClose }) => {
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<'ASC' | 'DESC'>('ASC');

    const handleSave = () => {
        if (selectedAttribute) {
            const sortBy: GameSortBy = {
                id: selectedAttribute.id, // Assuming the attribute id is used for the sort id
                attribute: selectedAttribute,
                order: selectedOrder
            };
            onSave(sortBy);
        }
        onClose();
    };

    const handleSelectAttribute = (attribute: Attribute) => {
        setSelectedAttribute(attribute);
    };

    const handleSelectOrder = (order: 'ASC' | 'DESC') => {
        setSelectedOrder(order);
    };

    const renderAttributes = () => {
        return attributes.map((attribute) => (
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
            <DialogTitle>Add a Sorting Method</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {renderAttributes()}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {renderOrders()}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!selectedAttribute}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
