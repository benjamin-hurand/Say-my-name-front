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
  casingPreviewSource?: string;
};

export const semanticPresetRegistry: Record<string, SemanticPresetConfig> = {
  FIRST_NAME: {
    casingPreviewSource: "jean baptiste",
  },
  LAST_NAME: {
    casingPreviewSource: "dupont martin",
  },
  GENDER: {
    enumAffordance: "GENDER_PRESET",
  },
};

const DEFAULT_CASING_PREVIEW_SOURCE = "exemple de texte";

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

export function resolveCasingPreviewSource(
  semanticPresetCode: string | null | undefined,
): string {
  return (
    getSemanticPresetConfig(semanticPresetCode)?.casingPreviewSource ??
    DEFAULT_CASING_PREVIEW_SOURCE
  );
}
