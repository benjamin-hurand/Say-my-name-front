import React from 'react';
import { Chip } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GameSortBy } from '../../../models/commons/Game/GameOptions/GameSortBy.model';

// Helper function to reorder the list.
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

interface DraggableSortingMethodsProps {
  tempSelectedSortingMethods: GameSortBy[];
  setTempSelectedSortingMethods: (methods: GameSortBy[]) => void;
  handleEditSort: (index: number) => void;
  handleDeleteSortingMethod: (id: number) => void;
}

export const DraggableSortingMethods: React.FC<DraggableSortingMethodsProps> = ({
  tempSelectedSortingMethods,
  setTempSelectedSortingMethods,
  handleEditSort,
  handleDeleteSortingMethod,
}) => {
  if (tempSelectedSortingMethods.length === 0) {
    return <Chip label="No sorting method" disabled />;
  }
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newOrder = reorder(
      tempSelectedSortingMethods,
      result.source.index,
      result.destination.index
    );
    setTempSelectedSortingMethods(newOrder);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="sortingMethods" direction="horizontal">
        {(provided) => (
          <div
          style={{
            display: 'flex',
            flexWrap: 'wrap', // Ajoutez ceci pour permettre le passage à la ligne
            gap: '8px',
            marginTop: '8px'
          }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tempSelectedSortingMethods.map((method, index) => (
              <Draggable key={method.id.toString()} draggableId={method.id.toString()} index={index}>
                {(providedDraggable) => (
                  <div
                    ref={providedDraggable.innerRef}
                    {...providedDraggable.draggableProps}
                    {...providedDraggable.dragHandleProps}
                    style={{ ...providedDraggable.draggableProps.style }}
                  >
                    <Chip
                      label={`${method.attribute.name} (${method.order})`}
                      onClick={() => handleEditSort(index)}
                      onDelete={() => handleDeleteSortingMethod(method.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
