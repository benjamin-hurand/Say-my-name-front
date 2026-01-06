import React from "react";
import { Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";

/** Neutral “value chip” + variants (added / deleted). */
export const ValueChip: React.FC<{
  children: React.ReactNode;
  marker?: "neutral" | "create" | "delete";
}> = ({ children, marker = "neutral" }) => (
  <Chip
    size="small"
    variant="outlined"
    label={children}
    sx={(t) => {
      const base = {
        maxWidth: "100%",
        "& .MuiChip-label": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
          fontWeight: 500,
        },
      };

      if (marker === "create") {
        return {
          ...base,
          borderStyle: "dashed",
          borderColor: alpha(t.palette.success.main, 0.55),
          background: alpha(t.palette.success.main, 0.06),
        };
      }
      if (marker === "delete") {
        return {
          ...base,
          borderColor: alpha(t.palette.error.main, 0.45),
          background: "transparent",
          "& .MuiChip-label": { textDecoration: "line-through", opacity: 0.9 },
        };
      }
      return base;
    }}
  />
);

export default ValueChip;
