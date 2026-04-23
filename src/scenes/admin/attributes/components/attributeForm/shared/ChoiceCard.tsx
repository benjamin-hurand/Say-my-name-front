import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

type Props = {
  selected: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClick: () => void;
  icon: ReactNode;
  minHeight?: number;
};

export default function ChoiceCard({
  selected,
  title,
  subtitle,
  onClick,
  icon,
  minHeight = 100,
}: Props) {
  return (
    <Paper
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      variant="outlined"
      sx={(theme) => ({
        position: "relative",
        p: { xs: 1.4, sm: 1.5 },
        minHeight,
        textAlign: "left",
        cursor: "pointer",
        borderWidth: selected ? 2 : 1,
        borderColor: selected
          ? theme.palette.primary.main
          : alpha(theme.palette.divider, 0.75),
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, 0.06)
          : alpha(theme.palette.background.paper, 0.76),
        boxShadow: selected
          ? `0 10px 22px ${alpha(theme.palette.primary.main, 0.12)}`
          : `0 8px 20px ${alpha(theme.palette.common.black, 0.06)}`,
        transition: theme.transitions.create(
          ["transform", "box-shadow", "border-color", "background-color"],
          {
            duration: theme.transitions.duration.shorter,
          },
        ),
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: selected
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.main, 0.35),
          boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      })}
    >
      <Stack spacing={1}>
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
            color: selected ? "primary.main" : "text.secondary",
          })}
        >
          {icon}
        </Box>

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
        </Box>
      </Stack>
    </Paper>
  );
}