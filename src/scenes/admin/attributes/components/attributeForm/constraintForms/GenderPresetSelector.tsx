import { Chip, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import type { UseFormSetValue } from "react-hook-form";

import type { AttributeCreateFormInput } from "../../../validation/attributeCreate.schema";
import { GENDER_PRESET_VALUES } from "./genderPreset.utils";

type Props = {
  setValue: UseFormSetValue<AttributeCreateFormInput>;
};

/**
 * GENDER is a system-managed concept: there is no "Liste personnalisée"
 * escape hatch here (unlike a custom ENUM attribute). The preset is applied
 * unconditionally so the form always submits a non-empty enumOptions value;
 * the backend ignores it anyway and provisions its own stable codes.
 */
export default function GenderPresetSelector({ setValue }: Props) {
  useEffect(() => {
    setValue("enumOptions", [...GENDER_PRESET_VALUES], { shouldDirty: false });
  }, [setValue]);

  return (
    <Stack spacing={1}>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {GENDER_PRESET_VALUES.map((label) => (
          <Chip key={label} label={label} />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Utilisé pour proposer des distracteurs de prénom plus pertinents.
      </Typography>
    </Stack>
  );
}
