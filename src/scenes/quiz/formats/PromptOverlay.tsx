import React from "react";
import { Box, Typography } from "@mui/material";

export const PromptOverlay: React.FC<{
  prompt?: string | null;
  subtitle?: string | null;
  timed?: boolean;
  timeLimitMs?: number | null;
}> = ({ prompt, subtitle, timed, timeLimitMs }) => {
  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      {prompt && (
        <Typography variant="h6" sx={{ color: "common.white", mb: 0.5 }}>
          {prompt}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
          {subtitle}
        </Typography>
      )}
      {timed && typeof timeLimitMs === "number" && (
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
          Temps limite : {Math.round(timeLimitMs / 1000)}s
        </Typography>
      )}
    </Box>
  );
};
