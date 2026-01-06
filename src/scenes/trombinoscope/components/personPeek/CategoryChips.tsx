import { Chip, Stack, Typography } from "@mui/material";

type Props = {
  labels: string[];
  dense?: boolean;          // pour la section “Détails” (moins proéminent)
  title?: string | null;    // ex: "Catégories" (si null, pas de titre)
};

export default function CategoryChips({ labels, dense, title = null }: Props) {
  if (!labels?.length) return null;
  return (
    <Stack spacing={dense ? 0.5 : 0.75}>
      {title && (
        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.75 }}>
          {title}
        </Typography>
      )}
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {labels.map((label, i) => (
          <Chip
            key={i}
            size="small"
            variant={dense ? "outlined" : "filled"}
            label={label}
            sx={{ maxWidth: "100%" }}
          />
        ))}
      </Stack>
    </Stack>
  );
}
