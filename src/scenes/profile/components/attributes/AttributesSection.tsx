// src/scenes/profile/components/AttributesSection.tsx
import { Card, CardContent, Typography } from "@mui/material";
import React from "react";
import AttributesListContainer from "../attributes/AttributesListContainer";

const AttributesSection: React.FC = () => {
  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(12px)",
        bgcolor: "rgba(32,32,32,0.7)",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="h6">Mes Attributs</Typography>
      </CardContent>

      <CardContent
        className="scrollable-content"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          pr: 3,
          scrollbarGutter: "stable both-edges",
        }}
      >
        <AttributesListContainer />
      </CardContent>
    </Card>
  );
};

export default AttributesSection;
