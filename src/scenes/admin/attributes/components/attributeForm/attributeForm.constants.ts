import type { CustomTypeOption } from "./attributeForm.types";

export const CUSTOM_TYPE_OPTIONS: CustomTypeOption[] = [
  { type: "TEXT", label: "Texte", description: "Information textuelle simple" },
  { type: "ENUM", label: "Liste de choix", description: "Valeur choisie dans une liste" },
  { type: "NUMBER", label: "Nombre", description: "Valeur numérique" },
  { type: "DATE", label: "Date", description: "Date sans heure" },
  { type: "DATETIME", label: "Date & heure", description: "Date avec heure" },
  { type: "BOOLEAN", label: "Oui / Non", description: "Réponse binaire" },
];