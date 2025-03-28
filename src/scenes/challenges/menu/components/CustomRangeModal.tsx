// CustomRangeModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Slider, TextField } from '@mui/material';

interface Range {
  min: number;
  max: number;
}

interface CustomRangeModalProps {
  open: boolean;
  label: string;
  initialRange: Range;
  onClose: () => void;
  onApply: (range: Range) => void;
}

const CustomRangeModal: React.FC<CustomRangeModalProps> = ({ open, label, initialRange, onClose, onApply }) => {
  const [range, setRange] = useState<Range>(initialRange);

  useEffect(() => {
    setRange(initialRange);
  }, [initialRange]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setRange({ min: newValue[0], max: newValue[1] });
    }
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange(prev => ({ ...prev, min: Number(e.target.value) }));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange(prev => ({ ...prev, max: Number(e.target.value) }));
  };

  const handleApply = () => {
    onApply(range);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{`Personnaliser le range pour ${label}`}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Slider
            value={[range.min, range.max]}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            min={0}
            max={200}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            label="Min"
            type="number"
            value={range.min}
            onChange={handleMinChange}
            fullWidth
          />
          <TextField
            label="Max"
            type="number"
            value={range.max}
            onChange={handleMaxChange}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleApply} variant="contained">Appliquer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomRangeModal;
