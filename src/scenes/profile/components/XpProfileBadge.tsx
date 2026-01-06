// src/scenes/profile/components/XpProfileBadge.tsx
import React, { useMemo } from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { useProfile } from "../../../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";

type Variant = "bar" | "ring";

type Props = {
  variant?: Variant;
  showRank?: boolean;
  showLevel?: boolean;
  ringSizePx?: number;
};

const XpProfileBadge: React.FC<Props> = ({
  variant = "bar",
  showRank = true,
  showLevel = true,
  ringSizePx = 64,
}) => {
  const { xp, rank } = useProfile();
  const navigate = useNavigate();
  const xpTotal = xp ?? 0;

  const { level, levelStartXp, levelEndXp, progress01, xpIntoLevel } =
    useMemo(() => {
      const safeXp = Math.max(0, Number.isFinite(xpTotal) ? xpTotal : 0);
      const thresholdForLevel = (lvl: number) => 200 + 50 * Math.max(0, lvl - 1);

      let lvl = 1;
      let acc = 0;
      while (safeXp >= acc + thresholdForLevel(lvl)) {
        acc += thresholdForLevel(lvl);
        lvl++;
        if (lvl > 5000) break;
      }

      const start = acc;
      const end = acc + thresholdForLevel(lvl);
      const into = safeXp - start;
      const span = Math.max(1, end - start);

      return {
        level: lvl,
        levelStartXp: start,
        levelEndXp: end,
        progress01: Math.min(1, into / span),
        xpIntoLevel: into,
      };
    }, [xpTotal]);

  const rankLabel = rank && rank > 0 ? `Rang #${rank}` : "Non classé";
  const levelLabel = `Niveau ${level}`;
  const nextLabel = `${xpIntoLevel} / ${Math.max(
    1,
    levelEndXp - levelStartXp
  )} XP`;

  const onClick = () => navigate("/xp");

  if (variant === "ring") {
    return (
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ cursor: "pointer" }}
        onClick={onClick}
      >
        <Tooltip title="Voir l’historique XP">
          <Box sx={{ position: "relative", width: ringSizePx, height: ringSizePx }}>
            <CircularProgress
              variant="determinate"
              value={progress01 * 100}
              thickness={5}
              size={ringSizePx}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <BoltRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                {level}
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" icon={<MilitaryTechRoundedIcon />} label={`${xpTotal} XP`} />
            {showRank && (
              <Chip size="small" icon={<EmojiEventsRoundedIcon />} label={rankLabel} />
            )}
            {showLevel && <Chip size="small" label={levelLabel} />}
          </Stack>

          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {nextLabel} • prochain niveau
          </Typography>
        </Stack>
      </Stack>
    );
  }

  // variant "bar"
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1,
        py: 1,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: "rgba(32,32,32,0.55)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "box-shadow .25s",
        "&:hover": {
          boxShadow: "0 0 0 1px rgba(255,255,255,0.25)",
        },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" icon={<MilitaryTechRoundedIcon />} label={`${xpTotal} XP`} />
          {showRank && (
            <Chip size="small" icon={<EmojiEventsRoundedIcon />} label={rankLabel} />
          )}
          {showLevel && <Chip size="small" label={levelLabel} />}
        </Stack>

        <Tooltip title="Voir l’historique XP">
          <Box>
            <LinearProgress variant="determinate" value={progress01 * 100} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption">{nextLabel}</Typography>
              <Typography variant="caption">{Math.round(progress01 * 100)}%</Typography>
            </Box>
          </Box>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default XpProfileBadge;
