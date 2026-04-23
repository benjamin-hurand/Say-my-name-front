import type { MutableRefObject } from "react";
import type {
  Attribute,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";

export type AttributeFormDrawerProps = {
  open: boolean;
  initial?: Attribute;
  onClose: (changed: boolean) => void;
  conceptOptions: Concept[];
  allAttributes: Attribute[];
};

export type ConceptCardOption = Concept & {
  blocked: boolean;
  duplicateCount: number;
};

export type AttributeFormHeaderChip = {
  label: string;
  color: "default" | "primary" | "warning" | "error";
};

export type ConceptLabelGetter = (concept: Concept | null | undefined) => string;
export type ConceptDescriptionGetter = (concept: Concept | null | undefined) => string | null;

export type NameEditRef = MutableRefObject<boolean>;

export type CustomTypeOption = {
  type: ValueType;
  label: string;
  description: string;
};