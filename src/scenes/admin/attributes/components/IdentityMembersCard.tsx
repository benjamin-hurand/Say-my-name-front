import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { buildIdentityPreview } from "./identity.utils";

type Props = {
  /** Must already be sorted by displayOrder (ascending). */
  sources: Attribute[];
  onMove: (attributeId: number, direction: "up" | "down") => void;
  onEditSource: (attribute: Attribute) => void;
  onCreateSource: () => void;
};

export default function IdentityMembersCard({
  sources,
  onMove,
  onEditSource,
  onCreateSource,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const preview = buildIdentityPreview(sources);

  return (
    <Card variant="outlined" sx={{ overflow: "visible" }}>
      <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FingerprintRoundedIcon color="primary" fontSize="small" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {t("ATTRIBUTE_UI.IDENTITY.TITLE", { defaultValue: "Identité des membres" })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("ATTRIBUTE_UI.IDENTITY.SUBTITLE", {
                  defaultValue:
                    "Ces champs composent, dans cet ordre, le nom affiché de chaque personne.",
                })}
              </Typography>
            </Box>
          </Box>

          {sources.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("ATTRIBUTE_UI.IDENTITY.EMPTY", {
                defaultValue: "Aucune source d’identité configurée pour le moment.",
              })}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {sources.map((source, index) => {
                const name =
                  source.name ||
                  t("ATTRIBUTE_UI.UNNAMED_ATTRIBUTE", { defaultValue: "Champ sans nom" });

                return (
                  <Box
                    key={source.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      minWidth: 0,
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                      backgroundColor: alpha(theme.palette.background.paper, 0.65),
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </Typography>

                    <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
                      <Tooltip
                        title={t("ATTRIBUTE_UI.IDENTITY.MOVE_UP_ARIA", {
                          name,
                          defaultValue: `Monter ${name}`,
                        })}
                      >
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === 0}
                            onClick={() => onMove(source.id, "up")}
                            aria-label={t("ATTRIBUTE_UI.IDENTITY.MOVE_UP_ARIA", {
                              name,
                              defaultValue: `Monter ${name}`,
                            })}
                          >
                            <ArrowUpwardRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip
                        title={t("ATTRIBUTE_UI.IDENTITY.MOVE_DOWN_ARIA", {
                          name,
                          defaultValue: `Descendre ${name}`,
                        })}
                      >
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === sources.length - 1}
                            onClick={() => onMove(source.id, "down")}
                            aria-label={t("ATTRIBUTE_UI.IDENTITY.MOVE_DOWN_ARIA", {
                              name,
                              defaultValue: `Descendre ${name}`,
                            })}
                          >
                            <ArrowDownwardRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={t("ATTRIBUTE_UI.EDIT", { defaultValue: "Modifier" })}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onEditSource(source)}
                            aria-label={t("ATTRIBUTE_UI.EDIT_ARIA", {
                              name,
                              defaultValue: `Modifier le champ ${name}`,
                            })}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          <Divider />

          <Box>
            <Typography variant="overline" color="text.secondary">
              {t("ATTRIBUTE_UI.IDENTITY.PREVIEW_LABEL", { defaultValue: "Aperçu" })}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ wordBreak: "break-word" }}>
              {preview || t("ATTRIBUTE_UI.IDENTITY.PREVIEW_EMPTY", { defaultValue: "—" })}
            </Typography>
          </Box>

          <Button
            type="button"
            variant="text"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={onCreateSource}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("ATTRIBUTE_UI.IDENTITY.ADD_SOURCE_CTA", {
              defaultValue: "Ajouter un champ comme source d’identité",
            })}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
