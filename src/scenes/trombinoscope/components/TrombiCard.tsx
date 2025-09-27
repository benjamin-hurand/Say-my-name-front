import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PhotoCameraFrontOutlinedIcon from "@mui/icons-material/PhotoCameraFrontOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";

import {
  PersonAttributeExtraDto,
  PersonCardDto,
} from "../../../services/dto/person/search/PersonCardDtos";
import useLongPress from "../hooks/useLongPress";

type SelectedFilters = Record<
  number,
  { op: "IN" | "LIKE" | "RANGE" | undefined; values: string[] }
>;

const byOrder = (
  a?: PersonAttributeExtraDto | null,
  b?: PersonAttributeExtraDto | null
) =>
  (a?.displayOrder ?? Number.MAX_SAFE_INTEGER) -
  (b?.displayOrder ?? Number.MAX_SAFE_INTEGER);

function displayName(p: PersonCardDto) {
  const parts = (p?.primaryAttributes ?? [])
    .filter((x) => !!x?.value)
    .sort(byOrder)
    .map((x) => x.value.trim());
  return parts.join(" ").trim() || `#${p?.idPerson ?? "?"}`;
}
function initialsFrom(name: string) {
  const w = name.trim().split(/\s+/).slice(0, 2);
  return w.map((x) => x[0]?.toUpperCase() ?? "").join("") || "??";
}

const TrombiCard: React.FC<{
  person: PersonCardDto;
  followed: boolean;
  followPending?: boolean;
  onToggleFollow: () => void;
  selectedFilters: SelectedFilters;
  searchText?: string;

  selectionEnabled?: boolean;
  selected?: boolean;
  onSelectToggle?: (e?: React.MouseEvent) => void;
  onOpenPeek?: () => void;
  onLongPress?: () => void;

  /** Feedback pré-surbrillance pour MAJ+hover (calculé par le Grid) */
  inShiftPreview?: boolean;

  /** Pour améliorer la détection clavier dans le Grid */
  onMouseEnterCard?: (e: React.MouseEvent) => void;
}> = ({
  person,
  followed,
  followPending = false,
  onToggleFollow,
  selectedFilters,
  searchText,
  selectionEnabled = false,
  selected = false,
  onSelectToggle,
  onOpenPeek,
  onLongPress,
  inShiftPreview = false,
  onMouseEnterCard,
}) => {
  const theme = useTheme();
  const { bind: longPressBind, suppressClickRef } =
    useLongPress<HTMLButtonElement>(() => {
      onLongPress?.();
    }, { delay: 500 });

  const name = displayName(person);
  const initials = useMemo(() => initialsFrom(name), [name]);
  const small = person.photoSmallUrl ?? null;

  // ---- Glass constants
  const baseBgA = alpha(theme.palette.background.paper, 0.35);
  const baseBgB = alpha(theme.palette.background.paper, 0.22);
  const hoverBg = alpha(theme.palette.background.paper, 0.5);
  const borderCol = alpha(theme.palette.common.white, 0.08);
  const ring = alpha(theme.palette.primary.main, 0.65);
  const ringHalo = alpha(theme.palette.primary.main, 0.1);

  // ---- Animation pulse courte sur follow/unfollow
  const [pulse, setPulse] = useState(false);
  const prevFollowedRef = useRef(followed);
  useEffect(() => {
    if (prevFollowedRef.current !== followed) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 280);
      prevFollowedRef.current = followed;
      return () => clearTimeout(t);
    }
  }, [followed]);

  return (
    <Card
      role="group"
      aria-selected={selectionEnabled ? selected : undefined}
      elevation={0}
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 144,
        borderRadius: 2.5,

        // 🧊 Effet "glass"
        background: `linear-gradient(145deg, ${baseBgA}, ${baseBgB})`,
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
        border: `1px solid ${borderCol}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        transition:
          "background-color 160ms ease, box-shadow 160ms ease, transform 120ms ease, border-color 160ms ease",

        // 🟦 État sélectionné — bague + halo discret + légère élévation
        ...(selected && {
          borderColor: ring,
          boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(
            theme.palette.primary.main,
            0.25
          )}`,
          background: `linear-gradient(145deg, ${alpha(
            theme.palette.primary.main,
            0.06
          )}, ${baseBgA})`,
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            boxShadow: `0 0 0 8px ${ringHalo}`,
            pointerEvents: "none",
          },
        }),

        // 🟨 Prévisualisation d'intervalle (MAJ+hover)
        ...(inShiftPreview && !selected && {
          outline: `2px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
          outlineOffset: 2,
        }),

        // Hover scale uniquement hors mode sélection
        "&:hover": {
          background: `linear-gradient(145deg, ${hoverBg}, ${baseBgA})`,
          boxShadow: selected
            ? `inset 0 0 0 2px ${ring}, 0 12px 34px ${alpha(
                theme.palette.primary.main,
                0.35
              )}`
            : "0 12px 28px rgba(0,0,0,0.24)",
          transform: selectionEnabled ? "translateY(-1px)" : "translateY(-1px) scale(1.02)",
        },

        // Focus visible (tabulation)
        "&:focus-within": {
          outline: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          outlineOffset: 2,
        },
      }}
    >
      {/* ✅ Sélection badge (en haut-gauche) — discret, clair */}
      {selectionEnabled && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle?.(e);
          }}
          aria-pressed={selected}
          aria-label={selected ? "Désélectionner" : "Sélectionner"}
          disableRipple
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
            background: selected
              ? `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(
                  theme.palette.primary.main,
                  0.7
                )})`
              : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.45)}, ${alpha(
                  theme.palette.background.paper,
                  0.25
                )})`,
            border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            transition: "transform 140ms, box-shadow 140ms, background-color 140ms",
            "&:hover": { transform: "scale(1.06)", boxShadow: "0 6px 16px rgba(0,0,0,0.24)" },
            zIndex: 2,
          }}
        >
          {selected ? (
            <CheckRoundedIcon sx={{ fontSize: 18 }} />
          ) : (
            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, opacity: 0.9 }} />
          )}
        </IconButton>
      )}

      <CardActionArea
        {...longPressBind}
        tabIndex={0}
        role="button"
        onMouseEnter={(e) => onMouseEnterCard?.(e)}
        onKeyDown={(e) => {
          // Accessibilité clavier : Espace/Entrée = click
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (selectionEnabled) onSelectToggle?.();
            else onOpenPeek?.();
          }
        }}
        onClick={(e) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (selectionEnabled) {
            onSelectToggle?.(e);
            return;
          }
          onOpenPeek?.();
        }}
        sx={{ flexGrow: 1, borderRadius: 2.5 }}
      >
        {/* Avatar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            pt: 0.75,
            position: "relative",
          }}
        >
          <Avatar
            src={small ?? undefined}
            alt={name}
            sx={{
              width: 72,
              height: 72,
              fontSize: 18,
              boxShadow: selected
                ? `0 6px 18px rgba(0,0,0,0.22), 0 0 0 2px ${ring}`
                : "0 6px 18px rgba(0,0,0,0.22)",
              border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
              backdropFilter: "blur(6px)",
            }}
          >
            {initials}
          </Avatar>

          {/* pictogramme "photo" */}
          <Box
            sx={{
              position: "absolute",
              right: "calc(50% - 36px - 6px)",
              bottom: -6,
            }}
          >
            <Box
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: "50%",
                p: 0.35,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                border: `1px solid ${alpha(theme.palette.common.white, 0.16)}`,
                backdropFilter: "blur(6px)",
              }}
            >
              <PhotoCameraFrontOutlinedIcon sx={{ fontSize: 12 }} />
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ py: 0.75, px: 1.1 }}>
          <Typography
            variant="body1"
            align="center"
            fontWeight={700}
            noWrap
            title={name}
            sx={{
              lineHeight: 1.15,
              mt: 0.5,
              textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            {name}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* Bouton follow (en haut-droite) */}
      <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
        <Tooltip title={followed ? "Ne plus suivre" : "Suivre"}>
          <span>
            <IconButton
              size="small"
              aria-pressed={followed}
              aria-label={followed ? "Ne plus suivre" : "Suivre"}
              onClick={async (e) => {
                e.stopPropagation();
                if (!followPending) await onToggleFollow();
              }}
              disableRipple
              sx={{
                "@keyframes pulse": {
                  "0%": { transform: "scale(1)" },
                  "35%": { transform: "scale(1.15)" },
                  "100%": { transform: "scale(1)" },
                },
                width: 30,
                height: 30,
                borderRadius: "50%",
                pointerEvents: followPending ? "none" : "auto",
                opacity: followPending ? 0.6 : 1,
                color: followed ? theme.palette.success.main : theme.palette.text.primary,
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.background.paper,
                  0.45
                )}, ${alpha(theme.palette.background.paper, 0.25)})`,
                border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
                backdropFilter: "blur(8px) saturate(140%)",
                WebkitBackdropFilter: "blur(8px) saturate(140%)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                transition:
                  "transform 140ms, background-color 140ms, box-shadow 140ms, color 140ms, border-color 140ms",
                animation: pulse ? "pulse 280ms ease-out" : "none",
                "&:hover": {
                  transform: "scale(1.06)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.24)",
                  borderColor: alpha(theme.palette.common.white, 0.18),
                },
                "& .MuiTouchRipple-root": { display: "none" },
              }}
            >
              {followed ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

    </Card>
  );
};

export default TrombiCard;
