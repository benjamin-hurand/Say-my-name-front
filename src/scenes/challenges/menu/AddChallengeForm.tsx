import { Box, FormGroup, Divider, Typography, Button, TextField } from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModeCard from "../../quiz/components/ModeCard";
import { useGlobalData } from "../../../contexts/GlobalDataContext";
import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";
import { AttributeCard } from "../../quiz/components/AttributeCard";
import { Attribute } from "../../../models/commons/Attribute";
import { dateStringToDayOffset, mapLetterToNumber, createNumericMarks, createDateMarks, alphabet, dayOffsetToLocalizedDateString, mapNumberToLetter, dayOffsetToISODateString, getDateSliderMarks } from "../../quiz/components/FilterChoiceUtils";
import { StyledSlider } from "../../quiz/components/StyledSlider";

// AddChallenge.tsx
const AddChallengeForm: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  const { filters, modes } = useGlobalData();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // MODES
  const renderModes = () => {
      return modes.map((mode) => (
          <ModeCard
              key={mode.id}
              mode={mode}
              isSelected={selectedMode?.id === mode.id}
              onSelect={() => setSelectedMode(mode)}
          />
      ));
  };

  const handleSaveClick = () => {
    goToChallengeMenu(true);
  };

  const goToChallengeMenu = (saveChanges: boolean = false) => {
    if (saveChanges) {
      // on sauvegarde
    } else {
      // on sauvegarde pas
    }
    navigate('/challenges' , { replace: true });
  }

  // FILTER CHOICE
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
    // The slider's internal range is stored in "offset" units.
    const [range, setRange] = useState<[number, number]>([0, 25]);
    const [attributeRanges, setAttributeRanges] = useState<{ [attrId: number]: [number, number] }>({});
  
    useEffect(() => {
      // console.log('range changed: ', JSON.stringify(range));
    }, [range]);
  
    useEffect(() => {
      // console.log('selected attribute changed: ', JSON.stringify(selectedAttribute));
    }, [selectedAttribute]);
  
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
        return getDateSliderMarks(attrMin, attrMax);  // Appel de la nouvelle fonction pour les dates
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
  // END FILTER CHOICE

  return (
    <Box
      sx={{
        padding: '20px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <FormGroup sx={{ width: '100%' }}>
        {/* Mode */}
        <Divider>
          <Typography variant="h6">Mode</Typography>
        </Divider>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {renderModes()}
        </Box>

        {/* Filters */}
        <Divider>
          <Typography variant="h6">Filters</Typography>
        </Divider>
        {/* 
          Sépare la zone des chips (avec flexWrap) et le bouton (avec whiteSpace: 'nowrap').
        */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {/* Chips des filtres */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filters.map((filter) => (
            <AttributeCard
              key={filter.id}
              attribute={filter}
              isSelected={selectedAttribute?.id === filter.id}
              onSelect={handleSelectAttribute}
            />
          ))}
        </Box>

        {/* Slider */}
        {selectedAttribute && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
        )}

        {/* Inputs Min et Max */}
        {selectedAttribute && (
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
        )}
      </Box>

      </FormGroup>
      {/* Footer Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: '7vh',
          marginTop: '15px',
        }}
      >
        <Button
          variant="outlined"
          className="menu nobg"
          onClick={() => goToChallengeMenu(false)}
          sx={{ marginRight: '1vw' }}
        >
          Cancel
        </Button>
        <Button variant="contained" className="menu" onClick={handleSaveClick}>
          Create challenge
        </Button>
      </Box>
    </Box>
  );
};

export default AddChallengeForm;
