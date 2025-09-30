import * as React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stack,
  Typography,
  Skeleton,
} from '@mui/material';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { useTheme, alpha } from '@mui/material/styles';

type Props = {
  loading?: boolean;

  // Contenu
  title: string;
  subtitle?: string;

  // Etat implicite
  active: boolean;            // true si en cours, false si jamais lancé
  progressPercent?: number;   // 0..100 (si active)
  dueNow?: number;            // n'afficher que si active

  // Action principale (toute la carte)
  onPrimary: () => void;

  // Actions avancées (menu ⋮)
  onRestart?: () => void;

  dense?: boolean;
};

export default function CourseTile({
  loading,
  title,
  subtitle,
  active,
  progressPercent,
  dueNow,
  onPrimary,
  onRestart,
  dense = false,
}: Props) {
  const theme = useTheme();
  const neon = theme.palette?.accent?.main ?? theme.palette?.primary?.main ?? '#00eaff';
  const safeAlpha = (c: string, a: number) => {
    try { return alpha(c, a); } catch { return c; }
  };

  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(menuEl);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const showProgress = active && typeof progressPercent === 'number' && !Number.isNaN(progressPercent);
  const pct = Math.max(0, Math.min(100, Math.round(progressPercent ?? 0)));

  if (loading) {
    return (
      <Card variant="outlined" className="menu" sx={{ overflow: 'hidden', borderRadius: 6 }}>
        <Box sx={{ position: 'relative' }}>
          <CardActionArea sx={{ p: dense ? 1 : 1.25 }}>
            <Stack spacing={0.7}>
              <Skeleton variant="text" width="60%" sx={{ fontSize: dense ? '0.95rem' : '1.05rem' }} />
              <Skeleton variant="text" width="42%" />
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 999 }} />
            </Stack>
          </CardActionArea>
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card
        variant="outlined"
        className="menu"
        sx={{
          borderRadius: 6,
          overflow: 'hidden',
          borderColor: neon,
          boxShadow: `0 0 8px ${safeAlpha(neon, 0.35)}`,
          // IMPORTANT: pas de &:hover ici → le hover est géré sur CardActionArea seulement
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Menu ⋮ en absolu — ne colore pas la carte au survol */}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}
          >
            <IconButton
              size="small"
              onClick={(e) => setMenuEl(e.currentTarget)}
              aria-label="Plus d'actions"
            >
              <MoreVertRounded />
            </IconButton>
          </Box>

          {/* Toute la carte = CTA (et c’est SEULEMENT cette zone qui a le hover) */}
          <CardActionArea
            onClick={onPrimary}
            sx={{
              px: { xs: dense ? 1 : 1.25, sm: dense ? 1 : 1.5 },
              py: { xs: dense ? 0.9 : 1.1, sm: dense ? 1 : 1.25 },
              '&:hover': {
                backgroundColor: safeAlpha(neon, theme.palette.mode === 'dark' ? 0.06 : 0.08),
              },
              '&.Mui-focusVisible': { outline: `2px solid ${neon}`, outlineOffset: 2 },
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Titre + sous-titre (ellipsis) */}
              <Box sx={{ minWidth: 0, pr: 5 /* espace pour ⋮ */ }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  noWrap
                  title={title}
                  sx={{ color: neon, textShadow: `0 0 6px ${safeAlpha(neon, 0.8)}` }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    title={subtitle}
                    sx={{ display: 'block' }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {/* Contenu état implicite */}
              {showProgress ? (
                <>
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      aria-label="Progression du parcours"
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: safeAlpha(neon, 0.2),
                        boxShadow: `0 0 6px ${safeAlpha(neon, 0.25)} inset`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: neon,
                          boxShadow: `0 0 8px ${safeAlpha(neon, 0.9)}`,
                        },
                      }}
                    />
                  </Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 0.5, gap: 1, flexWrap: 'wrap' }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {pct}% de progression{dueNow && dueNow > 0 ? ` • ${dueNow} à réviser` : ''}
                    </Typography>

                    {/* Indication d’action (pas un bouton) */}
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Reprendre là où vous en étiez
                    </Typography>
                  </Stack>
                </>
              ) : (
                // Non démarré
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                  Jamais lancé. Cliquer pour démarrer.
                </Typography>
              )}
            </CardContent>
          </CardActionArea>
        </Box>
      </Card>

      {/* Menu ⋮ (ne déclenche pas le hover de la carte) */}
      <Menu
        anchorEl={menuEl}
        open={openMenu}
        onClose={() => setMenuEl(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          disabled={!onRestart}
          onClick={() => {
            setMenuEl(null);
            setConfirmOpen(true);
          }}
        >
          Redémarrer le parcours…
        </MenuItem>
      </Menu>

      {/* Confirmation Redémarrer */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Redémarrer ce parcours ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cela remettra à zéro votre progression pour ce parcours. Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              onRestart?.();
            }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
