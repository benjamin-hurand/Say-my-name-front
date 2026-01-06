import React from "react";
import { Typography } from "@mui/material";
import type { ChipProps } from "@mui/material/Chip";

/* ---------- helpers ---------- */

export function statusColor(status?: string): ChipProps["color"] {
  switch (status) {
    case "PENDING":  return "warning";
    case "APPROVED": return "success";
    case "REJECTED": return "error";
    case "CANCELED": return "default";
    default:         return "default";
  }
}

export function formatRelative(date?: Date | null): string {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(Math.abs(diffMs) / 60000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.round(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.round(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="caption"
    sx={{ opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.3 }}
  >
    {children}
  </Typography>
);
