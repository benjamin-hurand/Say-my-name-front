import type { SvgIconComponent } from "@mui/icons-material";
import AbcRoundedIcon from "@mui/icons-material/AbcRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { AttributeType } from "../../../../../models/commons/Attribute/Attribute";
import { glassCard } from "../../../../../styles/glassStyles";
import type { CustomTypeOption } from "./attributeForm.types";

type Props = {
  options: CustomTypeOption[];
  value: AttributeType;
  onChange: (type: AttributeType) => void;
};

function getTypeIcon(type: AttributeType): SvgIconComponent {
  switch (type) {
    case "TEXT":
      return AbcRoundedIcon;
    case "ENUM":
      return ViewListRoundedIcon;
    case "NUMBER":
      return LooksOneRoundedIcon;
    case "DATE":
      return CalendarMonthRoundedIcon;
    case "DATETIME":
      return ScheduleRoundedIcon;
    case "BOOLEAN":
      return CheckCircleOutlineRoundedIcon;
    default:
      return AbcRoundedIcon;
  }
}

export default function CustomAttributeTypePicker({ options, value, onChange }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
        gap: 1.25,
      }}
    >
      {options.map((option) => {
        const selected = option.type === value;
        const Icon = getTypeIcon(option.type);

        return (
          <Paper
            key={option.type}
            component="button"
            type="button"
            onClick={() => onChange(option.type)}
            sx={(theme) => {
              const ring = alpha(theme.palette.primary.main, 0.65);
              const ringHalo = alpha(theme.palette.primary.main, 0.1);

              return {
                ...(glassCard(theme) as object),
                minHeight: 116,
                p: 1.5,
                textAlign: "left",
                cursor: "pointer",
                ...(selected && {
                  borderColor: ring,
                  background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.35)})`,
                  boxShadow: `inset 0 0 0 2px ${ring}, 0 10px 30px ${alpha(theme.palette.primary.main, 0.25)}`,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    boxShadow: `0 0 0 8px ${ringHalo}`,
                    pointerEvents: "none",
                  },
                }),
              };
            }}
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
                <Icon fontSize="small" />
              </Box>

              <Typography variant="subtitle2" fontWeight={700}>
                {option.label}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                {option.description}
              </Typography>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}