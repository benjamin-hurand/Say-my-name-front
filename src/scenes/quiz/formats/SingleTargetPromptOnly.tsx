import React from "react";
import { Box } from "@mui/material";
import { PromptOverlay } from "./PromptOverlay";

export const SingleTargetPromptOnly: React.FC<{
  prompt?: string | null;
  subtitle?: string | null;
  timed?: boolean;
  timeLimitMs?: number | null;
}> = ({ prompt, subtitle, timed, timeLimitMs }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        p: 2,
        pointerEvents: "none",
      }}
    >
      <PromptOverlay prompt={prompt} subtitle={subtitle} timed={timed} timeLimitMs={timeLimitMs} />
    </Box>
  );
};
