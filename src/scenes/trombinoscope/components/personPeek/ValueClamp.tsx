import React, { useEffect, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Button, Paper, Typography } from "@mui/material";

/**
 * Affiche un texte clampé à N lignes.
 * - Le bouton “Afficher tout / Réduire” n’apparaît QUE si le contenu déborde réellement.
 * - Si le contenu NE déborde pas, on l’affiche sur **1 seule ligne** (ellipsis) pour garder la grille compacte.
 */
export default function ValueClamp({
  text,
  maxLines = 3,
  singleLineIfNoToggle = true,
}: {
  text: string;
  maxLines?: number;
  /** Quand il n'y a pas de débordement, on force 1 ligne (ellipsis) */
  singleLineIfNoToggle?: boolean;
}) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);

  // undefined = pas encore mesuré (rend avec maxLines)
  const [showToggle, setShowToggle] = useState<boolean | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);

  // Mesure: on regarde si ça déborde AVEC maxLines (jamais avec 1 ligne)
  useEffect(() => {
    setShowToggle(undefined); // force un render avec clamp=maxLines
    const id = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const overflows = el.scrollHeight > el.clientHeight + 1;
      setShowToggle(overflows);
    });
    return () => cancelAnimationFrame(id);
  }, [text, maxLines]);

  // Choix du clamp rendu
  const clamp =
    expanded
      ? ("unset" as any)
      : showToggle === false && singleLineIfNoToggle
      ? 1
      : maxLines;

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1.25,
        py: 0.9,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.35),
        borderColor: alpha(theme.palette.common.white, 0.08),
      }}
    >
      <Typography
        ref={ref}
        variant="body2"
        sx={{
          display: expanded ? "block" : "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: clamp,
          overflow: "hidden",
          textOverflow: "ellipsis",
          wordBreak: "break-word",
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </Typography>

      {/* Boutons uniquement si le contenu déborde vraiment */}
      {showToggle && !expanded && (
        <Button
          size="small"
          onClick={() => setExpanded(true)}
          sx={{ mt: 0.25, px: 0, minWidth: 0 }}
        >
          Afficher tout
        </Button>
      )}
      {showToggle && expanded && (
        <Button
          size="small"
          onClick={() => setExpanded(false)}
          sx={{ mt: 0.25, px: 0, minWidth: 0 }}
        >
          Réduire
        </Button>
      )}
    </Paper>
  );
}
