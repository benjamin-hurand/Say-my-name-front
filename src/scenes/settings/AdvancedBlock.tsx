import React from "react";
import { Box, Button, Collapse } from "@mui/material";

type AdvancedBlockProps = {
  label?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const AdvancedBlock: React.FC<AdvancedBlockProps> = ({
  label = "Options avancées",
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="advanced-content"
      >
        {open ? "Masquer les options avancées" : label}
      </Button>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box id="advanced-content" sx={{ mt: 1 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AdvancedBlock;
