import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Box } from '@mui/material';
import { Attribute } from '../../../models/commons/Attribute';

// The AttributeCard component represents each attribute as a pill card.
const AttributeCard = ({ attribute, isSelected, onSelect }: { attribute: Attribute; isSelected: boolean; onSelect: (attribute: Attribute) => void }) => (
    <Chip
        label={attribute.name}
        onClick={() => onSelect(attribute)}
        color={isSelected ? 'primary' : 'default'}
        style={{ margin: 4, cursor: 'pointer' }}
    />
);

// The OrderCard component represents each order (ASC or DESC) as a pill card.
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
    onSave: (attribute: Attribute, order: 'ASC' | 'DESC') => void;
    onClose: () => void;
}

export const AddSortModal: React.FC<AddSortModalProps> = ({ open, attributes, onSave, onClose }) => {
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<'ASC' | 'DESC'>('ASC');

    // Handle saving the selected attribute and order.
    const handleSave = () => {
        if (selectedAttribute) {
            onSave(selectedAttribute, selectedOrder);
        }
        onClose(); // Close the modal after saving
    };

    // Handle attribute selection.
    const handleSelectAttribute = (attribute: Attribute) => {
        setSelectedAttribute(attribute);
    };

    // Handle order selection.
    const handleSelectOrder = (order: 'ASC' | 'DESC') => {
        setSelectedOrder(order);
    };

    // Render the attribute cards.
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

    // Render the order cards.
    const renderOrders = () => {
        return ['ASC', 'DESC'].map((order) => (
            <OrderCard
                key={order}
                order={order as 'ASC' | 'DESC'} // Use a type assertion here
                isSelected={selectedOrder === order}
                onSelect={handleSelectOrder}
            />
        ));
    };


    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add a Sorting Method</DialogTitle>
            <DialogContent>
                {/* Render the attribute selection cards */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {renderAttributes()}
                </Box>

                {/* Render the order selection cards */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {renderOrders()}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={!selectedAttribute}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
