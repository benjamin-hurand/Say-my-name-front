import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function FormSection({ eyebrow, title, subtitle, children }: Props) {
  return (
    <Stack spacing={1.75}>
      <Box>
        {eyebrow ? (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: "block", lineHeight: 1.2, letterSpacing: "0.14em", fontWeight: 700 }}
          >
            {eyebrow}
          </Typography>
        ) : null}

        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.15 }}>
          {title}
        </Typography>

        {subtitle ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.6, maxWidth: 720, lineHeight: 1.5 }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      <Box>{children}</Box>
    </Stack>
  );
}
