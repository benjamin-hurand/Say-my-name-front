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
  getDateSliderMarks,
  dayOffsetToLocalizedDateString,
  mapNumberToLetter,
  dayOffsetToISODateString,
  alphabet
} from "../../quiz/components/FilterChoiceUtils";
import { StyledSlider } from "../../quiz/components/StyledSlider";
import { createChallenge } from "../../../services/business/challenges/challenge.service";
import { AttributeCard } from "../../quiz/components/AttributeCard";

// Import des toasts personnalisés
import { CreatedChallengeVersionDto } from "../../../services/dto/CreatedChallengeVersionDto";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";

const AddChallengeForm: React.FC = () => {
  const navigate = useNavigate();
  const { filters, modes } = useGlobalData();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [challengeDescription, setChallengeDescription] = useState<string>("");

  // Pour l'exemple, on simule l'ID du créateur (remplacez par votre vrai context auth).
  const currentCreatorId = 1;

  // States liés aux filtres
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 25]);
  const [attributeRanges, setAttributeRanges] = useState<{ [attrId: number]: [number, number] }>({});

  useEffect(() => {
    // Si besoin de logs
  }, [range]);

  useEffect(() => {
    // Si besoin de réinitialiser quand l'attribut change
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
      setAttributeRanges((prev) => ({
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

  // Handler principal pour sauvegarder le challenge via l'API
  const handleSaveClick = async () => {
    if (!selectedMode) {
      notifyError("Veuillez sélectionner un mode.");
      return;
    }
    if (!selectedAttribute) {
      notifyError("Veuillez sélectionner un attribut pour le filtre.");
      return;
    }

    // Calcul des bornes min / max en fonction du slider
    let computedMinValue: string;
    let computedMaxValue: string;

    if (selectedAttribute.type === "number") {
      const attrMin = selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0;
      computedMinValue = (attrMin + range[0]).toString().trim();
      computedMaxValue = (attrMin + range[1]).toString().trim();
    } else if (selectedAttribute.type === "date") {
      const attrMin = selectedAttribute.minValue ? dateStringToDayOffset(selectedAttribute.minValue) : 0;
      computedMinValue = dayOffsetToISODateString(attrMin + range[0]).trim();
      computedMaxValue = dayOffsetToISODateString(attrMin + range[1]).trim();
    } else {
      computedMinValue = mapNumberToLetter(range[0]).trim();
      computedMaxValue = mapNumberToLetter(range[1]).trim();
    }

    const trimmedDescription = challengeDescription.trim();

    // Préparation du DTO
    const addChallengeDto = {
      description: trimmedDescription,
      gameModeId: selectedMode.id,
      attributeFilter: {
        attributeId: selectedAttribute.id,
        minValue: computedMinValue,
        maxValue: computedMaxValue,
      },
      creatorId: currentCreatorId,
    };

    try {
      const createdChallenge: CreatedChallengeVersionDto = await createChallenge(addChallengeDto);

      // ---------------
      // Dans l'idéal, votre backend renvoie un DTO avec la saison et la date de début.
      // On suppose ici qu'on peut accéder à `createdChallenge.seasonNumber`, `createdChallenge.seasonStartDate`, etc.
      // ---------------
      const seasonNumber = createdChallenge.firstSeasonNumber ?? "inconnue";
      const seasonStartDate = createdChallenge.startDate ?? null;

      // Exemple simplifié : si vous avez déjà un utilitaire pour formatDate / formatTime, réutilisez-le
      // ou utilisez dayOffsetToLocalizedDateString en supposant que la date soit un offset, etc.
      const formattedDate = seasonStartDate
        ? new Date(seasonStartDate).toLocaleDateString("fr-FR")
        : "date inconnue";
      const formattedTime = seasonStartDate
        ? new Date(seasonStartDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "heure inconnue";

      notifySuccess(
        `Challenge créé avec succès ! Il sera disponible au début de la saison ${seasonNumber} le ${formattedDate} à ${formattedTime}.`
      );

      // Redirection après un court délai pour laisser le temps de lire le toast
      setTimeout(() => {
        navigate("/challenges");
      }, 2000);
    } catch (error: any) {
      // On teste d’abord le code de statut (409, 400, etc.)
      if (error.response) {
        if (error.response.status === 409) {
          // Conflit => un challenge existe déjà
          notifyError("Échec : ce challenge existe déjà pour ce filtre/mode.");
        } else if (error.response.status === 400) {
          // Mauvaise requête => par exemple, moins de 10 personnes
          notifyError("Échec : il y a moins de 10 personnes correspondant à ce filtre.");
        } else {
          notifyError("Une erreur inattendue est survenue lors de la création du challenge.");
        }
      } else {
        notifyError("Impossible de contacter le serveur. Veuillez réessayer plus tard.");
      }
    }
  };

  const goToChallengeMenu = () => {
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
                      ? (
                          (selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0) + range[0]
                        ).toString()
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
                      ? (
                          (selectedAttribute.minValue ? parseInt(selectedAttribute.minValue, 10) : 0) + range[1]
                        ).toString()
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
          onClick={() => goToChallengeMenu()}
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
