import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  promotion?: string;
}

interface TrombiTableUltraMinimalProps {
  items: Person[];
}

/** Table ultra basique pour debug spacing / scroll */
const TrombiTableUltraMinimal: React.FC<TrombiTableUltraMinimalProps> = ({ items }) => {
  return (
    <TableContainer style={{ overflow: "auto" }}>
      <Table size="small" style={{ width: "100%", borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell>Prénom</TableCell>
            <TableCell>Nom</TableCell>
            <TableCell>Promotion</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.firstName}</TableCell>
              <TableCell>{p.lastName}</TableCell>
              <TableCell>{p.promotion ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrombiTableUltraMinimal;
