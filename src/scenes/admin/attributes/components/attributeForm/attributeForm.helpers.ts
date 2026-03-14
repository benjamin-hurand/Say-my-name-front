import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import type { SvgIconComponent } from "@mui/icons-material";

import {
  ATTRIBUTE_TYPES,
  type Attribute,
  type AttributeType,
} from "../../../../../models/commons/Attribute/Attribute";
import type { ConstraintPayload } from "../../../../../models/commons/Attribute/constraintPayload.schema";
import type { Concept, ConceptValueType } from "../../../../../models/commons/Concept/Concept";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import {
  CONCEPT_PRESETS,
  CONCEPT_TYPE_COMPATIBILITY,
} from "./attributeForm.constants";

export function getConceptCode(attribute?: Attribute): string | null {
  return attribute?.conceptCode ?? null;
}

export function getConceptValueType(attribute?: Attribute): ConceptValueType | null {
  return attribute?.conceptValueType ?? null;
}

export function isConceptDerived(attribute?: Attribute): boolean {
  return !!attribute?.conceptDerived;
}

export function isIdentityComponentEligible(attribute?: Attribute): boolean {
  return !!attribute?.identityComponentEligible;
}

export function getAllowedTypesFromConcept(
  concept: Concept | null | undefined,
): AttributeType[] {
  if (!concept) return [...ATTRIBUTE_TYPES];
  const preset = CONCEPT_PRESETS[concept.code];
  if (preset?.allowedTypes?.length) return [...preset.allowedTypes];
  return CONCEPT_TYPE_COMPATIBILITY[concept.valueType] ?? [...ATTRIBUTE_TYPES];
}

export function makeDefaultValues(initial?: Attribute): AttributeCreateFormInput {
  if (initial) {
    return {
      name: initial.name ?? "",
      conceptId: initial.conceptId ?? null,
      type: initial.type ?? "TEXT",
      casingStrategy: initial.casingStrategy ?? "NONE",
      maxValues: initial.maxValues ?? 1,
      primaryField: !!initial.identitySource,
      category: !!initial.category,
      filter: !!initial.filter,
      sort: !!initial.sort,
      required: !!initial.required,
      editPolicy: initial.editPolicy ?? "FREE",
      constraintKind: initial.constraintKind ?? "NONE",
      constraintPayload:
        initial.constraintPayload ??
        ({ kind: initial.constraintKind ?? "NONE" } as ConstraintPayload),
    };
  }

  return {
    name: "",
    conceptId: null,
    type: "TEXT",
    casingStrategy: "NONE",
    maxValues: 1,
    primaryField: false,
    category: false,
    filter: false,
    sort: false,
    required: false,
    editPolicy: "FREE",
    constraintKind: "NONE",
    constraintPayload: { kind: "NONE" },
  };
}

export function getConceptIcon(code?: string | null): SvgIconComponent {
  switch (code) {
    case "FIRST_NAME":
      return PersonRoundedIcon;
    case "LAST_NAME":
      return BadgeRoundedIcon;
    case "NICKNAME":
      return FaceRoundedIcon;
    case "TITLE":
      return WorkspacePremiumRoundedIcon;
    case "GENDER":
      return WcRoundedIcon;
    case "IDENTITY":
      return FingerprintRoundedIcon;
    case "DEPARTMENT":
      return BusinessRoundedIcon;
    case "PROMOTION":
      return SchoolRoundedIcon;
    case "ARRIVAL_DATE":
      return EventRoundedIcon;
    default:
      return ExtensionRoundedIcon;
  }
}