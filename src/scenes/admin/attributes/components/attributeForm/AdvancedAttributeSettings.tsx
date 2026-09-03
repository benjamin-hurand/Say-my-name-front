import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AttributeCreateFormInput } from "../../validation/attributeCreate.schema";
import SettingRow from "./shared/SettingRow";

type Props = {
  control: Control<AttributeCreateFormInput>;
  initiallyExpanded: boolean;
};

export default function AdvancedAttributeSettings({
  control,
  initiallyExpanded,
}: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    setExpanded(initiallyExpanded);
  }, [initiallyExpanded]);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
      disableGutters
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        "&::before": { display: "none" },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon />}
        sx={{ px: 0, minHeight: 52, "& .MuiAccordionSummary-content": { my: 1 } }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {t("ATTRIBUTE_FORM.ADVANCED_SETTINGS_TITLE", {
            defaultValue: "Réglages avancés",
          })}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 0, pt: 0, pb: 0.5 }}>
        <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
          <Controller
            name="filter"
            control={control}
            render={({ field }) => (
              <SettingRow
                label={t("ATTRIBUTE_FORM.SETTINGS.FILTER_LABEL", {
                  defaultValue: "Disponible dans les filtres",
                })}
                description={t("ATTRIBUTE_FORM.SETTINGS.FILTER_DESC", {
                  defaultValue: "Permet d'utiliser ce champ pour filtrer le trombinoscope.",
                })}
                checked={!!field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="sort"
            control={control}
            render={({ field }) => (
              <SettingRow
                label={t("ATTRIBUTE_FORM.SETTINGS.SORT_LABEL", {
                  defaultValue: "Disponible pour le tri",
                })}
                description={t("ATTRIBUTE_FORM.SETTINGS.SORT_DESC", {
                  defaultValue: "Permet de trier les personnes selon ce champ.",
                })}
                checked={!!field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
