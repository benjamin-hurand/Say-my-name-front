import React, { useMemo } from "react";
import { Drawer, Box, Stack, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CloseIcon from "@mui/icons-material/Close";
import { PersonCardDto } from "../../../services/dto/person/search/PersonCardDtos";
import { getPersonDisplayName } from "../../../utils/personDisplayName";

type Props = {
  open: boolean;
  person: PersonCardDto | null;
  onClose: () => void;
  // suivi
  isFollowed: (id: number) => boolean;
  followOverrides?: Record<number, boolean | undefined>;
  followPending?: Set<number>;
  onToggleFollow: (id: number, target: boolean) => Promise<void>;
};

const PersonPeekDrawer: React.FC<Props> = ({
  open, person, onClose,
  isFollowed, followOverrides, followPending,
  onToggleFollow,
}) => {
  const name = useMemo(() => getPersonDisplayName(person), [person]);

  const followed = useMemo(() => {
    if (!person) return false;
    const base = isFollowed(person.idPerson) || !!person.followed;
    if (followOverrides && person.idPerson in followOverrides) {
      return !!followOverrides[person.idPerson];
    }
    return base;
  }, [person, isFollowed, followOverrides]);

  const pending = !!(person && followPending && followPending.has(person.idPerson));
  const largeSrc = person?.photoLargeUrl || person?.photoSmallUrl || undefined;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: "88vh",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: "hidden",
        }
      }}
    >
      {person && (
        <Box sx={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: 300 }}>
          {/* Header simple */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
            <Typography variant="h6" fontWeight={700} noWrap title={name}>
              {name}
            </Typography>
            <IconButton onClick={onClose} aria-label="Fermer"><CloseIcon /></IconButton>
          </Stack>

          {/* Contenu */}
          <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, overflow: "auto" }}>
            {/* Grande photo rectangulaire */}
            <Box
              sx={{
                width: "100%",
                maxHeight: { xs: "60vh", sm: "65vh" },
                bgcolor: "black",
                borderRadius: 2,
                overflow: "hidden",
                mb: 1.5,
              }}
            >
              {largeSrc ? (
                <Box
                  component="img"
                  src={largeSrc}
                  alt={name}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",   // pas rond, grand format
                    userSelect: "none",
                  }}
                />
              ) : (
                <Box sx={{ height: 240 }} />
              )}
            </Box>

            {/* Actions / suivi */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Tooltip title={followed ? "Ne plus suivre" : "Suivre"}>
                <span>
                  <Chip
                    size="small"
                    icon={<StarRoundedIcon sx={{ fontSize: 16 }} />}
                    label={followed ? "Suivi" : "Suivre"}
                    color={followed ? "success" : "default"}
                    variant={followed ? "filled" : "outlined"}
                    onClick={async () => { if (!pending) await onToggleFollow(person.idPerson, !followed); }}
                    sx={{ height: 26, "& .MuiChip-label": { px: 0.9 } }}
                  />
                </span>
              </Tooltip>
            </Stack>

            {/* Infos rapides */}
            <Stack spacing={0.5}>
              {(person.extraAttributes ?? [])
                .filter(e => !!e?.value)
                .slice(0, 12)
                .map(e => (
                  <Typography key={`${e.attributeId}-${e.value}`} variant="body2">
                    • {e.value}
                  </Typography>
                ))}
            </Stack>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default PersonPeekDrawer;
