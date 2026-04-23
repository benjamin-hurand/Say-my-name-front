import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type Props = {
  title: string;
  description: string;
  emphasis?: "neutral" | "primary";
};

export default function CompactInfoCard({
  title,
  description,
  emphasis = "neutral",
}: Props) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box
        sx={(theme) => ({
          width: 28,
          height: 28,
          mt: 0.2,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          backgroundColor:
            emphasis === "primary"
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.text.primary, 0.06),
          color: emphasis === "primary" ? "primary.main" : "text.secondary",
        })}
      >
        <InfoOutlinedIcon sx={{ fontSize: 17 }} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: "block" }}>
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.5 }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}
