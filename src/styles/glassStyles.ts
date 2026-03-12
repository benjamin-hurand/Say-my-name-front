import { SxProps } from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";

/**
 * Surface glass pour Dialog / Drawer PaperProps.
 * @param opacity - Opacité du fond (défaut 0.55 pour dialogs "display", ~0.85 pour formulaires)
 */
export function glassDialog(theme: Theme, opacity = 0.55): SxProps<Theme> {
  return {
    background: alpha(theme.palette.background.paper, opacity),
    backdropFilter: "blur(16px) saturate(140%)",
    WebkitBackdropFilter: "blur(16px) saturate(140%)",
    border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
    boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
  };
}

/**
 * Surface glass pour cartes sélectionnables (idle + hover).
 * Les états selected / disabled sont à composer au call site.
 */
export function glassCard(theme: Theme): SxProps<Theme> {
  const baseBgA = alpha(theme.palette.background.paper, 0.35);
  const baseBgB = alpha(theme.palette.background.paper, 0.22);
  const hoverBg = alpha(theme.palette.background.paper, 0.5);
  const borderCol = alpha(theme.palette.common.white, 0.08);
  return {
    position: "relative",
    background: `linear-gradient(145deg, ${baseBgA}, ${baseBgB})`,
    backdropFilter: "blur(10px) saturate(140%)",
    WebkitBackdropFilter: "blur(10px) saturate(140%)",
    border: `1px solid ${borderCol}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    borderRadius: 3,
    transition:
      "background 160ms ease, box-shadow 160ms ease, transform 120ms ease, border-color 160ms ease",
    "&:hover": {
      background: `linear-gradient(145deg, ${hoverBg}, ${baseBgA})`,
      boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
      transform: "translateY(-1px)",
    },
  };
}
