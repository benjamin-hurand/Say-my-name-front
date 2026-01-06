import { alpha, useTheme } from "@mui/material/styles";
import { Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import ValueClamp from "./ValueClamp";

export type AttributeGroup = {
  attributeId: number;
  values: string[]; // toutes les valeurs pour cet attribut (dédupliquées)
};

type Props = {
  groups: AttributeGroup[]; // inclut les catégories si tu veux
  getAttrLabel: (id: number) => string;
  prettyValue: (id: number, raw: string) => string;
  isLongTextAttr: (id: number, value: string) => boolean;
};

export default function AttributeGrid({
  groups,
  getAttrLabel,
  prettyValue,
  isLongTextAttr,
}: Props) {
  const theme = useTheme();

  if (!groups?.length) {
    return <Typography variant="body2" sx={{ opacity: 0.7 }}>Aucun autre attribut.</Typography>;
  }

  return (
    <Grid container spacing={1.5}>
      {groups.map((g) => {
        const rendered = g.values.map(v => String(prettyValue(g.attributeId, v)));
        const hasLong = rendered.some(v => isLongTextAttr(g.attributeId, v));
        const mdCols = hasLong ? 12 : 6;

        return (
          <Grid item xs={12} sm={6} md={mdCols} key={g.attributeId}>
            <Stack spacing={0.5}>
              <Typography
                variant="caption"
                sx={{ textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.75 }}
              >
                {getAttrLabel(g.attributeId)}
              </Typography>

              {/* Si aucun long : on aligne tout en chips (wrap) */}
              {!hasLong ? (
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {rendered.map((val, i) => (
                    <Chip key={i} label={val} size="small" variant="outlined" sx={{ maxWidth: "100%" }} />
                  ))}
                </Stack>
              ) : (
                // Avec longs : on empile les longs (clampés) + chips pour les courts
                <Stack spacing={0.5}>
                  {rendered.map((val, i) =>
                    isLongTextAttr(g.attributeId, val) ? (
                      <ValueClamp key={i} text={val} maxLines={3} />
                    ) : (
                      <Paper
                        key={i}
                        variant="outlined"
                        sx={{
                          px: 1.25,
                          py: 0.9,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.35),
                          borderColor: alpha(theme.palette.common.white, 0.08),
                          display: "inline-block",
                        }}
                      >
                        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                          {val}
                        </Typography>
                      </Paper>
                    )
                  )}
                </Stack>
              )}
            </Stack>
          </Grid>
        );
      })}
    </Grid>
  );
}
