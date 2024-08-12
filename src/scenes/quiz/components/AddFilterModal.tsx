import React, { ChangeEvent, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip, Box } from '@mui/material';
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

interface AddFilterModalProps {
    open: boolean;
    attributes: Attribute[];
    onSave: (attribute: Attribute, range: { min: string; max: string }) => void;
    onClose: () => void;
}

export const AddFilterModal: React.FC<AddFilterModalProps> = ({ open, attributes, onSave, onClose }) => {
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    const [range, setRange] = useState({ min: '', max: '' });

    // Handle saving the selected attribute and range.
    const handleSave = () => {
        if (selectedAttribute) {
            onSave(selectedAttribute, range);
        }
        onClose(); // Close the modal after saving
    };

    // Handle range value changes.
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setRange(prev => ({ ...prev, [name]: value }));
    };

    // Handle attribute selection.
    const handleSelectAttribute = (attribute: Attribute) => {
        setSelectedAttribute(attribute);
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

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add a Filter</DialogTitle>
            <DialogContent>
                {/* Render the attribute selection cards */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {renderAttributes()}
                </Box>
                
                {/* Show range inputs only if an attribute is selected */}
                {selectedAttribute && (
                    <>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Min Value"
                            type="number"
                            name="min"
                            value={range.min}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Max Value"
                            type="number"
                            name="max"
                            value={range.max}
                            onChange={handleChange}
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={!selectedAttribute}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
