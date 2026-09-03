import { Box, Switch, Typography } from "@mui/material";

type Props = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function SettingRow({ label, description, checked, onChange }: Props) {
  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        minHeight: 52,
        py: 0.75,
        cursor: "pointer",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        {description ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      <Switch
        checked={checked}
        onChange={(_, next) => onChange(next)}
        inputProps={{ "aria-label": label }}
      />
    </Box>
  );
}
