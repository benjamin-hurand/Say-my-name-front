import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { Concept } from "../../../../../models/commons/Concept/Concept";
import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";
import type { ConceptLabelGetter } from "./attributeForm.types";

type Props = {
  selectedConcept: Concept | null;
  effectiveValueType: ValueType;
  valueTypeLabel: string;
  isCustom: boolean;
  getConceptLabel: ConceptLabelGetter;
  onChangeConcept: () => void;
  onChangeType: () => void;
};

export default function SelectedFieldSummary({
  selectedConcept,
  effectiveValueType,
  valueTypeLabel,
  isCustom,
  getConceptLabel,
  onChangeConcept,
  onChangeType,
}: Props) {
  const { t } = useTranslation();

  const title = selectedConcept
    ? getConceptLabel(selectedConcept)
    : t("ATTRIBUTE_FORM.CUSTOM_TEMPLATE", {
        defaultValue: "Champ personnalise",
      });

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
        borderRadius: 2.5,
        px: { xs: 1.5, sm: 1.75 },
        py: 1.5,
        backgroundColor: alpha(theme.palette.background.paper, 0.62),
      })}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography variant="subtitle2" fontWeight={800} sx={{ minWidth: 0 }}>
              {title}
            </Typography>

            <Chip
              size="small"
              color="warning"
              label={valueTypeLabel || effectiveValueType}
              variant="outlined"
            />
          </Stack>

        </Box>

        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<SwapHorizRoundedIcon fontSize="small" />}
            onClick={onChangeConcept}
          >
            {t("ATTRIBUTE_FORM.CHANGE_MODEL", { defaultValue: "Changer de modele" })}
          </Button>

          {isCustom ? (
            <Button
              type="button"
              size="small"
              variant="outlined"
              startIcon={<EditRoundedIcon fontSize="small" />}
              onClick={onChangeType}
            >
              {t("ATTRIBUTE_FORM.CHANGE_TYPE", { defaultValue: "Changer de type" })}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
