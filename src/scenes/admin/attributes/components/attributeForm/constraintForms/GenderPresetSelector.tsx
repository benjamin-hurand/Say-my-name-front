import { Button, Stack } from "@mui/material";
import { useMemo } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";
import EnumValuesForm from "./EnumValuesForm";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
};

const PRESETS = [
  { key: "HF", label: "Homme / Femme", values: ["Homme", "Femme"] },
  { key: "HFA", label: "Homme / Femme / Autre", values: ["Homme", "Femme", "Autre"] },
  { key: "MF", label: "Masculin / Féminin", values: ["Masculin", "Féminin"] },
];

export default function GenderPresetSelector({ control, watch, setValue }: Props) {
  const values = watch("enumOptions");

  const activeKey = useMemo(() => {
    const current = Array.isArray(values) ? values : [];

    for (const preset of PRESETS) {
      if (
        preset.values.length === current.length &&
        preset.values.every((v, index) => v === current[index])
      ) {
        return preset.key;
      }
    }

    return "CUSTOM";
  }, [values]);

  const applyPreset = (presetValues: string[]) => {
    setValue("enumOptions", presetValues, { shouldDirty: true });
  };

  const enableCustom = () => {
    // Passe en mode personnalisé — les valeurs actuelles sont conservées
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            variant={activeKey === preset.key ? "contained" : "outlined"}
            onClick={() => applyPreset(preset.values)}
          >
            {preset.label}
          </Button>
        ))}

        <Button
          type="button"
          variant={activeKey === "CUSTOM" ? "contained" : "outlined"}
          onClick={enableCustom}
        >
          Liste personnalisée
        </Button>
      </Stack>

      {activeKey === "CUSTOM" && (
        <EnumValuesForm
          control={control}
          watch={watch}
          setValue={setValue}
          label="Ajouter une valeur"
          placeholder="Ex. Homme"
        />
      )}
    </Stack>
  );
}