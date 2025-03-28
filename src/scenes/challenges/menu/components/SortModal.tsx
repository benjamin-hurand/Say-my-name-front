// SortModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Chip 
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

export interface SortCriterion {
  id: string;
  label: string;
  // 'asc' ou 'desc' signifie que le critère est actif, null = inactif (ordre naturel)
  order: 'asc' | 'desc' | null;
}

interface SortModalProps {
  open: boolean;
  initialCriteria: SortCriterion[];
  onClose: () => void;
  onApply: (activeCriteria: SortCriterion[]) => void;
}

// Réordonne les critères pour placer les actifs à gauche et les inactifs à droite
const reorderCriteria = (criteria: SortCriterion[]): SortCriterion[] => {
  const active = criteria.filter(c => c.order !== null);
  const inactive = criteria.filter(c => c.order === null);
  return [...active, ...inactive];
};

const SortModal: React.FC<SortModalProps> = ({ open, initialCriteria, onClose, onApply }) => {
  const [criteria, setCriteria] = useState<SortCriterion[]>([]);

  useEffect(() => {
    // Si aucun critère n'est actif, activer "Date de création" (id "createdAt") en mode desc par défaut
    const hasActive = initialCriteria.some(c => c.order !== null);
    let processedCriteria = initialCriteria.map(c => ({ ...c }));
    if (!hasActive) {
      processedCriteria = processedCriteria.map(c => {
        if (c.id === 'createdAt') {
          return { ...c, order: 'desc' };
        }
        return { ...c, order: null };
      });
    }
    setCriteria(reorderCriteria(processedCriteria));
  }, [initialCriteria]);

  // Cycle d'état pour chaque chip : inactif → desc → asc → inactif
  const toggleChip = (id: string) => {
    setCriteria(prev => {
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
      return reorderCriteria(newCriteria);
    });
  };

  // Drag & drop uniquement sur les critères actifs
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const activeCriteria = criteria.filter(c => c.order !== null);
    const inactiveCriteria = criteria.filter(c => c.order === null);
    const newActive = Array.from(activeCriteria);
    const [removed] = newActive.splice(result.source.index, 1);
    newActive.splice(result.destination.index, 0, removed);
    setCriteria([...newActive, ...inactiveCriteria]);
  };

  // Retourne l'icône associée à l'état du critère
  const getChipIcon = (criterion: SortCriterion) => {
    if (criterion.order === 'asc') return <ArrowUpwardIcon fontSize="small" />;
    if (criterion.order === 'desc') return <ArrowDownwardIcon fontSize="small" />;
    return <UnfoldMoreIcon fontSize="small" />;
  };

  // Sépare les critères actifs et inactifs
  const activeCriteria = criteria.filter(c => c.order !== null);
  const inactiveCriteria = criteria.filter(c => c.order === null);

  const handleApply = () => {
    onApply(criteria);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Options de tri</DialogTitle>
      <DialogContent>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 1, 
            flexWrap: 'wrap' 
          }}
        >
          {/* Section des critères actifs (draggables) */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="activeCriteria" direction="horizontal">
              {(provided) => (
                <Box 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
                >
                  {activeCriteria.map((criterion, index) => (
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

          {/* Section des critères inactifs (non draggables) */}
          {inactiveCriteria.map((criterion) => (
            <Chip
              key={criterion.id}
              label={criterion.label}
              icon={getChipIcon(criterion)}
              onClick={() => toggleChip(criterion.id)}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleApply} variant="contained">Appliquer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SortModal;
