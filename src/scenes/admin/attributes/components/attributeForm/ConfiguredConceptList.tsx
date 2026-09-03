import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Button, Collapse, Divider, Stack, Typography } from "@mui/material";
import { Fragment, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Attribute } from "../../../../../models/commons/Attribute/Attribute";
import type { ConfiguredConceptItem } from "./attributeForm.types";

type Props = {
  items: ConfiguredConceptItem[];
  onEditAttribute: (attribute: Attribute) => void;
};

export default function ConfiguredConceptList({
  items,
  onEditAttribute,
}: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  if (items.length === 0) {
    return null;
  }

  return (
    <Stack component="section" spacing={1}>
      <Box
        component="button"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          alignSelf: "flex-start",
          border: "none",
          background: "none",
          p: 0,
          minHeight: 36,
          cursor: "pointer",
          color: theme.palette.text.secondary,
          font: "inherit",
          "&:hover": { color: theme.palette.text.primary },
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
            borderRadius: 1,
          },
        })}
      >
        <Typography variant="subtitle2" fontWeight={700} color="inherit">
          {t("ATTRIBUTE_FORM.CONFIGURED_FIELDS_TITLE", {
            count: items.length,
            defaultValue: "Déjà configurés ({{count}})",
          })}
        </Typography>
        <ExpandMoreRoundedIcon
          fontSize="small"
          sx={{
            transition: (theme) => theme.transitions.create("transform"),
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </Box>

      <Collapse in={expanded} id={contentId}>
        <Box>
          {items.map((item, index) => {
            const associatedAttribute = item.attribute;
            const displayedAttributeName =
              item.attributeName ||
              t("ATTRIBUTE_FORM.UNKNOWN_FIELD_NAME", {
                defaultValue: "Champ introuvable",
              });

            return (
              <Fragment key={item.conceptId}>
                {index > 0 ? <Divider /> : null}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "minmax(0, 1fr) auto",
                      sm: "minmax(140px, 0.7fr) minmax(0, 1.3fr) auto",
                    },
                    gridTemplateAreas: {
                      xs: '"concept action" "attribute action"',
                      sm: '"concept attribute action"',
                    },
                    columnGap: { xs: 1, sm: 2 },
                    rowGap: 0.35,
                    alignItems: "center",
                    minWidth: 0,
                    py: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      gridArea: "concept",
                      minWidth: 0,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.conceptLabel}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      gridArea: "attribute",
                      minWidth: 0,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {t("ATTRIBUTE_FORM.CONFIGURED_FIELD_NAME", {
                      name: displayedAttributeName,
                      defaultValue: "Champ : « {{name}} »",
                    })}
                  </Typography>

                  {associatedAttribute ? (
                    <Button
                      type="button"
                      variant="text"
                      size="small"
                      onClick={() => onEditAttribute(associatedAttribute)}
                      aria-label={t("ATTRIBUTE_FORM.EDIT_CONFIGURED_FIELD_ARIA", {
                        name: displayedAttributeName,
                        concept: item.conceptLabel,
                        defaultValue: "Modifier le champ {{name}}",
                      })}
                      sx={{
                        gridArea: "action",
                        minHeight: 44,
                        minWidth: 0,
                        px: 1,
                        alignSelf: "center",
                      }}
                    >
                      {t("ATTRIBUTE_FORM.EDIT_CONFIGURED_FIELD", {
                        defaultValue: "Modifier",
                      })}
                    </Button>
                  ) : null}
                </Box>
              </Fragment>
            );
          })}
        </Box>
      </Collapse>
    </Stack>
  );
}
