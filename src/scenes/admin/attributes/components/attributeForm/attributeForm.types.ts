import type { MutableRefObject } from "react";
import type {
  Attribute,
  AttributeType,
  CasingStrategy,
  ConstraintKind,
  EditPolicy,
} from "../../../../../models/commons/Attribute/Attribute";
import type { ConstraintPayload } from "../../../../../models/commons/Attribute/constraintPayload.schema";
import type { Concept } from "../../../../../models/commons/Concept/Concept";

export type AttributeFormDrawerProps = {
  open: boolean;
  initial?: Attribute;
  onClose: (changed: boolean) => void;
  conceptOptions: Concept[];
  allAttributes: Attribute[];
};

export type ConceptPreset = {
  forceNameFromConcept?: boolean;
  suggestedName?: string;
  forcedType?: AttributeType;
  allowedTypes?: AttributeType[];
  forcedMaxValues?: number;
  forcedEditPolicy?: EditPolicy;
  forcedConstraintKind?: ConstraintKind;
  forcedPrimaryField?: boolean;
  forcedRequired?: boolean;
  forcedCategory?: boolean;
  forcedFilter?: boolean;
  forcedSort?: boolean;
  hideType?: boolean;
  hideMaxValues?: boolean;
  hideEditPolicy?: boolean;
  hidePrimaryField?: boolean;
  hideRequired?: boolean;
  suggested: Partial<{
    type: AttributeType;
    casingStrategy: CasingStrategy;
    maxValues: number;
    primaryField: boolean;
    category: boolean;
    filter: boolean;
    sort: boolean;
    required: boolean;
    editPolicy: EditPolicy;
    constraintKind: ConstraintKind;
    constraintPayload: ConstraintPayload | null;
  }>;
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
  type: AttributeType;
  label: string;
  description: string;
};