import type { SvgIconComponent } from "@mui/icons-material";
import AbcRoundedIcon from "@mui/icons-material/AbcRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import { Box } from "@mui/material";

import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
import type { CustomTypeOption } from "./attributeForm.types";
import ChoiceCard from "./shared/ChoiceCard";

type Props = {
  options: CustomTypeOption[];
  value: ValueType;
  onChange: (type: ValueType) => void;
};

function getTypeIcon(type: ValueType): SvgIconComponent {
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

function getDisplayLabel(option: CustomTypeOption): string {
  if (option.type === "ENUM") return "Liste de choix";
  return option.label;
}

export default function CustomAttributeTypePicker({ options, value, onChange }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        },
        gap: 1.25,
      }}
    >
      {options.map((option) => {
        const selected = option.type === value;
        const Icon = getTypeIcon(option.type);

        return (
          <ChoiceCard
            key={option.type}
            selected={selected}
            title={getDisplayLabel(option)}
            subtitle={option.description}
            onClick={() => onChange(option.type)}
            icon={<Icon fontSize="small" />}
            minHeight={116}
          />
        );
      })}
    </Box>
  );
}
