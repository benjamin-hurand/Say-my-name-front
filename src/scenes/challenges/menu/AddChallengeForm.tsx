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
import { CreatedChallengeVersionDto } from "../../../services/dto/CreatedChallengeVersionDto";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuizSession } from "../../../contexts/QuizSessionContext";
import { GameFilter } from "../../../models/commons/Game/GameOptions/GameFilter.model";

/* ------------------ Helpers min/max effectifs ------------------ */
// Récupère les bornes déclaratives (constraint.range) ou observées (stats)
function getEffectiveRangeStrings(attr: Attribute): { minStr: string | null; maxStr: string | null } {
  const rule = attr.constraint?.range;
  const stats = attr.stats;
  const minStr = (rule?.min ?? stats?.observedMin) ?? null;
  const maxStr = (rule?.max ?? stats?.observedMax) ?? null;
  return { minStr, maxStr };
}

function parseNumberOrNull(s: string | null | undefined): number | null {
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Pour DATE/DATETIME, on ne garde que la partie date "YYYY-MM-DD"
function toDateISO(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.length >= 10 ? s.substring(0, 10) : null;
}

/** Domaine interne du slider (en valeurs absolues, transformées ensuite en offset) */
function getAttributeDomain(attr: Attribute): { attrMin: number; attrMax: number } {
  if (attr.type === "NUMBER") {
    const { minStr, maxStr } = getEffectiveRangeStrings(attr);
    const min = parseNumberOrNull(minStr) ?? 0;
    const max = parseNumberOrNull(maxStr) ?? (min + 100);
    return { attrMin: min, attrMax: Math.max(min, max) };
  }
  if (attr.type === "DATE" || attr.type === "DATETIME") {
    const { minStr, maxStr } = getEffectiveRangeStrings(attr);
    const isoMin = toDateISO(minStr);
    const isoMax = toDateISO(maxStr);
    const min = isoMin ? dateStringToDayOffset(isoMin) : 0;
    const max = isoMax ? dateStringToDayOffset(isoMax) : (min + 100);
    return { attrMin: min, attrMax: Math.max(min, max) };
  }
  // TEXT (A..Z)
  return { attrMin: 0, attrMax: 25 };
}

/** Formate une valeur absolue (pour payload GameFilter) */
function formatAbsoluteValueForFilter(attr: Attribute, absVal: number): string {
  if (attr.type === "NUMBER") return String(absVal);
  if (attr.type === "DATE" || attr.type === "DATETIME") return dayOffsetToISODateString(absVal);
  return mapNumberToLetter(absVal);
}

/** Affichage label slider */
function formatSliderLabel(attr: Attribute, baseMin: number, offsetVal: number): string {
  if (attr.type === "NUMBER") return String(baseMin + offsetVal);
  if (attr.type === "DATE" || attr.type === "DATETIME") {
    return dayOffsetToLocalizedDateString(baseMin + offsetVal);
  }
  return mapNumberToLetter(offsetVal);
}

/** Parse la saisie Min/Max utilisateur -> offset */
function parseUserInputToOffset(attr: Attribute, baseMin: number, input: string): number {
  if (attr.type === "NUMBER") {
    const n = Number(input);
    return Number.isFinite(n) ? (n - baseMin) : 0;
  }
  if (attr.type === "DATE" || attr.type === "DATETIME") {
    const day = dateStringToDayOffset(toDateISO(input) ?? "");
    return day - baseMin;
  }
  // TEXT
  const idx = mapLetterToNumber(input);
  return (idx >= 0 && idx <= 25) ? idx : 0;
}
/* --------------------------------------------------------------- */

const AddChallengeForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { filters, modes } = useGlobalData();
  const { sessionOptions } = useQuizSession();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [challengeDescription, setChallengeDescription] = useState<string>("");

  const currentCreatorId: number = user?.id || 0;

  // Filtres
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 25]); // offsets
  const [attributeRanges, setAttributeRanges] = useState<{ [attrId: number]: [number, number] }>({});

  // Pré-remplissage depuis la session
  useEffect(() => {
    if (!sessionOptions) return;

    const firstFilter: GameFilter = sessionOptions.filters[0];
    if (!firstFilter) {
      notifyError("Aucun filtre trouvé");
      return;
    }

    setSelectedMode(sessionOptions.mode);

    const attr: Attribute = firstFilter.attribute;
    if (!attr) {
      notifyError("Aucun attribut trouvé pour le filtre");
      return;
    }
    setSelectedAttribute(attr);

    // Calcule la plage d'offset à partir des valeurs du filtre existant
    const { attrMin, attrMax } = getAttributeDomain(attr);
    let initialRange: [number, number] = [0, 0];

    if (attr.type === "NUMBER") {
      const minVal = parseNumberOrNull(firstFilter.minValue) ?? attrMin;
      const maxVal = parseNumberOrNull(firstFilter.maxValue) ?? attrMax;
      initialRange = [minVal - attrMin, maxVal - attrMin];
    } else if (attr.type === "DATE" || attr.type === "DATETIME") {
      const minDay = firstFilter.minValue ? dateStringToDayOffset(toDateISO(firstFilter.minValue)!) : attrMin;
      const maxDay = firstFilter.maxValue ? dateStringToDayOffset(toDateISO(firstFilter.maxValue)!) : attrMax;
      initialRange = [minDay - attrMin, maxDay - attrMin];
    } else { // TEXT
      const minIdx = mapLetterToNumber(firstFilter.minValue || "A");
      const maxIdx = mapLetterToNumber(firstFilter.maxValue || "Z");
      initialRange = [minIdx, maxIdx];
    }

    setRange(initialRange);
    setAttributeRanges(prev => ({ ...prev, [attr.id]: initialRange }));
  }, [sessionOptions]);

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
      const { attrMin, attrMax } = getAttributeDomain(attribute);
      setRange([0, Math.max(0, attrMax - attrMin)]);
    }
  };

  const getSliderMarks = () => {
    if (!selectedAttribute) return [];
    const { attrMin, attrMax } = getAttributeDomain(selectedAttribute);
    if (selectedAttribute.type === "NUMBER") {
      return createNumericMarks(attrMin, attrMax);
    } else if (selectedAttribute.type === "DATE" || selectedAttribute.type === "DATETIME") {
      return getDateSliderMarks(attrMin, attrMax);
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
    if (!selectedAttribute) return "";
    const { attrMin } = getAttributeDomain(selectedAttribute);
    return formatSliderLabel(selectedAttribute, attrMin, value);
  };

  const handleSliderChange = (_event: any, newValue: number | number[]) => {
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

  // Save
  const handleSaveClick = async () => {
    if (!selectedMode) {
      notifyError("Veuillez sélectionner un mode.");
      return;
    }
    if (!selectedAttribute) {
      notifyError("Veuillez sélectionner un attribut pour le filtre.");
      return;
    }

    const { attrMin } = getAttributeDomain(selectedAttribute);
    const absMin = attrMin + range[0];
    const absMax = attrMin + range[1];

    const addChallengeDto = {
      description: challengeDescription.trim(),
      gameModeId: selectedMode.id,
      attributeFilter: {
        attributeId: selectedAttribute.id,
        minValue: formatAbsoluteValueForFilter(selectedAttribute, absMin),
        maxValue: formatAbsoluteValueForFilter(selectedAttribute, absMax),
      },
      creatorId: user?.id || 0,
    };

    try {
      const createdChallenge: CreatedChallengeVersionDto = await createChallenge(addChallengeDto);
      const seasonNumber = createdChallenge.firstSeasonNumber ?? "inconnue";
      const seasonStartDate = createdChallenge.startDate ?? null;

      const formattedDate = seasonStartDate
        ? new Date(seasonStartDate).toLocaleDateString("fr-FR")
        : "date inconnue";
      const formattedTime = seasonStartDate
        ? new Date(seasonStartDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "heure inconnue";

      notifySuccess(
        `Challenge créé avec succès ! Il sera disponible au début de la saison ${seasonNumber} le ${formattedDate} à ${formattedTime}.`
      );

      setTimeout(() => navigate("/challenges"), 2000);
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          notifyError("Échec : ce challenge existe déjà pour ce filtre/mode.");
        } else if (error.response.status === 400) {
          notifyError("Échec : il y a moins de 10 personnes correspondant à ce filtre.");
        } else {
          notifyError("Une erreur inattendue est survenue lors de la création du challenge.");
        }
      } else {
        notifyError("Impossible de contacter le serveur. Veuillez réessayer plus tard.");
      }
    }
  };

  const goToChallengeMenu = () => navigate("/challenges", { replace: true });

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

        {/* Description */}
        <TextField
          label="Challenge Description (facultatif)"
          variant="outlined"
          value={challengeDescription}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setChallengeDescription(e.target.value)}
          fullWidth
          sx={{ marginTop: "16px" }}
        />

        {/* Filtres */}
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

              {/* Champs Min/Max */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                {(() => {
                  const isDateLike =
                    selectedAttribute.type === "DATE" || selectedAttribute.type === "DATETIME";
                  const { attrMin: baseMin } = getAttributeDomain(selectedAttribute);

                  const minDisplay =
                    selectedAttribute.type === "NUMBER"
                      ? String(baseMin + range[0])
                      : isDateLike
                      ? dayOffsetToISODateString(baseMin + range[0])
                      : mapNumberToLetter(range[0]);

                  const maxDisplay =
                    selectedAttribute.type === "NUMBER"
                      ? String(baseMin + range[1])
                      : isDateLike
                      ? dayOffsetToISODateString(baseMin + range[1])
                      : mapNumberToLetter(range[1]);

                  return (
                    <>
                      <TextField
                        label="Min"
                        type={isDateLike ? "date" : "text"}
                        value={minDisplay}
                        onChange={handleMinInputChange}
                        sx={{ width: "45%" }}
                        InputLabelProps={isDateLike ? { shrink: true } : undefined}
                      />
                      <TextField
                        label="Max"
                        type={isDateLike ? "date" : "text"}
                        value={maxDisplay}
                        onChange={handleMaxInputChange}
                        sx={{ width: "45%" }}
                        InputLabelProps={isDateLike ? { shrink: true } : undefined}
                      />
                    </>
                  );
                })()}
              </Box>
            </>
          )}
        </Box>
      </FormGroup>

      {/* Footer */}
      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", height: "7vh", mt: "15px" }}>
        <Button variant="outlined" className="menu nobg" onClick={goToChallengeMenu} sx={{ mr: "1vw" }}>
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
