import React, { useEffect } from "react";
import { Box, Divider, Paper, Typography } from "@mui/material";

export type ResultBannerProps = {
  visible: boolean;
  resultMessage?: string | null;
  yourAnswer?: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
};

export const ResultBanner: React.FC<ResultBannerProps> = ({
  visible,
  resultMessage,
  yourAnswer,
  correctAnswer,
  isCorrect,
}) => {
  if (!visible) return null;

  const effectiveIsCorrect = typeof isCorrect === "boolean" ? isCorrect : (resultMessage ?? "").toLowerCase().includes("correct");

  useEffect(() => {
    if (visible) {
      console.debug("[ResultBanner] overlay pointerEvents: none");
    }
  }, [visible]);

  return (
    <Box
      sx={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 640,
        zIndex: 8,

        // CRITICAL: ne doit jamais capter les clics
        pointerEvents: "none",
      }}
    >
      <Paper
        elevation={16}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "rgba(0,0,0,0.72)",
          border: `2px solid ${effectiveIsCorrect ? "rgba(76,175,80,0.6)" : "rgba(244,67,54,0.6)"}`,
          backdropFilter: "blur(14px)",
          color: "common.white",
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: "1.05rem" }}>
              {resultMessage ?? "Résultat"}
            </Typography>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: effectiveIsCorrect ? "success.main" : "error.main",
                boxShadow: effectiveIsCorrect
                  ? "0 0 16px rgba(76,175,80,0.7)"
                  : "0 0 16px rgba(244,67,54,0.7)",
                flexShrink: 0,
              }}
            />
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1.25 }} />

          <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 180, flex: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem" }}>
                Votre réponse
              </Typography>
              <Typography sx={{ fontWeight: 800, mt: 0.3, lineHeight: 1.2, fontSize: "0.95rem" }}>
                {yourAnswer?.length ? yourAnswer : "—"}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 180, flex: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem" }}>
                Bonne réponse
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  mt: 0.3,
                  lineHeight: 1.2,
                  fontSize: "0.95rem",
                  color: correctAnswer?.length ? "success.light" : "rgba(255,255,255,0.85)",
                }}
              >
                {correctAnswer?.length ? correctAnswer : "—"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
