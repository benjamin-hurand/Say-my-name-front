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
  Skeleton,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { useTheme, alpha } from '@mui/material/styles';

type MenuItemDef = { label: string; danger?: boolean; onClick: () => void };
type Tone = 'primary' | 'muted';

type Props = {
  loading?: boolean;
  hasCourse: boolean;
  headline: string;
  modeLabel?: string;
  progressPercent?: number;
  actionHint?: string;
  rightNote?: string; // <- on l’ignore désormais dans l’affichage
  onPrimary: () => void;
  showMenu?: boolean;
  menuItems?: MenuItemDef[];
  dense?: boolean;
  tone?: Tone;
};

const CardSkeleton = ({ dense }: { dense?: boolean }) => (
  <Card variant="outlined" className="menu" sx={{ overflow: 'hidden', borderRadius: 6 }}>
    <CardActionArea sx={{ p: dense ? 1 : 2 }}>
      <Stack spacing={dense ? 0.6 : 1} alignItems="center" textAlign="center">
        <Skeleton variant="text" width={220} sx={{ fontSize: dense ? '0.95rem' : '1.1rem' }} />
        <Skeleton variant="rectangular" width="100%" height={dense ? 5 : 8} />
      </Stack>
    </CardActionArea>
  </Card>
);

export default function CourseQuickStart({
  loading,
  hasCourse,
  headline,
  modeLabel,
  progressPercent,
  actionHint,
  rightNote, // eslint-disable-line @typescript-eslint/no-unused-vars
  onPrimary,
  showMenu = false,
  menuItems = [],
  dense = false,
  tone,
}: Props) {
  const theme = useTheme();

  const neon = theme.palette?.accent?.main ?? theme.palette?.primary?.main ?? '#00eaff';
  const onNeon =
    (theme.palette?.getContrastText ? theme.palette.getContrastText(neon) : '#000') || '#000';

  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const chipTextDark = theme.palette.mode === 'dark' ? '#121212' : '#242424';

  const a = (c: string, v: number) => {
    try { return alpha(c, v); } catch { return c; }
  };

  if (loading) return <CardSkeleton dense={dense} />;

  const effectiveTone: Tone = tone ?? (hasCourse ? 'primary' : 'muted');
  const isPrimary = effectiveTone === 'primary';

  const showProgress =
    hasCourse && typeof progressPercent === 'number' && !Number.isNaN(progressPercent);
  const pct = Math.max(0, Math.min(100, Math.round(progressPercent ?? 0)));

  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(menuEl);

  const baseCardBg =
    theme.palette.mode === 'dark' ? 'rgba(36,36,36,0.35)' : 'rgba(255,255,255,0.75)';

  return (
    <Card
      variant="outlined"
      className="menu"
      sx={{
        '--smn-card-bg': baseCardBg,
        borderRadius: 6,
        borderColor: isPrimary ? neon : a(neon, 0.25),
        boxShadow: isPrimary ? `0 0 8px ${a(neon, 0.35)}` : `0 0 6px ${a(neon, 0.15)}`,
        overflow: 'hidden',
        backgroundColor: 'var(--smn-card-bg)',
      } as any}
    >
      <Box sx={{ position: 'relative' }}>
        {showMenu && (
          <Box onClick={(e) => e.stopPropagation()} sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
            <IconButton size="small" onClick={(e) => setMenuEl(e.currentTarget)} aria-label="Plus d'actions">
              <MoreVertRounded />
            </IconButton>
          </Box>
        )}

        <CardActionArea
          onClick={onPrimary}
          sx={{
            p: { xs: dense ? 1 : 2, sm: dense ? 1.1 : 2.25 },
            textAlign: 'center',
            transition: 'background-color .5s, box-shadow .5s, color .5s',
            ...(isPrimary
              ? {
                  '&:hover': {
                    backgroundColor: neon,
                    boxShadow: `0 0 30px ${neon}`,
                    '& .accentText': { color: onNeon, textShadow: `0 0 8px ${onNeon}` },
                    '& .hintText': { color: onNeon, opacity: 0.95 },
                    '& .progressRoot': {
                      backgroundColor: a(onNeon, 0.2),
                      boxShadow: `0 0 6px ${a(onNeon, 0.4)} inset`,
                    },
                    '& .progressRoot .MuiLinearProgress-bar': {
                      backgroundColor: onNeon,
                      boxShadow: `0 0 10px ${onNeon}`,
                    },
                  },
                }
              : {
                  '&:hover': {
                    boxShadow: `0 0 16px ${a(neon, 0.35)}`,
                    '& .accentText': { color: neon, textShadow: `0 0 6px ${a(neon, 0.8)}` },
                    '& .hintText': { color: textPrimary, opacity: 0.95 },
                  },
                }),
            '&.Mui-focusVisible': { outline: `2px solid ${neon}`, outlineOffset: 2 },
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Stack spacing={dense ? 0.5 : 0.8} alignItems="center">
              <Typography
                variant="h6"
                className="accentText"
                sx={{
                  color: isPrimary ? neon : a(neon, 0.6),
                  textShadow: isPrimary ? `0 0 6px ${neon}` : 'none',
                  fontFamily: theme.typography.button.fontFamily,
                  letterSpacing: theme.typography.button.letterSpacing,
                  lineHeight: 1.15,
                  fontSize: dense ? '1rem' : '1.1rem',
                }}
              >
                {headline}
              </Typography>

              {modeLabel && (
                <Chip
                  className="chipMode"
                  label={modeLabel}
                  size="small"
                  sx={{
                    position: 'relative',
                    isolation: 'isolate',
                    mixBlendMode: 'normal',
                    backgroundColor: `${neon} !important`,
                    color: `${chipTextDark} !important`,
                    border: `1px solid ${alpha('#000', 0.2)}`,
                    fontWeight: 700,
                    height: dense ? 20 : 22,
                    boxShadow: isPrimary ? `0 0 8px ${a(neon, 0.35)}` : `0 0 6px ${a(neon, 0.15)}`,
                    transition: 'none',
                    '& .MuiChip-label': {
                      color: `${chipTextDark} !important`,
                      paddingLeft: 10,
                      paddingRight: 10,
                      letterSpacing: 0.2,
                    },
                    '& .MuiChip-icon, & .MuiChip-deleteIcon': {
                      color: `${chipTextDark} !important`,
                    },
                    '&:hover, &:active, &.Mui-focusVisible': {
                      backgroundColor: `${neon} !important`,
                      color: `${chipTextDark} !important`,
                      boxShadow: isPrimary ? `0 0 8px ${a(neon, 0.35)}` : `0 0 6px ${a(neon, 0.15)}`,
                    },
                  }}
                />
              )}

              {showProgress ? (
                <Box sx={{ mt: dense ? 0.25 : 0.4, width: '100%' }}>
                  <LinearProgress
                    className="progressRoot"
                    variant="determinate"
                    value={pct}
                    aria-label="Progression du parcours"
                    sx={{
                      height: dense ? 4 : 6,
                      borderRadius: 999,
                      backgroundColor: a(neon, 0.2),
                      boxShadow: `0 0 6px ${a(neon, 0.25)} inset`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: neon,
                        boxShadow: `0 0 10px ${a(neon, 0.9)}`,
                      },
                    }}
                  />

                  {/* LIGNE DE STATUT CENTRÉE, SANS rightNote */}
                  <Box sx={{ mt: 0.35, display: 'flex', justifyContent: 'center' }}>
                    <Typography
                      variant="caption"
                      className="accentText"
                      align="center"
                      sx={{
                        color: isPrimary ? neon : textSecondary,
                        textShadow: isPrimary ? `0 0 4px ${neon}` : 'none',
                        fontFamily: theme.typography.button.fontFamily,
                        fontSize: dense ? '0.7rem' : '0.75rem',
                      }}
                    >
                      {pct}% de progression
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography
                  variant="caption"
                  className="hintText"
                  sx={{ mt: dense ? 0.15 : 0.3, color: textSecondary }}
                >
                  {actionHint || 'Cliquer pour démarrer'}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </CardActionArea>
      </Box>

      {showMenu && (
        <Menu
          anchorEl={menuEl}
          open={openMenu}
          onClose={() => setMenuEl(null)}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((mi, idx) => (
            <MenuItem
              key={`${mi.label}-${idx}`}
              onClick={() => {
                setMenuEl(null);
                mi.onClick();
              }}
              sx={mi.danger ? { color: 'error.main' } : undefined}
            >
              {mi.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Card>
  );
}
