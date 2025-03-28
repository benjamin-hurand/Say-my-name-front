// CustomDateRangeModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField } from '@mui/material';

interface DateRange {
  start: string;
  end: string;
}

interface CustomDateRangeModalProps {
  open: boolean;
  initialRange: DateRange;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}

const CustomDateRangeModal: React.FC<CustomDateRangeModalProps> = ({ open, initialRange, onClose, onApply }) => {
  const [range, setRange] = useState<DateRange>(initialRange);

  useEffect(() => {
    setRange(initialRange);
  }, [initialRange]);

  const handleChange = (field: 'start' | 'end') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setRange({ ...range, [field]: event.target.value });
  };

  const handleApply = () => {
    onApply(range);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Personnaliser la période</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2 }}>
          <TextField
            label="Début"
            type="date"
            value={range.start}
            onChange={handleChange('start')}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Fin"
            type="date"
            value={range.end}
            onChange={handleChange('end')}
            InputLabelProps={{ shrink: true }}
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

export default CustomDateRangeModal;
