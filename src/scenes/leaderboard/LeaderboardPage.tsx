import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  Skeleton,
  Button,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { useNavigate } from "react-router-dom";

import {
  getLeaderboardTop,
  LeaderboardResponseDto,
} from "../../services/business/leaderboard/leaderboard.service";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();

  // --- leaderboard top
  const [lb, setLb] = useState<LeaderboardResponseDto | null>(null);
  const [loadingLb, setLoadingLb] = useState(false);
  const [errorLb, setErrorLb] = useState<string | null>(null);

  const myUserId = lb?.myUserId ?? null;

  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    setErrorLb(null);
    try {
      const data = await getLeaderboardTop(50);
      setLb(data);
    } catch (e) {
      console.error(e);
      setErrorLb("Impossible de charger le classement.");
    } finally {
      setLoadingLb(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const myRankLabel = useMemo(() => {
    if (!lb) return null;
    if (lb.myRank == null || lb.myXp == null) return null;
    return `#${lb.myRank} · ${lb.myXp} XP`;
  }, [lb]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "calc(100vh - var(--header-height) - var(--footer-height))",
        display: "flex",
        flexDirection: "column",
        py: 2,
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={2} sx={{ minHeight: 0, flex: 1 }}>
        {/* Title + My status */}
        <Card
          variant="outlined"
          sx={{
            backdropFilter: "blur(12px)",
            bgcolor: "rgba(32,32,32,0.7)",
          }}
        >
          <CardContent>
            <Stack spacing={1.25}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>
                    Classement
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                    Classement de ton organisation.
                  </Typography>

                  <Typography variant="caption" sx={{ opacity: 0.65, display: "block", mt: 0.75 }}>
                    {lb?.generatedAt ? `Mis à jour : ${formatDate(lb.generatedAt as any)}` : ""}
                  </Typography>
                </Box>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                  {myRankLabel ? (
                    <Chip
                      icon={<EmojiEventsRoundedIcon />}
                      label={myRankLabel}
                      variant="outlined"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  ) : (
                    <Chip
                      icon={<EmojiEventsRoundedIcon />}
                      label="—"
                      variant="outlined"
                      sx={{ alignSelf: "flex-start", opacity: 0.7 }}
                    />
                  )}

                  <Tooltip title="Rafraîchir le classement">
                    <span>
                      <IconButton
                        size="small"
                        onClick={loadLeaderboard}
                        disabled={loadingLb}
                        sx={{
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.04)",
                          outline: "1px solid rgba(255,255,255,0.10)",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                        }}
                      >
                        {loadingLb ? <CircularProgress size={16} /> : <RefreshRoundedIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>

              <Divider sx={{ opacity: 0.15 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Chip
                  icon={<BoltRoundedIcon />}
                  label={lb?.myXp != null ? `${lb.myXp} XP` : "XP —"}
                  variant="outlined"
                  sx={{ justifyContent: "flex-start" }}
                />

                <Chip
                  icon={<HistoryRoundedIcon />}
                  label="Historique : disponible dans le profil"
                  variant="outlined"
                  sx={{ justifyContent: "flex-start", flex: 1, opacity: 0.85 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Content */}
        <Box sx={{ minHeight: 0, overflowY: "auto", pb: 2 }}>
          <Stack spacing={1.5}>
            {errorLb && <Alert severity="error">{errorLb}</Alert>}

            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmojiEventsRoundedIcon />
                    <Typography sx={{ fontWeight: 900 }}>Top 50</Typography>
                    {loadingLb ? <CircularProgress size={16} /> : null}
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 1, opacity: 0.2 }} />

                {loadingLb && !lb ? (
                  <Stack spacing={1}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Skeleton variant="circular" width={36} height={36} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="60%" />
                          <Skeleton width="35%" />
                        </Box>
                        <Skeleton width={64} height={28} />
                      </Box>
                    ))}
                  </Stack>
                ) : !loadingLb && (lb?.entries?.length ?? 0) === 0 ? (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Aucun score pour l’instant.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {(lb?.entries ?? []).map((e) => {
                      const isMe = myUserId != null && e.userId === myUserId;

                      return (
                        <ListItem
                          key={e.userId}
                          sx={{
                            borderRadius: 2,
                            my: 0.6,
                            px: 1,
                            ...(isMe
                              ? {
                                  bgcolor: "rgba(255,255,255,0.06)",
                                  outline: "1px solid rgba(255,255,255,0.14)",
                                }
                              : {}),
                          }}
                          secondaryAction={
                            <Chip
                              size="small"
                              icon={<BoltRoundedIcon />}
                              label={`${e.xp} XP`}
                              variant={isMe ? "filled" : "outlined"}
                            />
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ fontWeight: 900 }}>{String(e.rank ?? "").slice(0, 2) || "—"}</Avatar>
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
                                <Typography sx={{ fontWeight: isMe ? 900 : 800 }}>
                                  #{e.rank} · {e.displayName}
                                </Typography>
                                {isMe ? <Chip size="small" label="Moi" /> : null}
                              </Stack>
                            }
                            secondary={e.lastEventAt ? `Dernier gain : ${formatDate(e.lastEventAt)}` : "Dernier gain : —"}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>

            <Button variant="outlined" onClick={() => navigate("/profile")} sx={{ borderRadius: 999 }}>
              Voir mon profil
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default LeaderboardPage;
