import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import type { SvgIconComponent } from "@mui/icons-material";

import type { ConstraintPayload } from "../../../../../models/commons/Attribute/constraintPayload.schema";
import type { Concept } from "../../../../../models/commons/Concept/Concept";
import { Attribute, type ValueType } from "../../../../../models/commons/Attribute/Attribute";
import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";

export function getValueTypeLabel(
  valueType: ValueType,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  switch (valueType) {
    case "TEXT":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.TEXT", { defaultValue: "Texte" });
    case "ENUM":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.ENUM", { defaultValue: "Liste de choix" });
    case "NUMBER":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.NUMBER", { defaultValue: "Nombre" });
    case "DATE":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.DATE", { defaultValue: "Date" });
    case "DATETIME":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.DATETIME", { defaultValue: "Date & heure" });
    case "BOOLEAN":
      return t("ATTRIBUTE_FORM.VALUE_TYPE.BOOLEAN", { defaultValue: "Oui / Non" });
    default:
      return valueType;
  }
}

export function getConceptCode(attribute?: Attribute): string | null {
  return attribute?.conceptCode ?? null;
}

export function isConceptDerived(attribute?: Attribute): boolean {
  return !!attribute?.conceptDerived;
}

export function isIdentityComponentEligible(attribute?: Attribute): boolean {
  return !!attribute?.identityComponentEligible;
}

export function makeDefaultValues(
  initial?: Attribute,
  presetIdentitySource?: boolean,
): AttributeCreateFormInput {
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
    identitySource: !!presetIdentitySource,
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
