import React from "react";
import { Paper, Typography } from "@mui/material";

const ErrorBanner: React.FC<{ message?: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderColor: "error.main" }}>
      <Typography color="error" variant="body2">{message}</Typography>
    </Paper>
  );
};

export default ErrorBanner;
