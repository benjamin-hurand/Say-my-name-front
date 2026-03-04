import React from "react";
import { Box, Chip, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReportIcon from "@mui/icons-material/Report";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import BlockIcon from "@mui/icons-material/Block";
import NoteIcon from "@mui/icons-material/Note";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import { DifficultyLevel, PoolType } from "../../services/dto/quiz/QuizEnums";

export type QuizCardBadgeProps = {
  poolBadge?: PoolType;
  difficultyBadge?: DifficultyLevel;
};

const poolColors: Partial<Record<PoolType, string>> = {
  NEW: "#FFB300",
  ERROR_RECENT: "#D32F2F",
  SRS_DUE: "#1976D2",
  REVISION: "#388E3C",
  DISCOVERED: "#7B1FA2",
};

const difficultyColors: Record<DifficultyLevel, string> = {
  EASY: "#AED581",
  MEDIUM: "#FFF176",
  HARD: "#EF5350",
};

export interface QuizCardProps extends QuizCardBadgeProps {
  color: string;
  height?: string | number;

  photoUrl: string | null;
  enableFlip: boolean;
  isFlipped: boolean;
  isAnimating: boolean;

  isImportant: boolean;
  onToggleImportant: (e: React.MouseEvent<HTMLElement>) => void;

  onFlip: () => void;
  onTransitionEnd: (e: React.TransitionEvent<HTMLDivElement>) => void;

  anchorEl: HTMLElement | null;
  onOpenMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onCloseMenu: (e: React.MouseEvent<HTMLElement>) => void;

  front: React.ReactNode;
  back: React.ReactNode;
  backBackgroundPhotoUrl?: string | null;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  color,
  height = "56vh",
  photoUrl,
  enableFlip,
  isFlipped,
  isImportant,
  onToggleImportant,
  onFlip,
  onTransitionEnd,
  anchorEl,
  onOpenMenu,
  onCloseMenu,
  poolBadge,
  difficultyBadge,
  front,
  back,
  backBackgroundPhotoUrl,
}) => {
  const iconBtnSx = {
    backgroundColor: `${color}CC`,
    color: "#242424",
    boxShadow: 1,
    "&:hover": { backgroundColor: `${color}FF` },
    "& .MuiSvgIcon-root": { fill: "#242424" },
  };

  return (
    <Tooltip title={enableFlip ? "Cliquez pour voir la fiche" : ""} placement="top" disableHoverListener={!enableFlip}>
      <Box
        onClick={enableFlip ? onFlip : undefined}
        role={enableFlip ? "button" : undefined}
        aria-label={enableFlip ? "Afficher la fiche d’aide" : undefined}
        sx={{
          perspective: "1000px",
          width: "100%",
          height,
          cursor: enableFlip ? "pointer" : "default",
          mb: 2,
          position: "relative",

          // IMPORTANT: empêche tout overlay absolu de déborder
          overflow: "hidden",
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s ease-in-out",
            transform: isFlipped ? "rotateY(180deg)" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {/* FRONT */}
          <Box sx={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
            {photoUrl ? (
              <TransitionGroup component="div">
                <CSSTransition key={photoUrl} timeout={500} classNames="fade" unmountOnExit mountOnEnter>
                  <Box
                    component="img"
                    src={photoUrl}
                    alt="Question"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      boxShadow: `0 0 20px ${color}`,
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                </CSSTransition>
              </TransitionGroup>
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at 20% 20%, ${color}33, rgba(0,0,0,0.75))`,
                }}
              />
            )}

            {/* Favorite */}
            <IconButton onClick={onToggleImportant} sx={{ position: "absolute", top: 8, left: 8, zIndex: 3, ...iconBtnSx }}>
              {isImportant ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>

            {/* Badges */}
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 1,
                zIndex: 3,
                pointerEvents: "none", // décoratif
              }}
            >
              {poolBadge && (
                <Chip
                  label={String(poolBadge).replace("_", " ")}
                  size="small"
                  sx={{ backgroundColor: poolColors[poolBadge] ?? "rgba(255,255,255,0.15)", color: "#fff" }}
                />
              )}
              {difficultyBadge && (
                <Chip label={String(difficultyBadge)} size="small" sx={{ backgroundColor: difficultyColors[difficultyBadge], color: "#000" }} />
              )}
            </Box>

            {/* Menu (front only) */}
            {enableFlip && !isFlipped && (
              <>
                <IconButton onClick={onOpenMenu} sx={{ position: "absolute", top: 8, right: 8, zIndex: 3, ...iconBtnSx }}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={onCloseMenu}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MenuItem onClick={(e) => { e.stopPropagation(); onCloseMenu(e as any); }}>
                    <ReportIcon fontSize="small" sx={{ mr: 1 }} />
                    Signaler un problème
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseMenu(e as any);
                      onToggleImportant(e);
                    }}
                  >
                    <StarIcon fontSize="small" sx={{ mr: 1 }} />
                    Important
                  </MenuItem>
                  <MenuItem onClick={(e) => { e.stopPropagation(); onCloseMenu(e as any); }}>
                    <BlockIcon fontSize="small" sx={{ mr: 1 }} />
                    Indésirable
                  </MenuItem>
                  <MenuItem onClick={(e) => { e.stopPropagation(); onCloseMenu(e as any); }}>
                    <NoteIcon fontSize="small" sx={{ mr: 1 }} />
                    Note
                  </MenuItem>
                  <MenuItem onClick={(e) => { e.stopPropagation(); onCloseMenu(e as any); }}>
                    <VolumeUpIcon fontSize="small" sx={{ mr: 1 }} />
                    Prononciation
                  </MenuItem>
                </Menu>
              </>
            )}

            {front}
          </Box>

          {/* BACK */}
          <Box sx={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
            <Box sx={{ width: "100%", height: "100%", transform: "scaleX(-1)", position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: backBackgroundPhotoUrl ? `url(${backBackgroundPhotoUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "brightness(20%)",
                  backgroundColor: backBackgroundPhotoUrl ? undefined : "rgba(0,0,0,0.85)",
                }}
              />

              {/* Favorite */}
              <IconButton onClick={onToggleImportant} sx={{ position: "absolute", top: 8, left: 8, zIndex: 3, ...iconBtnSx }}>
                {isImportant ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>

              {/* Badges */}
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 1,
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              >
                {poolBadge && (
                  <Chip
                    label={String(poolBadge).replace("_", " ")}
                    size="small"
                    sx={{ backgroundColor: poolColors[poolBadge] ?? "rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                )}
                {difficultyBadge && (
                  <Chip label={String(difficultyBadge)} size="small" sx={{ backgroundColor: difficultyColors[difficultyBadge], color: "#000" }} />
                )}
              </Box>

              {/* Back content */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                <Box sx={{ transform: "scaleX(-1)", width: "100%", maxWidth: 520 }}>
                  <Box
                    sx={{
                      borderRadius: 3,
                      p: 2.5,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {back}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};
