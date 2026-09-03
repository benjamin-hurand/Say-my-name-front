import type { CustomTypeOption } from "./attributeForm.types";

export const CUSTOM_TYPE_OPTIONS: CustomTypeOption[] = [
  { type: "TEXT", label: "Texte" },
  { type: "NUMBER", label: "Nombre" },
  { type: "DATE", label: "Date", description: "Date sans heure" },
  { type: "ENUM", label: "Liste de choix" },
  { type: "BOOLEAN", label: "Oui / Non" },
];
