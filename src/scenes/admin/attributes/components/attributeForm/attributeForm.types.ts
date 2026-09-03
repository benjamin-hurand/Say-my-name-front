import type {
  Attribute,
  ValueType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { Concept } from "../../../../../models/commons/Concept/Concept";

export type AttributeFormDrawerProps = {
  open: boolean;
  initial?: Attribute;
  /**
   * Shortcut for the "add a custom identity source" CTA: on create, skips
   * both wizard picker steps and opens configuration with a TEXT,
   * single-value, identitySource-checked field ready to name.
   */
  presetIdentitySource?: boolean;
  onClose: (changed: boolean) => void;
  onEditAttribute: (attribute: Attribute) => void;
  conceptOptions: Concept[];
  allAttributes: Attribute[];
  onRefreshAttributes: () => Promise<void>;
};

export type AttributeCreationView =
  | "template-selection"
  | "custom-type-selection"
  | "configuration";

export type ConceptLabelGetter = (concept: Concept | null | undefined) => string;

export type ConfiguredConceptItem = {
  conceptId: number;
  conceptLabel: string;
  attributeId: number | null;
  attributeName: string;
  attribute?: Attribute;
};

export type CustomTypeOption = {
  type: ValueType;
  label: string;
  description?: string;
};
