export type GenderPreset = { key: string; label: string; values: string[] };

export const GENDER_PRESETS: GenderPreset[] = [
  { key: "HF", label: "Homme / Femme", values: ["Homme", "Femme"] },
  { key: "HFA", label: "Homme / Femme / Autre", values: ["Homme", "Femme", "Autre"] },
  { key: "MF", label: "Masculin / Féminin", values: ["Masculin", "Féminin"] },
];

export const CUSTOM_GENDER_PRESET_KEY = "CUSTOM";

/**
 * The active preset is manual-mode-first: once the admin explicitly asks
 * for the custom list, it stays selected even if the current values happen
 * to match a preset exactly. Otherwise it falls back to deducing the match
 * from the current values, as before.
 */
export function resolveActiveGenderPresetKey(
  values: readonly string[] | undefined,
  manualMode: boolean,
): string {
  if (manualMode) return CUSTOM_GENDER_PRESET_KEY;

  const current = Array.isArray(values) ? values : [];

  const match = GENDER_PRESETS.find(
    (preset) =>
      preset.values.length === current.length &&
      preset.values.every((value, index) => value === current[index]),
  );

  return match?.key ?? CUSTOM_GENDER_PRESET_KEY;
}
