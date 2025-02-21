import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';

export const StyledSlider = styled(Slider)({
  '& .MuiSlider-markLabel': {
    whiteSpace: 'nowrap',  // Prevent breaking
    maxWidth: '40px',      // Limit label width
    textAlign: 'center',   // Center text
    pointerEvents: 'none', // Prevent interaction issues
  },
  '& .MuiSlider-markLabel:first-of-type': {
    transform: 'translateX(15px)',  // Shift first label inward
    textAlign: 'left',
  },
  '& .MuiSlider-markLabel:last-of-type': {
    transform: 'translateX(-15px)', // Shift last label inward
    textAlign: 'right',
  },
  '& .MuiSlider-valueLabel': {
    position: 'absolute',
    top: '-35px', // Moves labels above the slider
    maxWidth: 'fit-content', // Allow expansion when needed
    minWidth: '40px', // Ensure readability
    whiteSpace: 'nowrap',
    overflow: 'visible', // Prevent text cutoff
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'none', // **HIDE by default** (MUI default behavior)
  },
  '& .MuiSlider-thumb:hover .MuiSlider-valueLabel, & .MuiSlider-thumb.Mui-focusVisible .MuiSlider-valueLabel': {
    display: 'block', // **SHOW only when focused or hovered**
  },
  '& .MuiSlider-thumb[data-index="0"] .MuiSlider-valueLabel': {
    left: '0%', // Anchor min label to left side
    transform: 'translateX(-10%)', // Small adjustment
  },
  '& .MuiSlider-thumb[data-index="1"] .MuiSlider-valueLabel': {
    right: '0%', // Anchor max label to right side
    transform: 'translateX(10%)', // Small adjustment
  },
});
