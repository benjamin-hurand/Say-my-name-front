import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Box,
} from '@mui/material';
import { Attribute } from '../../../models/commons/Attribute';
import { GameFilter } from '../../../models/commons/Game/GameOptions/GameFilter.model';
import { StyledSlider } from './StyledSlider';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const mapNumberToLetter = (num: number): string => (alphabet[num] || '');
const mapLetterToNumber = (letter: string): number => alphabet.indexOf(letter.toUpperCase());

const msPerDay = 24 * 60 * 60 * 1000;
// Convert a YYYY-MM-DD string to a day offset (days since epoch)
const dateStringToDayOffset = (dateString: string): number =>
  Math.floor(new Date(dateString).getTime() / msPerDay);
// Convert a day offset back to an ISO date string (YYYY-MM-DD)
const dayOffsetToISODateString = (dayOffset: number): string => {
  const date = new Date(dayOffset * msPerDay);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// Convert a day offset to a localized date string for slider display.
const dayOffsetToLocalizedDateString = (dayOffset: number, locale = navigator.language): string => {
  const date = new Date(dayOffset * msPerDay);
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

function createNumericMarks(minVal: number, maxVal: number, steps = 5) {
  const rangeLength = maxVal - minVal;
  if (rangeLength <= 0) return [{ value: 0, label: minVal.toString() }];
  const marks = [];
  const stepSize = Math.round(rangeLength / steps);
  for (let i = 0; i < steps; i++) {
    const val = minVal + i * stepSize;
    marks.push({ value: val - minVal, label: val.toString() });
  }
  marks.push({ value: rangeLength, label: maxVal.toString() });
  return marks;
}

function createDateMarks(minDay: number, maxDay: number, steps = 5) {
  const rangeLength = maxDay - minDay;
  if (rangeLength <= 0) return [{ value: 0, label: dayOffsetToLocalizedDateString(minDay) }];
  const marks = [];
  const stepSize = Math.round(rangeLength / steps);
  for (let i = 0; i < steps; i++) {
    const offset = i * stepSize;
    marks.push({ value: offset, label: dayOffsetToLocalizedDateString(minDay + offset) });
  }
  marks.push({ value: rangeLength, label: dayOffsetToLocalizedDateString(maxDay) });
  return marks;
}

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
    sx={{ margin: 1, cursor: 'pointer' }}
  />
);

interface AddFilterModalProps {
  open: boolean;
  // Array of FilterAttribute which includes an Attribute and an "available" flag.
  attributes: Attribute[];
  onSave: (filter: GameFilter) => void;
  onClose: () => void;
  initialFilter?: GameFilter;
  handleDeleteFilter: (filterId: number) => void;
}

const AddFilterModal: React.FC<AddFilterModalProps> = ({
  open,
  attributes,
  onSave,
  onClose,
  initialFilter,
  handleDeleteFilter,
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  // The slider's internal range is stored in "offset" units.
  const [range, setRange] = useState<[number, number]>([0, 25]);
  const [attributeRanges, setAttributeRanges] = useState<{ [attrId: number]: [number, number] }>({});

  // When editing an existing filter, initialize with its attribute and computed range.
  useEffect(() => {
    if (initialFilter) {
      setSelectedAttribute(initialFilter.attribute);
      switch (initialFilter.attribute.type) {
        case 'number': {
          const attrMin = initialFilter.attribute.minValue
            ? parseInt(initialFilter.attribute.minValue, 10)
            : 0;
          const minVal = initialFilter.minValue
            ? parseInt(initialFilter.minValue, 10)
            : attrMin;
          const maxVal = initialFilter.maxValue
            ? parseInt(initialFilter.maxValue, 10)
            : attrMin + 100;
          setRange([minVal - attrMin, maxVal - attrMin]);
          break;
        }
        case 'date': {
          const attrMin = initialFilter.attribute.minValue
            ? dateStringToDayOffset(initialFilter.attribute.minValue)
            : 0;
          const minDay = initialFilter.minValue
            ? dateStringToDayOffset(initialFilter.minValue)
            : attrMin;
          const maxDay = initialFilter.maxValue
            ? dateStringToDayOffset(initialFilter.maxValue)
            : attrMin + 100;
          setRange([minDay - attrMin, maxDay - attrMin]);
          break;
        }
        case 'datetime': {
          // Treat datetime similarly to date (using only the date part)
          const attrMin = initialFilter.attribute.minValue
            ? dateStringToDayOffset(initialFilter.attribute.minValue.substring(0, 10))
            : 0;
          const minDay = initialFilter.minValue
            ? dateStringToDayOffset(initialFilter.minValue.substring(0, 10))
            : attrMin;
          const maxDay = initialFilter.maxValue
            ? dateStringToDayOffset(initialFilter.maxValue.substring(0, 10))
            : attrMin + 100;
          setRange([minDay - attrMin, maxDay - attrMin]);
          break;
        }
        case 'boolean': {
          // Convert 'true'/'false' to numbers (true = 1, false = 0)
          const boolToNumber = (val: string) =>
            val.toLowerCase() === 'true' ? 1 : 0;
          const minBool = initialFilter.minValue
            ? boolToNumber(initialFilter.minValue)
            : 0;
          const maxBool = initialFilter.maxValue
            ? boolToNumber(initialFilter.maxValue)
            : 1;
          setRange([minBool, maxBool]);
          break;
        }
        case 'text':
        default: {
          // For text attributes, assume filter values are letters (A-Z)
          const minLetter = initialFilter.minValue ? initialFilter.minValue : 'A';
          const maxLetter = initialFilter.maxValue ? initialFilter.maxValue : 'Z';
          setRange([mapLetterToNumber(minLetter), mapLetterToNumber(maxLetter)]);
          break;
        }
      }
    } else {
      setSelectedAttribute(null);
      setRange([0, 25]);
    }
  }, [initialFilter, open]);
  

  useEffect(() => {
    console.log('range changed: ', JSON.stringify(range));
  }, [range]);

  useEffect(() => {
    console.log('selected attribute changed: ', JSON.stringify(selectedAttribute));
  }, [selectedAttribute]);

  // Compute the attributes to render.
  // Instead of duplicating the variable declaration, we define it once.
  const attributesToRender = (initialFilter
    ? attributes.find((attr) => attr.id === initialFilter.attribute.id)
      ? attributes
      : [initialFilter.attribute, ...attributes]
    : attributes
  ).sort((a, b) => a.id - b.id);

  const handleSelectAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    if (attributeRanges[attribute.id]) {
      setRange(attributeRanges[attribute.id]);
    } else {
      if (attribute.type === 'number') {
        const attrMin = attribute.minValue ? parseInt(attribute.minValue, 10) : 0;
        const attrMax = attribute.maxValue ? parseInt(attribute.maxValue, 10) : 100;
        setRange([0, Math.max(0, attrMax - attrMin)]);
      } else if (attribute.type === 'date') {
        const attrMin = attribute.minValue ? dateStringToDayOffset(attribute.minValue) : 0;
        const attrMax = attribute.maxValue ? dateStringToDayOffset(attribute.maxValue) : 0;
        setRange([0, Math.max(0, attrMax - attrMin)]);
      } else {
        setRange([0, 25]);
      }
    }
  };

  const getSliderMarks = () => {
    if (!selectedAttribute) return [];
    if (selectedAttribute.type === 'number') {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const attrMax = selectedAttribute.maxValue ? parseInt(selectedAttribute.maxValue, 10) : 100;
      return createNumericMarks(attrMin, attrMax);
    } else if (selectedAttribute.type === 'date') {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      const attrMax = selectedAttribute.maxValue ? dateStringToDayOffset(selectedAttribute.maxValue) : 0;
      return createDateMarks(attrMin, attrMax);
    } else {
      return alphabet.map((letter, index) => ({ value: index, label: letter }));
    }
  };

  const getSliderMax = () => {
    if (!selectedAttribute) return 25;
    if (selectedAttribute.type === 'number') {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const attrMax = selectedAttribute.maxValue ? parseInt(selectedAttribute.maxValue, 10) : 100;
      return Math.max(0, attrMax - attrMin);
    } else if (selectedAttribute.type === 'date') {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      const attrMax = selectedAttribute.maxValue ? dateStringToDayOffset(selectedAttribute.maxValue) : 0;
      return Math.max(0, attrMax - attrMin);
    } else {
      return 25;
    }
  };

  const formatSliderValue = (value: number) => {
    if (!selectedAttribute) return '';
    if (selectedAttribute.type === 'number') {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      return (attrMin + value).toString();
    } else if (selectedAttribute.type === 'date') {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      return dayOffsetToLocalizedDateString(attrMin + value);
    } else {
      return mapNumberToLetter(value);
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const newRange = newValue as [number, number];
    setRange(newRange);
    if (selectedAttribute) {
      setAttributeRanges(prev => ({
        ...prev,
        [selectedAttribute.id]: newRange,
      }));
    }
  };

  const handleMinInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedAttribute) return;
    const input = event.target.value;
    if (selectedAttribute.type === 'number') {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const typedNum = parseInt(input, 10);
      if (!isNaN(typedNum)) {
        setRange([typedNum - attrMin, range[1]]);
      }
    } else if (selectedAttribute.type === 'date') {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      const typedDay = dateStringToDayOffset(input);
      setRange([typedDay - attrMin, range[1]]);
    } else {
      const letterIndex = mapLetterToNumber(input);
      if (letterIndex >= 0 && letterIndex <= 25) {
        setRange([letterIndex, range[1]]);
      }
    }
  };

  const handleMaxInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedAttribute) return;
    const input = event.target.value;
    if (selectedAttribute.type === 'number') {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const typedNum = parseInt(input, 10);
      if (!isNaN(typedNum)) {
        setRange([range[0], typedNum - attrMin]);
      }
    } else if (selectedAttribute.type === 'date') {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      const typedDay = dateStringToDayOffset(input);
      setRange([range[0], typedDay - attrMin]);
    } else {
      const letterIndex = mapLetterToNumber(input);
      if (letterIndex >= 0 && letterIndex <= 25) {
        setRange([range[0], letterIndex]);
      }
    }
  };

  const handleSave = () => {
    if (selectedAttribute) {
      let minValStr: string, maxValStr: string;
      if (selectedAttribute.type === 'number') {
        const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
        minValStr = (attrMin + range[0]).toString();
        maxValStr = (attrMin + range[1]).toString();
      } else if (selectedAttribute.type === 'date') {
        const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
        minValStr = dayOffsetToISODateString(attrMin + range[0]);
        maxValStr = dayOffsetToISODateString(attrMin + range[1]);
      } else {
        minValStr = mapNumberToLetter(range[0]);
        maxValStr = mapNumberToLetter(range[1]);
      }
      const gameFilter: GameFilter = {
        id: selectedAttribute.id,
        attribute: selectedAttribute,
        minValue: minValStr,
        maxValue: maxValStr,
      };
      onSave(gameFilter);
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialFilter) {
      handleDeleteFilter(initialFilter.id);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        style: {
          minWidth: 500,
          overflow: 'visible',
        },
      }}
    >
      <DialogTitle>{initialFilter ? 'Edit Filter' : 'Add a Filter'}</DialogTitle>
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {attributesToRender.map((attr) => (
            <AttributeCard
              key={attr.id}
              attribute={attr}
              isSelected={selectedAttribute?.id === attr.id}
              onSelect={handleSelectAttribute}
            />
          ))}
        </Box>
        {selectedAttribute && (
          <>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <StyledSlider
                value={range}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
                min={0}
                max={getSliderMax()}
                step={1}
                marks={getSliderMarks()}
                valueLabelFormat={formatSliderValue}
                sx={{ width: '80%' }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <TextField
                label="Min"
                type={selectedAttribute.type === 'date' ? 'date' : 'text'}
                value={
                  selectedAttribute.type === 'number'
                    ? ((selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0) + range[0]).toString()
                    : selectedAttribute.type === 'date'
                    ? dayOffsetToISODateString(
                        (selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0) + range[0]
                      )
                    : mapNumberToLetter(range[0])
                }
                onChange={handleMinInputChange}
                sx={{ width: '45%' }}
                InputLabelProps={selectedAttribute.type === 'date' ? { shrink: true } : undefined}
              />
              <TextField
                label="Max"
                type={selectedAttribute.type === 'date' ? 'date' : 'text'}
                value={
                  selectedAttribute.type === 'number'
                    ? ((selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0) + range[1]).toString()
                    : selectedAttribute.type === 'date'
                    ? dayOffsetToISODateString(
                        (selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0) + range[1]
                      )
                    : mapNumberToLetter(range[1])
                }
                onChange={handleMaxInputChange}
                sx={{ width: '45%' }}
                InputLabelProps={selectedAttribute.type === 'date' ? { shrink: true } : undefined}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {initialFilter && (
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

export default AddFilterModal;
