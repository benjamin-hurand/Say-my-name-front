// QuizOptions.tsx
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useQuizOptions } from "../../contexts/QuizOptionsContext";
import { GameFilter } from "../../models/commons/Game/GameOptions/GameFilter.model";
import { populationScopes } from "../../models/commons/Game/GameOptions/GamePopulationScope.model";
import { GameRepetitionPattern, repetitionPatterns } from "../../models/commons/Game/GameOptions/GameRepetitionPattern.model";
import { GameSortBy } from "../../models/commons/Game/GameOptions/GameSortBy.model";
import { QuizPreferredFormat } from "../../services/dto/quiz/QuizEnums";

import AddFilterModal from "./components/AddFilterModal";
import { AddSortModal } from "./components/AddSortModal";
import { DraggableSortingMethods } from "./components/DraggableSortingMethods";
import ModeCard from "./components/ModeCard";
import OptionCard from "./components/OptionCard";

const QuizOptions: React.FC = () => {
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const {
    selectedPopulationScope,
    setSelectedPopulationScope,
    tempSelectedPopulationScope,
    setTempSelectedPopulationScope,

    modes,
    selectedMode,
    setSelectedMode,
    tempSelectedMode,
    setTempSelectedMode,

    availableFilters,
    selectedFilters,
    setSelectedFilters,
    tempSelectedFilters,
    setTempSelectedFilters,

    availableSorts,
    selectedSortingMethods,
    setSelectedSortingMethods,
    tempSelectedSortingMethods,
    setTempSelectedSortingMethods,

    selectedRepetitionPattern,
    setSelectedRepetitionPattern,
    tempSelectedRepetitionPattern,
    setTempSelectedRepetitionPattern,

    saveProgress,
    setSaveProgress,

    selectedHelps,
    setSelectedHelps,
    tempSelectedHelps,
    setTempSelectedHelps,

    selectedFormat,
    setSelectedFormat,
    tempSelectedFormat,
    setTempSelectedFormat,

    hasCriticalChanges,
  } = useQuizOptions();

  useEffect(() => {
    // Align temps with committed values at first render
    setTempSelectedMode(selectedMode);
    setTempSelectedFilters(selectedFilters);
    setTempSelectedSortingMethods(selectedSortingMethods);
    setTempSelectedRepetitionPattern(selectedRepetitionPattern ?? repetitionPatterns.optimal);
    setTempSelectedHelps({
      typosFriendly: selectedHelps.typosFriendly,
      initialGiven: selectedHelps.initialGiven,
    });
    setTempSelectedPopulationScope(selectedPopulationScope);
    setTempSelectedFormat(selectedFormat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MODES
  const renderModes = () => {
    return modes.map((mode) => (
      <ModeCard
        key={mode.id}
        mode={mode}
        isSelected={tempSelectedMode?.id === mode.id}
        onSelect={() => setTempSelectedMode(mode)}
      />
    ));
  };

  // FILTERS
  const [editingFilter, setEditingFilter] = useState<GameFilter | undefined>();
  const [openFilterModal, setOpenFilterModal] = useState(false);

  const renderFilters = () => {
    if (tempSelectedFilters.length === 0) return <Chip label="No filters" disabled />;
    return tempSelectedFilters.map((filter, index) => (
      <Chip
        key={index}
        label={`${filter.attribute.name} [${filter.minValue} - ${filter.maxValue}]`}
        onClick={() => handleEditFilter(index)}
        onDelete={() => handleDeleteFilter(filter.id)}
      />
    ));
  };

  const handleSaveFilter = (filter: GameFilter) => {
    if (editingFilter) {
      setTempSelectedFilters((prev) => prev.map((f) => (f.id === editingFilter.id ? filter : f)));
      setEditingFilter(undefined);
    } else {
      setTempSelectedFilters((prev) => [...prev, filter]);
    }
    setOpenFilterModal(false);
  };

  const handleEditFilter = (index: number) => {
    const filterToEdit = tempSelectedFilters[index];
    setEditingFilter(filterToEdit);
    setOpenFilterModal(true);
  };

  const handleDeleteFilter = (filterId: number) => {
    setTempSelectedFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const closeFilterModal = () => {
    setOpenFilterModal(false);
    setEditingFilter(undefined);
  };

  // SORTS
  const [editingSort, setEditingSort] = useState<GameSortBy | undefined>();
  const [openSortModal, setOpenSortModal] = useState(false);

  const handleSaveSortingMethod = (sortBy: GameSortBy) => {
    if (editingSort) {
      setTempSelectedSortingMethods((prev) => prev.map((s) => (s.id === editingSort.id ? sortBy : s)));
      setEditingSort(undefined);
    } else {
      setTempSelectedSortingMethods((prev) => [...prev, sortBy]);
    }
    setOpenSortModal(false);
  };

  const handleEditSort = (index: number) => {
    const sortToEdit = tempSelectedSortingMethods[index];
    setEditingSort(sortToEdit);
    setOpenSortModal(true);
  };

  const handleDeleteSortingMethod = (sortId: number) => {
    setTempSelectedSortingMethods((prev) => prev.filter((s) => s.id !== sortId));
  };

  const closeSortModal = () => {
    setOpenSortModal(false);
    setEditingSort(undefined);
  };

  // REPETITIONS
  const renderRepetitionOptions = () => {
    return Object.keys(repetitionPatterns).map((option) => (
      <Tooltip
        key={option}
        title={
          option.toLowerCase() === "optimal"
            ? "Optimal: scheduling auto selon performance."
            : option.toLowerCase() === "immediate"
            ? "Immediate: repeat rapidement si erreur."
            : "Never: pas de répétition."
        }
      >
        <OptionCard
          option={option.charAt(0).toUpperCase() + option.slice(1)}
          isSelected={tempSelectedRepetitionPattern?.patternName === option.toLowerCase()}
          onSelect={() => handleSelectRepetition(option)}
        />
      </Tooltip>
    ));
  };

  const handleSelectRepetition = (option: string) => {
    const pattern: GameRepetitionPattern = repetitionPatterns[option.toLowerCase() as keyof typeof repetitionPatterns];
    setTempSelectedRepetitionPattern(pattern);
  };

  // HELPS
  const helpOptions: { key: "typosFriendly" | "initialGiven"; label: string }[] = [
    { key: "typosFriendly", label: "Typos friendly" },
    { key: "initialGiven", label: "Initial given" },
  ];

  const renderHelpsOptions = () => {
    return helpOptions.map((option) => (
      <OptionCard
        key={option.key}
        option={option.label}
        isSelected={Boolean(tempSelectedHelps[option.key])}
        onSelect={() => setTempSelectedHelps((prev) => ({ ...prev, [option.key]: !prev[option.key] }))}
      />
    ));
  };

  // FORMATS
  const formatOptions: { value: QuizPreferredFormat; label: string; description: string }[] = [
    { value: "AUTO", label: "Auto", description: "Format choisi automatiquement selon le contexte" },
    { value: "MCQ", label: "QCM", description: "Questions à choix multiples" },
    { value: "TEXT_INPUT", label: "Texte", description: "Saisie libre de texte" },
    { value: "CLOZE", label: "Texte à trous", description: "Compléter les lettres manquantes" },
    { value: "HANGMAN", label: "Pendu", description: "Deviner lettre par lettre" },
    { value: "BINARY_SWIPE", label: "Vrai/Faux", description: "Swipe binaire" },
    { value: "ORDERING", label: "Ordre", description: "Remettre dans le bon ordre" },
    { value: "ASSOCIATION", label: "Association", description: "Associer les éléments" },
    { value: "WORD_PUZZLE", label: "Wordle Like", description: "Devinez le mot en utilisant les indices" },
  ];

  const renderFormatOptions = () => {
    return formatOptions.map((option) => (
      <Tooltip key={option.value} title={option.description} placement="top">
        <Box>
          <OptionCard
            option={option.label}
            isSelected={tempSelectedFormat === option.value}
            onSelect={() => setTempSelectedFormat(option.value)}
          />
        </Box>
      </Tooltip>
    ));
  };

  // GLOBAL SAVE
  const handleSaveClick = () => {
    if (hasCriticalChanges) setOpenConfirmDialog(true);
    else goToQuiz(true);
  };

  const handleConfirmSave = () => {
    setOpenConfirmDialog(false);
    goToQuiz(true);
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false);
  };

  const goToQuiz = (saveChanges: boolean) => {
    if (saveChanges) {
      setSelectedPopulationScope(tempSelectedPopulationScope);
      setSelectedMode(tempSelectedMode);
      setSelectedFilters(tempSelectedFilters);
      setSelectedSortingMethods(tempSelectedSortingMethods);
      setSelectedRepetitionPattern(tempSelectedRepetitionPattern ?? repetitionPatterns.optimal);
      setSelectedHelps(tempSelectedHelps);
      setSelectedFormat(tempSelectedFormat);
    } else {
      // revert temps to committed
      setTempSelectedPopulationScope(selectedPopulationScope);
      setTempSelectedMode(selectedMode);
      setTempSelectedFilters(selectedFilters);
      setTempSelectedSortingMethods(selectedSortingMethods);
      setTempSelectedRepetitionPattern(selectedRepetitionPattern ?? repetitionPatterns.optimal);
      setTempSelectedHelps(selectedHelps);
      setTempSelectedFormat(selectedFormat);
    }
    navigate("/training", { replace: true });
  };

  return (
    <Box sx={{ padding: "20px", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <FormGroup sx={{ width: "100%" }}>
        <Divider sx={{ mt: 2 }}>
          <Typography variant="h6">Population</Typography>
        </Divider>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mt: "8px" }}>
          {(["ALL", "FOLLOWED", "UNFOLLOWED"] as const).map((key) => (
            <OptionCard
              key={key}
              option={populationScopes[key].label}
              isSelected={tempSelectedPopulationScope === key}
              onSelect={() => setTempSelectedPopulationScope(key)}
            />
          ))}
        </Box>

        <Divider>
          <Typography variant="h6">Mode</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>{renderModes()}</Box>

        <Divider>
          <Typography variant="h6">Filters</Typography>
        </Divider>

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "16px", width: "100%" }}>
          <Box sx={{ flexGrow: 1, display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>{renderFilters()}</Box>
          <Box sx={{ flexShrink: 0, marginTop: "8px" }}>
            <Tooltip title={availableFilters.length === 0 ? "Aucun filtre disponible" : ""}>
              <span>
                <Button
                  onClick={() => setOpenFilterModal(true)}
                  variant="contained"
                  size="small"
                  disabled={availableFilters.length === 0}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Add filter
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <AddFilterModal
          open={openFilterModal}
          attributes={availableFilters}
          onSave={handleSaveFilter}
          onClose={closeFilterModal}
          initialFilter={editingFilter}
          handleDeleteFilter={handleDeleteFilter}
        />

        <Divider>
          <Typography variant="h6">Sorting Methods</Typography>
        </Divider>

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "16px", width: "100%" }}>
          <Box sx={{ flexGrow: 1, display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            <DraggableSortingMethods
              tempSelectedSortingMethods={tempSelectedSortingMethods}
              setTempSelectedSortingMethods={setTempSelectedSortingMethods}
              handleEditSort={handleEditSort}
              handleDeleteSortingMethod={handleDeleteSortingMethod}
            />
          </Box>
          <Box sx={{ flexShrink: 0, marginTop: "8px" }}>
            <Tooltip title={availableSorts.length === 0 ? "Aucun tri disponible" : ""}>
              <span>
                <Button
                  onClick={() => setOpenSortModal(true)}
                  variant="contained"
                  size="small"
                  sx={{ whiteSpace: "nowrap" }}
                  disabled={availableSorts.length === 0}
                >
                  Add Sorting Method
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <AddSortModal
          open={openSortModal}
          availableAttributes={availableSorts}
          onSave={handleSaveSortingMethod}
          onClose={closeSortModal}
          initialSort={editingSort}
          handleDeleteSort={handleDeleteSortingMethod}
        />

        <Divider>
          <Typography variant="h6">Learning repetition</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>{renderRepetitionOptions()}</Box>

        <Divider sx={{ marginTop: 2, marginBottom: 1 }}>
          <Typography variant="h6">Sauvegarde de la progression</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
          <OptionCard option="Enregistrer la progression" isSelected={saveProgress} onSelect={() => setSaveProgress(true)} />
          <OptionCard option="Ne pas enregistrer" isSelected={!saveProgress} onSelect={() => setSaveProgress(false)} />
        </Box>

        <Divider>
          <Typography variant="h6">Helps</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>{renderHelpsOptions()}</Box>

        <Divider sx={{ marginTop: 2, marginBottom: 1 }}>
          <Typography variant="h6">Format de question</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>{renderFormatOptions()}</Box>
      </FormGroup>

      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", height: "7vh", marginTop: "15px" }}>
        <Button variant="outlined" className="menu nobg" onClick={() => goToQuiz(false)} sx={{ marginRight: "1vw" }}>
          Cancel
        </Button>
        <Button variant="contained" className="menu" onClick={handleSaveClick}>
          Save Options
        </Button>
      </Box>

      <Dialog open={openConfirmDialog} onClose={handleCancelSave} aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <DialogTitle id="confirm-dialog-title">Reset Quiz Progress?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Changer mode / filtres / tris réinitialise la session. Voulez-vous appliquer ces options ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmSave} color="primary" autoFocus>
            Yes, Reset Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizOptions;
