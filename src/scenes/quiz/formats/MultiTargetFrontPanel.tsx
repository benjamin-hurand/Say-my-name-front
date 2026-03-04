import React from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { ItemDto } from "../../../services/dto/quiz/QuizQuestionDto";
import { PromptOverlay } from "./PromptOverlay";

export const MultiTargetFrontPanel: React.FC<{
  color: string;
  items: ItemDto[];
  prompt?: string | null;
  subtitle?: string | null;
  timed?: boolean;
  timeLimitMs?: number | null;
}> = ({ color, items, prompt, subtitle, timed, timeLimitMs }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 20% 20%, ${color}33, rgba(0,0,0,0.65))`,
      }}
    >
      <PromptOverlay prompt={prompt} subtitle={subtitle} timed={timed} timeLimitMs={timeLimitMs} />
      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <Box sx={{ overflow: "auto", mt: 1 }}>
        <Stack spacing={1}>
          {items.map((it) => (
            <Box
              key={it.personId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(0,0,0,0.25)",
              }}
            >
              {it.photoUrl ? (
                <img src={it.photoUrl} alt={it.label ?? ""} style={{ width: 48, height: 48, borderRadius: 2, objectFit: "cover" }} />
              ) : (
                <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)" }} />
              )}
              <Typography sx={{ color: "common.white", fontWeight: 600 }}>{it.label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
