// InlineSortBar.tsx
import React, { useState, useEffect } from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { SortCriterion } from './SortModal';

const reorderCriteria = (criteria: SortCriterion[]): SortCriterion[] => {
  const active = criteria.filter(c => c.order !== null);
  const inactive = criteria.filter(c => c.order === null);
  return [...active, ...inactive];
};

interface InlineSortBarProps {
  criteria: SortCriterion[];
  onCriteriaChange: (criteria: SortCriterion[]) => void;
  onBack: () => void;
}

const InlineSortBar: React.FC<InlineSortBarProps> = ({ criteria, onCriteriaChange, onBack }) => {
  const [localCriteria, setLocalCriteria] = useState<SortCriterion[]>(criteria);

  useEffect(() => {
    setLocalCriteria(criteria);
  }, [criteria]);

  const toggleChip = (id: string) => {
    setLocalCriteria(prev => {
      const newCriteria = prev.map(c => {
        if (c.id === id) {
          let newOrder: 'asc' | 'desc' | null;
          if (c.order === null) {
            newOrder = 'desc';
          } else if (c.order === 'desc') {
            newOrder = 'asc';
          } else {
            newOrder = null;
          }
          return { ...c, order: newOrder };
        }
        return c;
      });
      const reordered = reorderCriteria(newCriteria);
      onCriteriaChange(reordered);
      return reordered;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const activeCriteria = localCriteria.filter(c => c.order !== null);
    const inactiveCriteria = localCriteria.filter(c => c.order === null);
    const newActive = Array.from(activeCriteria);
    const [removed] = newActive.splice(result.source.index, 1);
    newActive.splice(result.destination.index, 0, removed);
    const updated = [...newActive, ...inactiveCriteria];
    setLocalCriteria(updated);
    onCriteriaChange(updated);
  };

  const getChipIcon = (criterion: SortCriterion) => {
    if (criterion.order === 'asc') return <ArrowUpwardIcon fontSize="small" />;
    if (criterion.order === 'desc') return <ArrowDownwardIcon fontSize="small" />;
    return <UnfoldMoreIcon fontSize="small" />;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton onClick={onBack}>
        <ArrowBackIcon />
      </IconButton>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="activeCriteria" direction="horizontal">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ display: 'flex', gap: 1 }}
            >
              {localCriteria.filter(c => c.order !== null).map((criterion, index) => (
                <Draggable key={criterion.id} draggableId={criterion.id} index={index}>
                  {(provided) => (
                    <Chip
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      label={criterion.label}
                      icon={getChipIcon(criterion)}
                      onClick={() => toggleChip(criterion.id)}
                      color="primary"
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      {localCriteria.filter(c => c.order === null).map(criterion => (
        <Chip
          key={criterion.id}
          label={criterion.label}
          icon={getChipIcon(criterion)}
          onClick={() => toggleChip(criterion.id)}
        />
      ))}
    </Box>
  );
};

export default InlineSortBar;
