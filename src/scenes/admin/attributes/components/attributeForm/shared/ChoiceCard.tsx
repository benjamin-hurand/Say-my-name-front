import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

type Props = {
  selected: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  disabled?: boolean;
  disabledReason?: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  minHeight?: number;
};

export default function ChoiceCard({
  selected,
  title,
  subtitle,
  disabled = false,
  disabledReason,
  onClick,
  icon,
  minHeight = 112,
}: Props) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      sx={(theme) => ({
        width: "100%",
        minHeight,
        p: 1.5,
        border: "1px solid",
        borderRadius: 2.5,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor: disabled
          ? alpha(theme.palette.text.primary, 0.18)
          : selected
            ? theme.palette.primary.main
            : theme.palette.divider,
        boxShadow: "none",
        appearance: "none",
        font: "inherit",
        color: disabled ? theme.palette.text.disabled : "inherit",
        transition: theme.transitions.create(["border-color", "background-color"], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(selected && { borderWidth: 2 }),
        backgroundColor: disabled
          ? alpha(theme.palette.action.disabledBackground, 0.72)
          : selected
            ? alpha(theme.palette.primary.main, 0.06)
            : theme.palette.background.paper,
        opacity: disabled ? 0.78 : 1,
        "&:not(:disabled):hover": {
          borderColor: selected ? theme.palette.primary.main : theme.palette.text.secondary,
          backgroundColor: selected
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.action.hover, 0.4),
        },
        "&:focus-visible": {
          outline: `2px solid ${alpha(theme.palette.primary.main, 0.24)}`,
          outlineOffset: 2,
        },
      })}
    >
      <Stack spacing={1.1} sx={{ height: "100%" }}>
        {icon ? (
          <Box
            sx={(theme) => ({
              width: 34,
              height: 34,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              backgroundColor: selected
                ? alpha(theme.palette.primary.main, 0.16)
                : alpha(theme.palette.text.primary, 0.06),
              color: disabled
                ? "text.disabled"
                : selected
                  ? "primary.main"
                  : "text.secondary",
            })}
          >
            {icon}
          </Box>
        ) : null}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="div"
            variant="subtitle2"
            fontWeight={700}
            sx={{ lineHeight: 1.3 }}
          >
            {title}
          </Typography>

          {subtitle ? (
            <Typography
              component="div"
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.45, lineHeight: 1.35 }}
            >
              {subtitle}
            </Typography>
          ) : null}

          {disabledReason ? (
            <Typography
              component="div"
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.45, lineHeight: 1.35, fontWeight: 600 }}
            >
              {disabledReason}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
