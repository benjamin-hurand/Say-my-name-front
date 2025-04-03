import React, { ChangeEvent, useEffect, useState } from "react";
import { Box, FormGroup, Divider, Typography, Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ModeCard from "../../quiz/components/ModeCard";
import { useGlobalData } from "../../../contexts/GlobalDataContext";
import { GameMode } from "../../../models/commons/Game/GameMode/GameMode.model";
import { Attribute } from "../../../models/commons/Attribute";
import {
  dateStringToDayOffset,
  mapLetterToNumber,
  createNumericMarks,
  createDateMarks,
  alphabet,
  dayOffsetToLocalizedDateString,
  mapNumberToLetter,
  dayOffsetToISODateString,
  getDateSliderMarks
} from "../../quiz/components/FilterChoiceUtils";
import { StyledSlider } from "../../quiz/components/StyledSlider";
import { createChallenge } from "../../../services/business/challenges/challenge.service";
import { AttributeCard } from "../../quiz/components/AttributeCard";

const AddChallengeForm: React.FC = () => {
  const navigate = useNavigate();
  const { filters, modes } = useGlobalData();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [challengeDescription, setChallengeDescription] = useState<string>("");

  // Pour l'exemple, nous utilisons l'ID du créateur simulé (à remplacer par l'ID réel depuis votre contexte d'authentification)
  const currentCreatorId = 1;

  // FILTER CHOICE STATES
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 25]);
  const [attributeRanges, setAttributeRanges] = useState<{ [attrId: number]: [number, number] }>({});

  useEffect(() => {
    // Vous pouvez ajouter des logs ou traitements supplémentaires ici
  }, [range]);

  useEffect(() => {
    // Logique pour réinitialiser la range si l'attribut change
  }, [selectedAttribute]);

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

  const handleSelectAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    if (attributeRanges[attribute.id]) {
      setRange(attributeRanges[attribute.id]);
    } else {
      if (attribute.type === "number") {
        const attrMin = attribute.minValue ? parseInt(attribute.minValue, 10) : 0;
        const attrMax = attribute.maxValue ? parseInt(attribute.maxValue, 10) : 100;
        setRange([0, Math.max(0, attrMax - attrMin)]);
      } else if (attribute.type === "date") {
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
    if (selectedAttribute.type === "number") {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const attrMax = selectedAttribute.maxValue ? parseInt(selectedAttribute.maxValue, 10) : 100;
      return createNumericMarks(attrMin, attrMax);
    } else if (selectedAttribute.type === "date") {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      const attrMax = selectedAttribute.maxValue ? dateStringToDayOffset(selectedAttribute.maxValue) : 0;
      return getDateSliderMarks(attrMin, attrMax);
    } else {
      return alphabet.map((letter, index) => ({ value: index, label: letter }));
    }
  };

  const getSliderMax = () => {
    if (!selectedAttribute) return 25;
    if (selectedAttribute.type === "number") {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const attrMax = selectedAttribute.maxValue ? parseInt(selectedAttribute.maxValue, 10) : 100;
      return Math.max(0, attrMax - attrMin);
    } else if (selectedAttribute.type === "date") {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      const attrMax = selectedAttribute.maxValue ? dateStringToDayOffset(selectedAttribute.maxValue) : 0;
      return Math.max(0, attrMax - attrMin);
    } else {
      return 25;
    }
  };

  const formatSliderValue = (value: number) => {
    if (!selectedAttribute) return "";
    if (selectedAttribute.type === "number") {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      return (attrMin + value).toString();
    } else if (selectedAttribute.type === "date") {
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
    if (selectedAttribute.type === "number") {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const typedNum = parseInt(input, 10);
      if (!isNaN(typedNum)) {
        setRange([typedNum - attrMin, range[1]]);
      }
    } else if (selectedAttribute.type === "date") {
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
    if (selectedAttribute.type === "number") {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      const typedNum = parseInt(input, 10);
      if (!isNaN(typedNum)) {
        setRange([range[0], typedNum - attrMin]);
      }
    } else if (selectedAttribute.type === "date") {
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

  // Handler pour sauvegarder le challenge via l'API
  const handleSaveClick = async () => {
    // Vérifier que le mode est sélectionné
    if (!selectedMode) {
      alert("Veuillez sélectionner un mode.");
      return;
    }
    // Vérifier que l'attribut de filtre est sélectionné
    if (!selectedAttribute) {
      alert("Veuillez sélectionner un filtre d'attribut.");
      return;
    }
    // Construire l'objet AddChallengeDto
    const addChallengeDto = {
      description: challengeDescription,
      gameModeId: selectedMode.id,
      attributeFilter: {
        attributeId: selectedAttribute.id,
        // Pour cet exemple, on utilise les valeurs brutes de l'attribut
        // Vous pourriez ajuster pour utiliser les valeurs modifiées par le slider si besoin.
        minValue: selectedAttribute.minValue ?? "",
        maxValue: selectedAttribute.maxValue ?? ""
      },
      creatorId: currentCreatorId
    };

    try {
      const createdChallenge = await createChallenge(addChallengeDto);
      console.log("Challenge créé avec succès :", createdChallenge);
      navigate("/challenges", { replace: true });
    } catch (error) {
      console.error("Erreur lors de la création du challenge :", error);
      alert("Erreur lors de la création du challenge.");
    }
  };

  const goToChallengeMenu = (saveChanges: boolean = false) => {
    // Navigation si besoin
    navigate("/challenges", { replace: true });
  };

  return (
    <Box
      sx={{
        padding: "20px",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <FormGroup sx={{ width: "100%" }}>
        {/* Mode */}
        <Divider>
          <Typography variant="h6">Mode</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
          {renderModes()}
        </Box>

        {/* Description du challenge */}
        <TextField
          label="Challenge Description (facultatif)"
          variant="outlined"
          value={challengeDescription}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setChallengeDescription(e.target.value)}
          fullWidth
          sx={{ marginTop: "16px" }}
        />

        {/* Section Filters */}
        <Divider>
          <Typography variant="h6">Filters</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {filters.map((filter) => (
              <AttributeCard
                key={filter.id}
                attribute={filter}
                isSelected={selectedAttribute?.id === filter.id}
                onSelect={handleSelectAttribute}
              />
            ))}
          </Box>
          {selectedAttribute && (
            <>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <StyledSlider
                  value={range}
                  onChange={handleSliderChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={getSliderMax()}
                  step={1}
                  marks={getSliderMarks()}
                  valueLabelFormat={formatSliderValue}
                  sx={{ width: "80%" }}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <TextField
                  label="Min"
                  type={selectedAttribute.type === "date" ? "date" : "text"}
                  value={
                    selectedAttribute.type === "number"
                      ? ((selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0) + range[0]).toString()
                      : selectedAttribute.type === "date"
                      ? dayOffsetToISODateString(
                          (selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0) + range[0]
                        )
                      : mapNumberToLetter(range[0])
                  }
                  onChange={handleMinInputChange}
                  sx={{ width: "45%" }}
                  InputLabelProps={selectedAttribute.type === "date" ? { shrink: true } : undefined}
                />
                <TextField
                  label="Max"
                  type={selectedAttribute.type === "date" ? "date" : "text"}
                  value={
                    selectedAttribute.type === "number"
                      ? ((selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0) + range[1]).toString()
                      : selectedAttribute.type === "date"
                      ? dayOffsetToISODateString(
                          (selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0) + range[1]
                        )
                      : mapNumberToLetter(range[1])
                  }
                  onChange={handleMaxInputChange}
                  sx={{ width: "45%" }}
                  InputLabelProps={selectedAttribute.type === "date" ? { shrink: true } : undefined}
                />
              </Box>
            </>
          )}
        </Box>
      </FormGroup>
      {/* Footer Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          height: "7vh",
          marginTop: "15px",
        }}
      >
        <Button
          variant="outlined"
          className="menu nobg"
          onClick={() => goToChallengeMenu(false)}
          sx={{ marginRight: "1vw" }}
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
