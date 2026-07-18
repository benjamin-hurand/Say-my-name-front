import type { TFunction } from "i18next";

export type EnumAffordance = "GENDER_PRESET";

type EnumCopyDefinition = {
  titleKey: string;
  titleDefault: string;
  subtitleKey: string;
  subtitleDefault: string;
  addLabelKey: string;
  addLabelDefault: string;
  placeholderKey: string;
  placeholderDefault: string;
};

export type ResolvedEnumCopy = {
  title: string;
  subtitle: string;
  addLabel: string;
  placeholder: string;
};

export type SemanticPresetConfig = {
  enumAffordance?: EnumAffordance;
  enumCopy?: EnumCopyDefinition;
};

const CONFIG_VALUES_TITLE = {
  key: "ATTRIBUTE_FORM.CONFIG_VALUES_TITLE",
  defaultValue: "Quelles valeurs proposer ?",
};

export const semanticPresetRegistry: Record<string, SemanticPresetConfig> = {
  GENDER: {
    enumAffordance: "GENDER_PRESET",
  },
  DEPARTMENT: {
    enumCopy: {
      titleKey: CONFIG_VALUES_TITLE.key,
      titleDefault: CONFIG_VALUES_TITLE.defaultValue,
      subtitleKey: "ATTRIBUTE_FORM.CONFIG_VALUES_SUBTITLE_DEPARTMENT",
      subtitleDefault: "Definis les departements disponibles.",
      addLabelKey: "ATTRIBUTE_FORM.ENUM_ADD_DEPARTMENT",
      addLabelDefault: "Ajouter un departement",
      placeholderKey: "ATTRIBUTE_FORM.ENUM_DEPARTMENT_PLACEHOLDER",
      placeholderDefault: "Ex. Marketing",
    },
  },
  PROMOTION: {
    enumCopy: {
      titleKey: CONFIG_VALUES_TITLE.key,
      titleDefault: CONFIG_VALUES_TITLE.defaultValue,
      subtitleKey: "ATTRIBUTE_FORM.CONFIG_VALUES_SUBTITLE_PROMOTION",
      subtitleDefault: "Definis les promotions disponibles.",
      addLabelKey: "ATTRIBUTE_FORM.ENUM_ADD_PROMOTION",
      addLabelDefault: "Ajouter une promotion",
      placeholderKey: "ATTRIBUTE_FORM.ENUM_PROMOTION_PLACEHOLDER",
      placeholderDefault: "Ex. 2026",
    },
  },
};

export function getSemanticPresetConfig(
  semanticPresetCode: string | null | undefined,
): SemanticPresetConfig | null {
  if (!semanticPresetCode) return null;
  return semanticPresetRegistry[semanticPresetCode] ?? null;
}

export function resolveEnumCopy(
  t: TFunction,
  semanticPresetCode: string | null | undefined,
): ResolvedEnumCopy {
  const defaultCopy: EnumCopyDefinition = {
    titleKey: "ATTRIBUTE_FORM.CONFIG_ENUM_TITLE",
    titleDefault: "Quelles options proposer ?",
    subtitleKey: "ATTRIBUTE_FORM.CONFIG_ENUM_SUBTITLE",
    subtitleDefault: "Definis les choix disponibles.",
    addLabelKey: "ATTRIBUTE_FORM.ENUM_ADD_OPTION",
    addLabelDefault: "Ajouter une option",
    placeholderKey: "ATTRIBUTE_FORM.ENUM_OPTION_PLACEHOLDER",
    placeholderDefault: "Ex. Senior",
  };

  const copy = getSemanticPresetConfig(semanticPresetCode)?.enumCopy ?? defaultCopy;

  return {
    title: t(copy.titleKey, { defaultValue: copy.titleDefault }),
    subtitle: t(copy.subtitleKey, { defaultValue: copy.subtitleDefault }),
    addLabel: t(copy.addLabelKey, { defaultValue: copy.addLabelDefault }),
    placeholder: t(copy.placeholderKey, { defaultValue: copy.placeholderDefault }),
  };
}
