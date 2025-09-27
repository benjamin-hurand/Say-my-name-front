import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box,
} from '@mui/material';
import { Attribute } from '../../../models/commons/Attribute';
import { GameFilter } from '../../../models/commons/Game/GameOptions/GameFilter.model';
import { StyledSlider } from './StyledSlider';
import { AttributeCard } from './AttributeCard';
import {
  dateStringToDayOffset, mapLetterToNumber, createNumericMarks, createDateMarks, alphabet,
  mapNumberToLetter, dayOffsetToISODateString, dayOffsetToLocalizedDateString
} from './FilterChoiceUtils';

/** ---------- Helpers de borne effective ---------- */
/** Renvoie la borne “effective” min/max sous forme de string (ISO pour DATE/DATETIME) */
function getEffectiveRangeStrings(attr: Attribute, preferStats = true): { minStr: string | null; maxStr: string | null } {
  const rule = attr.constraint?.range;
  const stats = attr.stats;

  if (preferStats) {
    const minStr = (stats?.observedMin ?? rule?.min) ?? null;
    const maxStr = (stats?.observedMax ?? rule?.max) ?? null;
    return { minStr, maxStr };
  } else {
    const minStr = (rule?.min ?? stats?.observedMin) ?? null;
    const maxStr = (rule?.max ?? stats?.observedMax) ?? null;
    return { minStr, maxStr };
  }
}


function parseNumberOrNull(s: string | null | undefined): number | null {
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toDateISO(s: string | null | undefined): string | null {
  if (!s) return null;
  // On accepte “YYYY-MM-DD” ou “YYYY-MM-DDTHH:mm:ss” -> on prend la partie date
  return s.length >= 10 ? s.substring(0, 10) : null;
}

/** Renvoie les bornes en unités “slider” :
 * - NUMBER -> nombres
 * - DATE/DATETIME -> offsets en jours
 * - TEXT -> indices alphabet (A..Z)
 */
function getAttributeDomain(attr: Attribute): { attrMin: number; attrMax: number } {
  if (attr.type === 'NUMBER') {
    const { minStr, maxStr } = getEffectiveRangeStrings(attr);
    const min = parseNumberOrNull(minStr) ?? 0;
    const max = parseNumberOrNull(maxStr) ?? (min + 100);
    return { attrMin: min, attrMax: Math.max(min, max) };
  }

  if (attr.type === 'DATE' || attr.type === 'DATETIME') {
    const { minStr, maxStr } = getEffectiveRangeStrings(attr);
    const isoMin = toDateISO(minStr);
    const isoMax = toDateISO(maxStr);
    const min = isoMin ? dateStringToDayOffset(isoMin) : 0;
    const max = isoMax ? dateStringToDayOffset(isoMax) : (min + 100);
    return { attrMin: min, attrMax: Math.max(min, max) };
  }

  // TEXT / autres : A..Z
  return { attrMin: 0, attrMax: 25 };
}

/** Convertit une valeur absolue (dans l’unité du type) en string à stocker dans GameFilter */
function formatAbsoluteValueForFilter(attr: Attribute, absVal: number): string {
  if (attr.type === 'NUMBER') return String(absVal);
  if (attr.type === 'DATE' || attr.type === 'DATETIME') return dayOffsetToISODateString(absVal);
  // TEXT
  return mapNumberToLetter(absVal);
}

/** Met à jour l’affichage du label du slider */
function formatSliderLabel(attr: Attribute, baseMin: number, offsetVal: number): string {
  if (attr.type === 'NUMBER') return String(baseMin + offsetVal);
  if (attr.type === 'DATE' || attr.type === 'DATETIME') {
    return dayOffsetToLocalizedDateString(baseMin + offsetVal);
  }
  return mapNumberToLetter(offsetVal);
}

/** Parse la saisie “Min/Max” utilisateur vers offset */
function parseUserInputToOffset(attr: Attribute, baseMin: number, input: string): number {
  if (attr.type === 'NUMBER') {
    const n = Number(input);
    return Number.isFinite(n) ? (n - baseMin) : 0;
  }
  if (attr.type === 'DATE' || attr.type === 'DATETIME') {
    const day = dateStringToDayOffset(toDateISO(input) ?? '');
    return day - baseMin;
  }
  // TEXT
  const idx = mapLetterToNumber(input);
  return (idx >= 0 && idx <= 25) ? idx : 0;
}
/** ---------- Fin helpers ---------- */

interface AddFilterModalProps {
  open: boolean;
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
  // range stocke l’offset par rapport à attrMin calculé
  const [range, setRange] = useState<[number, number]>([0, 25]);
  const [attributeRanges, setAttributeRanges] = useState<{ [attrId: number]: [number, number] }>({});

  // Pré-sélection si on édite un filtre
  useEffect(() => {
    if (initialFilter) {
      setSelectedAttribute(initialFilter.attribute);
      const attr = initialFilter.attribute;
      const { attrMin, attrMax } = getAttributeDomain(attr);

      if (attr.type === 'NUMBER') {
        const minVal = parseNumberOrNull(initialFilter.minValue) ?? attrMin;
        const maxVal = parseNumberOrNull(initialFilter.maxValue) ?? attrMax;
        setRange([minVal - attrMin, maxVal - attrMin]);
      } else if (attr.type === 'DATE' || attr.type === 'DATETIME') {
        const minDay = dateStringToDayOffset(toDateISO(initialFilter.minValue) ?? dayOffsetToISODateString(attrMin));
        const maxDay = dateStringToDayOffset(toDateISO(initialFilter.maxValue) ?? dayOffsetToISODateString(attrMax));
        setRange([minDay - attrMin, maxDay - attrMin]);
      } else { // TEXT
        const minLetter = initialFilter.minValue ?? 'A';
        const maxLetter = initialFilter.maxValue ?? 'Z';
        setRange([mapLetterToNumber(minLetter), mapLetterToNumber(maxLetter)]);
      }
    } else {
      setSelectedAttribute(null);
      setRange([0, 25]);
    }
  }, [initialFilter, open]);

  // Attributs à afficher
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
      const { attrMin, attrMax } = getAttributeDomain(attribute);
      setRange([0, Math.max(0, attrMax - attrMin)]);
    }
  };

  const getSliderMarks = () => {
    if (!selectedAttribute) return [];
    const { attrMin, attrMax } = getAttributeDomain(selectedAttribute);
    if (selectedAttribute.type === 'NUMBER') {
      return createNumericMarks(attrMin, attrMax);
    } else if (selectedAttribute.type === 'DATE' || selectedAttribute.type === 'DATETIME') {
      return createDateMarks(attrMin, attrMax);
    } else {
      return alphabet.map((letter, index) => ({ value: index, label: letter }));
    }
  };

  const getSliderMax = () => {
    if (!selectedAttribute) return 25;
    const { attrMin, attrMax } = getAttributeDomain(selectedAttribute);
    return Math.max(0, attrMax - attrMin);
  };

  const formatSliderValue = (value: number) => {
    if (!selectedAttribute) return '';
    const { attrMin } = getAttributeDomain(selectedAttribute);
    return formatSliderLabel(selectedAttribute, attrMin, value);
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
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
    const { attrMin } = getAttributeDomain(selectedAttribute);
    const offset = parseUserInputToOffset(selectedAttribute, attrMin, event.target.value);
    setRange([offset, range[1]]);
  };

  const handleMaxInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedAttribute) return;
    const { attrMin } = getAttributeDomain(selectedAttribute);
    const offset = parseUserInputToOffset(selectedAttribute, attrMin, event.target.value);
    setRange([range[0], offset]);
  };

  const handleSave = () => {
    if (selectedAttribute) {
      const { attrMin } = getAttributeDomain(selectedAttribute);
      const absMin = attrMin + range[0];
      const absMax = attrMin + range[1];

      const gameFilter: GameFilter = {
        id: selectedAttribute.id,
        attribute: selectedAttribute,
        minValue: formatAbsoluteValueForFilter(selectedAttribute, absMin),
        maxValue: formatAbsoluteValueForFilter(selectedAttribute, absMax),
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
      PaperProps={{ style: { minWidth: 500, overflow: 'visible' } }}
    >
      <DialogTitle>{initialFilter ? 'Edit Filter' : 'Add a Filter'}</DialogTitle>
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
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

            {/* Champs Min/Max */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              {(() => {
                if (!selectedAttribute) return null;

                const isDateLike =
                  selectedAttribute.type === 'DATE' || selectedAttribute.type === 'DATETIME';
                const { attrMin: baseMin } = getAttributeDomain(selectedAttribute);

                const minDisplay =
                  selectedAttribute.type === 'NUMBER'
                    ? String(baseMin + range[0])
                    : isDateLike
                    ? dayOffsetToISODateString(baseMin + range[0])
                    : mapNumberToLetter(range[0]);

                const maxDisplay =
                  selectedAttribute.type === 'NUMBER'
                    ? String(baseMin + range[1])
                    : isDateLike
                    ? dayOffsetToISODateString(baseMin + range[1])
                    : mapNumberToLetter(range[1]);

                return (
                  <>
                    <TextField
                      label="Min"
                      type={isDateLike ? 'date' : 'text'}
                      value={minDisplay}
                      onChange={handleMinInputChange}
                      sx={{ width: '45%' }}
                      InputLabelProps={isDateLike ? { shrink: true } : undefined}
                    />

                    <TextField
                      label="Max"
                      type={isDateLike ? 'date' : 'text'}
                      value={maxDisplay}
                      onChange={handleMaxInputChange}
                      sx={{ width: '45%' }}
                      InputLabelProps={isDateLike ? { shrink: true } : undefined}
                    />
                  </>
                );
              })()}
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
