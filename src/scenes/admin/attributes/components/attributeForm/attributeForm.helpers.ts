import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
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
      identitySource: !!initial.identitySource,
      filter: !!initial.filter,
      sort: !!initial.sort,
      required: !!initial.required,
      editPolicy: initial.editPolicy ?? "FREE",
      constraintKind: initial.constraintKind ?? "NONE",
      constraintPayload:
        initial.constraintPayload ??
        ({ kind: initial.constraintKind ?? "NONE" } as ConstraintPayload),
      enumOptions:
        initial.type === "ENUM"
          ? (initial.options ?? []).map((option) => option.label)
          : [],
    };
  }

  return {
    name: "",
    conceptId: null,
    type: "TEXT",
    casingStrategy: "NONE",
    maxValues: 1,
    identitySource: false,
    filter: false,
    sort: false,
    required: false,
    editPolicy: "FREE",
    constraintKind: "NONE",
    constraintPayload: { kind: "NONE" },
    enumOptions: [],
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
    case "gender":
      return WcRoundedIcon;
    case "identity":
      return FingerprintRoundedIcon;
    default:
      return ExtensionRoundedIcon;
  }
}
