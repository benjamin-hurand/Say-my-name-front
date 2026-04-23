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

import type { ConstraintPayload } from "../../../../../models/commons/Attribute/constraintPayload.schema";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import { Attribute } from "../../../../../models/commons/Attribute/Attribute";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";

export function getConceptCode(attribute?: Attribute): string | null {
  return attribute?.conceptCode ?? null;
}

export function isConceptDerived(attribute?: Attribute): boolean {
  return !!attribute?.conceptDerived;
}

export function isIdentityComponentEligible(attribute?: Attribute): boolean {
  return !!attribute?.identityComponentEligible;
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

export function getConceptIcon(
  concept?: Pick<Concept, "iconKey"> | null,
): SvgIconComponent {
  switch (concept?.iconKey) {
    case "person":
      return PersonRoundedIcon;
    case "badge":
      return BadgeRoundedIcon;
    case "nickname":
      return FaceRoundedIcon;
    case "title":
      return WorkspacePremiumRoundedIcon;
    case "gender":
      return WcRoundedIcon;
    case "identity":
      return FingerprintRoundedIcon;
    case "department":
      return BusinessRoundedIcon;
    case "promotion":
      return SchoolRoundedIcon;
    case "date":
      return EventRoundedIcon;
    default:
      return ExtensionRoundedIcon;
  }
}