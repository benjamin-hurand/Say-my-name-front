import { Button, Stack } from "@mui/material";
import { useMemo, useState } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";
import EnumValuesForm from "./EnumValuesForm";
import {
  CUSTOM_GENDER_PRESET_KEY,
  GENDER_PRESETS,
  resolveActiveGenderPresetKey,
} from "./genderPreset.utils";

type Props = {
  control: Control<AttributeCreateFormInput>;
  watch: UseFormWatch<AttributeCreateFormInput>;
  setValue: UseFormSetValue<AttributeCreateFormInput>;
  errorMessage?: string;
};

export default function GenderPresetSelector({ control, watch, setValue, errorMessage }: Props) {
  const values = watch("enumOptions");
  const [manualMode, setManualMode] = useState(false);

  const activeKey = useMemo(
    () => resolveActiveGenderPresetKey(values, manualMode),
    [values, manualMode],
  );

  const applyPreset = (presetValues: string[]) => {
    setManualMode(false);
    setValue("enumOptions", presetValues, { shouldDirty: true });
  };

  const enableCustom = () => {
    setManualMode(true);
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {GENDER_PRESETS.map((preset) => (
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
          variant={activeKey === CUSTOM_GENDER_PRESET_KEY ? "contained" : "outlined"}
          onClick={enableCustom}
        >
          Liste personnalisée
        </Button>
      </Stack>

      {activeKey === CUSTOM_GENDER_PRESET_KEY && (
        <EnumValuesForm
          control={control}
          watch={watch}
          setValue={setValue}
          label="Ajouter une valeur"
          placeholder="Ex. Homme"
          errorMessage={errorMessage}
        />
      )}
    </Stack>
  );
}
