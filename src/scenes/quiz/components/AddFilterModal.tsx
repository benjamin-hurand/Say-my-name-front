import React, { ChangeEvent, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip, Box, Slider } from '@mui/material';
import { Attribute } from '../../../models/commons/Attribute';
import { GameFilter } from '../../../models/commons/Game/GameOptions/GameFilter.model';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const mapNumberToLetter = (num: number): string => alphabet[num];
const mapLetterToNumber = (letter: string): number => alphabet.indexOf(letter);

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
    onSave: (filter: GameFilter) => void;  // Updated to accept a GameFilter object
    onClose: () => void;
}

export const AddFilterModal: React.FC<AddFilterModalProps> = ({ open, attributes, onSave, onClose }) => {
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    const [range, setRange] = useState<[number, number]>([0, 19]); // Default to year range 2005-2024

    const handleSave = () => {
        if (selectedAttribute) {
            const gameFilter: GameFilter = {
                id: selectedAttribute.id,  // Assuming id from the selected attribute can be used
                attribute: selectedAttribute,
                minValue: selectedAttribute.name === 'promotion' ? (range[0] + 2005).toString() : mapNumberToLetter(range[0]),
                maxValue: selectedAttribute.name === 'promotion' ? (range[1] + 2005).toString() : mapNumberToLetter(range[1]),
            };
            onSave(gameFilter);
        }
        onClose();
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setRange(newValue as [number, number]);
    };

    const handleMinInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = selectedAttribute?.name === 'promotion'
            ? parseInt(event.target.value) - 2005
            : mapLetterToNumber(event.target.value.toUpperCase());
        setRange([value, range[1]]);
    };

    const handleMaxInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = selectedAttribute?.name === 'promotion'
            ? parseInt(event.target.value) - 2005
            : mapLetterToNumber(event.target.value.toUpperCase());
        setRange([range[0], value]);
    };

    const handleSelectAttribute = (attribute: Attribute) => {
        setSelectedAttribute(attribute);
        if (attribute.name === 'promotion') {
            setRange([0, 19]); // Year range from 2005 to 2024
        } else {
            setRange([0, 25]); // Default to A-Z range
        }
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

    const getMarksForPromotion = () => {
        // Dynamically select fewer years for marks, e.g., every 4th year
        const years = [];
        for (let i = 0; i <= 19; i += 4) {
            years.push({ value: i, label: (2005 + i).toString() });
        }
        // Always include the first and last year
        if (years[years.length - 1].value !== 19) {
            years.push({ value: 19, label: '2024' });
        }
        return years;
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add a Filter</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {renderAttributes()}
                </Box>

                {selectedAttribute && (
                    <>
                        <Box sx={{ mt: 2 }}>
                            <Slider
                                value={range}
                                onChange={handleSliderChange}
                                valueLabelDisplay="auto"
                                min={0}
                                max={selectedAttribute.name === 'promotion' ? 19 : 25}
                                step={1}
                                marks={selectedAttribute.name === 'promotion' ? getMarksForPromotion() : alphabet.map((letter, index) => ({ value: index, label: letter }))}
                                valueLabelFormat={(value) =>
                                    selectedAttribute.name === 'promotion' ? (2005 + value).toString() : mapNumberToLetter(value)
                                }
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <TextField
                                label="Min"
                                type="text"
                                value={selectedAttribute.name === 'promotion' ? (2005 + range[0]).toString() : mapNumberToLetter(range[0])}
                                onChange={handleMinInputChange}
                                sx={{ width: '45%' }}
                                inputProps={{ maxLength: selectedAttribute.name === 'promotion' ? 4 : 1 }}
                            />
                            <TextField
                                label="Max"
                                type="text"
                                value={selectedAttribute.name === 'promotion' ? (2005 + range[1]).toString() : mapNumberToLetter(range[1])}
                                onChange={handleMaxInputChange}
                                sx={{ width: '45%' }}
                                inputProps={{ maxLength: selectedAttribute.name === 'promotion' ? 4 : 1 }}
                            />
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!selectedAttribute}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
